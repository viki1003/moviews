using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using movie_tracker_api.Services;

namespace movie_tracker_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly DataImportService _importService;
    private readonly MovieSyncService _syncService;
    private readonly movie_tracker_api.Data.AppDbContext _context;

    public ImportController(DataImportService importService, MovieSyncService syncService, movie_tracker_api.Data.AppDbContext context)
    {
        _importService = importService;
        _syncService = syncService;
        _context = context;
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage()
    {
        var today = DateTime.Today;
        var usage = await _context.ApiUsages
            .Where(u => u.Date == today)
            .ToListAsync();
        return Ok(usage);
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncMovies()
    {
        try
        {
            int count = await _syncService.SyncMoviesInternalAsync(CancellationToken.None);
            return Ok(new { Message = $"Sync completed. Added {count} new movies.", Count = count });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("kaggle")]
    public async Task<IActionResult> ImportKaggle([FromQuery] string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
        {
            return BadRequest("File path is required.");
        }

        try
        {
            int count = await _importService.ImportKaggleMoviesAsync(filePath);
            return Ok(new { Message = $"Successfully imported {count} movies.", Count = count });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("movielens")]
    public async Task<IActionResult> ImportMovieLens([FromQuery] string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
        {
            return BadRequest("File path is required.");
        }

        try
        {
            int count = await _importService.ImportMovieLensMoviesAsync(filePath);
            return Ok(new { Message = $"Successfully imported {count} movies.", Count = count });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("advanced")]
    public async Task<IActionResult> ImportAdvanced([FromQuery] string moviesPath, [FromQuery] string linksPath, [FromQuery] string ratingsPath)
    {
        if (string.IsNullOrEmpty(moviesPath) || string.IsNullOrEmpty(linksPath) || string.IsNullOrEmpty(ratingsPath))
        {
            return BadRequest("All file paths (movies, links, ratings) are required.");
        }

        try
        {
            int count = await _importService.ImportAdvancedDataAsync(moviesPath, linksPath, ratingsPath);
            return Ok(new { Message = $"Successfully imported {count} enhanced movies.", Count = count });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
