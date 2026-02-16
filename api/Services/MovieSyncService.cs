using Microsoft.EntityFrameworkCore;
using movie_tracker_api.Data;
using movie_tracker_api.Models;

namespace movie_tracker_api.Services;

public class MovieSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MovieSyncService> _logger;
    private readonly PosterService _posterService;
    private readonly string _apiKey;

    public MovieSyncService(IServiceProvider serviceProvider, ILogger<MovieSyncService> logger, IConfiguration configuration, PosterService posterService)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _posterService = posterService;
        _apiKey = configuration["OmdbSettings:ApiKey"] ?? string.Empty;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Movie Sync Service starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncMoviesInternalAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during movie sync");
            }

            // Wait 24 hours
            _logger.LogInformation("Sync finished. Waiting 24 hours for next update.");
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    public async Task<int> SyncMoviesInternalAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(_apiKey) || _apiKey == "YOUR_OMDB_API_KEY_HERE")
        {
            _logger.LogWarning("OMDb API Key not configured. Skipping sync.");
            return 0;
        }

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();

        int currentYear = DateTime.Now.Year;
        _logger.LogInformation("Syncing new movies for year {Year}", currentYear);

        // OMDb Search for movies in the current year
        // We use 's=movie' and 'y=2025'
        var response = await httpClient.GetAsync($"http://www.omdbapi.com/?apikey={_apiKey}&s=movie&y={currentYear}", stoppingToken);
        int addedCount = 0;

        if (response.IsSuccessStatusCode)
        {
            var searchResult = await response.Content.ReadFromJsonAsync<OmdbSearchResponse>(cancellationToken: stoppingToken);
            if (searchResult?.Search != null)
            {
                foreach (var item in searchResult.Search)
                {
                    if (await context.Movies.AnyAsync(m => m.ImdbId == item.imdbID, stoppingToken)) continue;

                    // Get full details to get Genre and precise data
                    var detailResponse = await httpClient.GetAsync($"http://www.omdbapi.com/?apikey={_apiKey}&i={item.imdbID}", stoppingToken);
                    if (detailResponse.IsSuccessStatusCode)
                    {
                        var details = await detailResponse.Content.ReadFromJsonAsync<OmdbMovieDetail>(cancellationToken: stoppingToken);
                        if (details != null && details.Response == "True")
                        {
                            var movie = new Movie
                            {
                                Title = details.Title,
                                Year = int.TryParse(details.Year, out int y) ? y : currentYear,
                                Genre = details.Genre,
                                ImdbId = details.ImdbId,
                                AverageRating = double.TryParse(details.ImdbRating, out double r) ? r : 0,
                                VoteCount = int.TryParse(details.ImdbVotes?.Replace(",", ""), out int v) ? v : 0,
                                Language = details.Language,
                                Logic = "Auto-Synced"
                            };
                            context.Movies.Add(movie);
                            addedCount++;

                            // Download poster immediately if available from OMDb details
                            if (!string.IsNullOrEmpty(details.Poster) && details.Poster != "N/A")
                            {
                                await _posterService.DownloadPosterAsync(details.Poster, details.ImdbId);
                            }
                        }
                    }
                }
                await context.SaveChangesAsync(stoppingToken);
            }
        }

        return addedCount;
    }

    private class OmdbSearchResponse
    {
        public List<OmdbSearchResult>? Search { get; set; }
        public string? Response { get; set; }
    }

    private class OmdbSearchResult
    {
        public string Title { get; set; } = "";
        public string Year { get; set; } = "";
        public string imdbID { get; set; } = "";
    }
}
