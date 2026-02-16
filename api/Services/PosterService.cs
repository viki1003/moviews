using System.Net.Http;
using Microsoft.AspNetCore.Hosting;

namespace movie_tracker_api.Services;

public class PosterService
{
    private readonly HttpClient _httpClient;
    private readonly IWebHostEnvironment _environment;
    private readonly string _posterFolder;

    public PosterService(HttpClient httpClient, IWebHostEnvironment environment)
    {
        _httpClient = httpClient;
        _environment = environment;
        _posterFolder = Path.Combine(_environment.WebRootPath, "posters");
        
        if (!Directory.Exists(_posterFolder))
        {
            Directory.CreateDirectory(_posterFolder);
        }
    }

    public async Task<string?> DownloadPosterAsync(string? url, string id)
    {
        if (string.IsNullOrEmpty(url) || url == "N/A") return null;

        var fileName = $"{id}{Path.GetExtension(url.Split('?')[0])}";
        var filePath = Path.Combine(_posterFolder, fileName);

        if (File.Exists(filePath))
        {
            return $"/posters/{fileName}";
        }

        try
        {
            var data = await _httpClient.GetByteArrayAsync(url);
            await File.WriteAllBytesAsync(filePath, data);
            return $"/posters/{fileName}";
        }
        catch
        {
            return null;
        }
    }
}
