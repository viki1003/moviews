using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using movie_tracker_api.Data;
using movie_tracker_api.Models;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace movie_tracker_api.Services;

public class DataImportService
{
    private readonly AppDbContext _context;
    private readonly ILogger<DataImportService> _logger;

    public DataImportService(AppDbContext context, ILogger<DataImportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> ImportKaggleMoviesAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("CSV file not found", filePath);
        }

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            HeaderValidated = null,
            MissingFieldFound = null,
        };

        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, config);

        var records = csv.GetRecords<dynamic>();
        var moviesToImport = new List<Movie>();
        int count = 0;

        foreach (var record in records)
        {
            try
            {
                var dict = (IDictionary<string, object>)record;
                
                string title = dict.ContainsKey("original_title") ? dict["original_title"]?.ToString() ?? "Unknown" : "Unknown";
                string releaseDateStr = dict.ContainsKey("release_date") ? dict["release_date"]?.ToString() ?? "" : "";
                string genresJson = dict.ContainsKey("genres") ? dict["genres"]?.ToString() ?? "[]" : "[]";

                int year = 0;
                if (DateTime.TryParse(releaseDateStr, out var releaseDate))
                {
                    year = releaseDate.Year;
                }

                var genresObj = JsonConvert.DeserializeObject<List<GenreInfo>>(genresJson);
                string genres = genresObj != null ? string.Join(", ", genresObj.Select(g => g.Name)) : "";

                moviesToImport.Add(new Movie
                {
                    Title = title,
                    Year = year,
                    Genre = genres,
                    Logic = "" // Placeholder
                });

                count++;

                // Batch save to avoid memory issues with 45k records
                if (moviesToImport.Count >= 1000)
                {
                    await BatchInsertAsync(moviesToImport);
                    moviesToImport.Clear();
                    _logger.LogInformation("Imported {Count} movies so far...", count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error parsing record: {Message}", ex.Message);
            }
        }

        if (moviesToImport.Count > 0)
        {
            await BatchInsertAsync(moviesToImport);
        }

        return count;
    }

    public async Task<int> ImportMovieLensMoviesAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("CSV file not found", filePath);
        }

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            HeaderValidated = null,
            MissingFieldFound = null,
        };

        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, config);

        var records = csv.GetRecords<dynamic>();
        var moviesToImport = new List<Movie>();
        int count = 0;

        foreach (var record in records)
        {
            try
            {
                var dict = (IDictionary<string, object>)record;
                
                // Format: movieId,title,genres
                // title: Toy Story (1995)
                // genres: Adventure|Animation|Children|Comedy|Fantasy
                
                string fullTitle = dict.ContainsKey("title") ? dict["title"]?.ToString() ?? "Unknown" : "Unknown";
                string genresPipe = dict.ContainsKey("genres") ? dict["genres"]?.ToString() ?? "" : "";

                // Extract Year from "(1995)"
                int year = 0;
                string title = fullTitle;
                if (fullTitle.Length > 6 && fullTitle.EndsWith(")"))
                {
                    var yearPart = fullTitle.Substring(fullTitle.Length - 5, 4);
                    if (int.TryParse(yearPart, out var parsedYear))
                    {
                        year = parsedYear;
                        title = fullTitle.Substring(0, fullTitle.Length - 6).Trim();
                    }
                }

                string genres = genresPipe.Replace("|", ", ");

                moviesToImport.Add(new Movie
                {
                    Title = title,
                    Year = year,
                    Genre = genres,
                    Logic = "" 
                });

                count++;

                if (moviesToImport.Count >= 1000)
                {
                    await BatchInsertAsync(moviesToImport);
                    moviesToImport.Clear();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error parsing record: {Message}", ex.Message);
            }
        }

        if (moviesToImport.Count > 0)
        {
            await BatchInsertAsync(moviesToImport);
        }

        return count;
    }

    public async Task<int> ImportAdvancedDataAsync(string moviesPath, string linksPath, string ratingsPath)
    {
        if (!File.Exists(moviesPath) || !File.Exists(linksPath) || !File.Exists(ratingsPath))
        {
            throw new FileNotFoundException("One or more CSV files not found.");
        }

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            HeaderValidated = null,
            MissingFieldFound = null,
        };

        _logger.LogInformation("Starting advanced import. This may take a while...");

        // 1. Load Links (movieId -> tmdbId, imdbId)
        var links = new Dictionary<int, (string? ImdbId, string? TmdbId)>();
        using (var reader = new StreamReader(linksPath))
        using (var csv = new CsvReader(reader, config))
        {
            var records = csv.GetRecords<dynamic>();
            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;
                if (int.TryParse(dict["movieId"]?.ToString(), out int mid))
                {
                    links[mid] = (dict["imdbId"]?.ToString(), dict["tmdbId"]?.ToString());
                }
            }
        }
        _logger.LogInformation("Loaded {Count} links.", links.Count);

        // 2. Aggregate Ratings (movieId -> averageRating, count)
        // Note: For 33M ratings, we process this stream-style to save memory
        var ratings = new Dictionary<int, (double Sum, int Count)>();
        using (var reader = new StreamReader(ratingsPath))
        using (var csv = new CsvReader(reader, config))
        {
            var records = csv.GetRecords<dynamic>();
            int rCount = 0;
            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;
                if (int.TryParse(dict["movieId"]?.ToString(), out int mid) && 
                    double.TryParse(dict["rating"]?.ToString(), out double r))
                {
                    if (!ratings.ContainsKey(mid)) ratings[mid] = (0, 0);
                    var current = ratings[mid];
                    ratings[mid] = (current.Sum + r, current.Count + 1);
                }
                rCount++;
                if (rCount % 1000000 == 0) _logger.LogInformation("Processed {Count}M ratings...", rCount / 1000000);
            }
        }
        _logger.LogInformation("Aggregated ratings for {Count} movies.", ratings.Count);

        // 3. Process Movies and Join Data
        using (var reader = new StreamReader(moviesPath))
        using (var csv = new CsvReader(reader, config))
        {
            var records = csv.GetRecords<dynamic>();
            var moviesToImport = new List<Movie>();
            int count = 0;

            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;
                if (!int.TryParse(dict["movieId"]?.ToString(), out int mid)) continue;

                string fullTitle = dict["title"]?.ToString() ?? "Unknown";
                string genresPipe = dict["genres"]?.ToString() ?? "";

                int year = 0;
                string title = fullTitle;
                if (fullTitle.Length > 6 && fullTitle.EndsWith(")"))
                {
                    var yearPart = fullTitle.Substring(fullTitle.Length - 5, 4);
                    if (int.TryParse(yearPart, out var parsedYear))
                    {
                        year = parsedYear;
                        title = fullTitle.Substring(0, fullTitle.Length - 6).Trim();
                    }
                }

                var movie = new Movie
                {
                    Title = title,
                    Year = year,
                    Genre = genresPipe.Replace("|", ", "),
                    Logic = ""
                };

                if (links.TryGetValue(mid, out var link))
                {
                    movie.ImdbId = link.ImdbId;
                    movie.TmdbId = link.TmdbId;
                }

                if (ratings.TryGetValue(mid, out var rating))
                {
                    movie.AverageRating = Math.Round(rating.Sum / rating.Count, 1);
                    movie.VoteCount = rating.Count;
                }

                moviesToImport.Add(movie);
                count++;

                if (moviesToImport.Count >= 1000)
                {
                    await BatchInsertAsync(moviesToImport);
                    moviesToImport.Clear();
                }
            }

            if (moviesToImport.Count > 0)
            {
                await BatchInsertAsync(moviesToImport);
            }

            return count;
        }
    }

    private async Task BatchInsertAsync(List<Movie> movies)
    {
        _context.Movies.AddRange(movies);
        await _context.SaveChangesAsync();
    }

    private class GenreInfo
    {
        public string Name { get; set; } = "";
    }
}
