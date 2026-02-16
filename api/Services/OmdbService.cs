using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using movie_tracker_api.Models;

namespace movie_tracker_api.Services;

public interface IOmdbService
{
    Task<OmdbMovieDetail?> GetMovieDetailsAsync(string imdbId);
}

public class OmdbService : IOmdbService
{
    private readonly HttpClient _httpClient;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly PosterService _posterService;
    private readonly string _apiKey;

    public OmdbService(HttpClient httpClient, IConfiguration configuration, IServiceScopeFactory scopeFactory, PosterService posterService)
    {
        _httpClient = httpClient;
        _scopeFactory = scopeFactory;
        _posterService = posterService;
        _apiKey = configuration["OmdbSettings:ApiKey"] ?? string.Empty;
    }

    private async Task TrackUsageAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<movie_tracker_api.Data.AppDbContext>();
        
        var today = DateTime.Today;
        var usage = await context.ApiUsages.FirstOrDefaultAsync(u => u.Provider == "OMDb" && u.Date == today);
        if (usage == null)
        {
            usage = new ApiUsage { Provider = "OMDb", RequestCount = 1, Date = today };
            context.ApiUsages.Add(usage);
        }
        else
        {
            usage.RequestCount++;
        }
        await context.SaveChangesAsync();
    }

    public async Task<OmdbMovieDetail?> GetMovieDetailsAsync(string imdbId)
    {
        if (string.IsNullOrEmpty(_apiKey) || _apiKey == "YOUR_OMDB_API_KEY_HERE")
        {
            return null;
        }

        await TrackUsageAsync();

        // Add 'tt' prefix if it's missing (MovieLens ids are just numbers usually)
        if (!imdbId.StartsWith("tt"))
        {
            // Pad to at least 7 digits as per IMDb convention
            imdbId = "tt" + imdbId.PadLeft(7, '0');
        }

        try
        {
            var response = await _httpClient.GetAsync($"http://www.omdbapi.com/?apikey={_apiKey}&i={imdbId}&plot=full");
            if (response.IsSuccessStatusCode)
            {
                var detail = await response.Content.ReadFromJsonAsync<OmdbMovieDetail>();
                if (detail?.Response == "True")
                {
                    // Cache the poster locally and return local path
                    var localPosterUrl = await _posterService.DownloadPosterAsync(detail.Poster, detail.ImdbId);
                    if (!string.IsNullOrEmpty(localPosterUrl))
                    {
                        detail.Poster = localPosterUrl;
                    }
                    return detail;
                }
            }
        }
        catch (Exception ex)
        {
            // Log error
            Console.WriteLine($"Error fetching from OMDb: {ex.Message}");
        }

        return null;
    }
}
