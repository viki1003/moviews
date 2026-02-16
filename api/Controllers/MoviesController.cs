using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using movie_tracker_api.Data;
using movie_tracker_api.Models;
using movie_tracker_api.Services;

namespace movie_tracker_api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly movie_tracker_api.Services.IOmdbService _omdbService;

    public MoviesController(AppDbContext context, movie_tracker_api.Services.IOmdbService omdbService)
    {
        _context = context;
        _omdbService = omdbService;
    }

    // GET: api/Movies/5/details
    [HttpGet("{id}/details")]
    public async Task<ActionResult<OmdbMovieDetail>> GetMovieDetails(int id)
    {
        var movie = await _context.Movies.FindAsync(id);
        if (movie == null || string.IsNullOrEmpty(movie.ImdbId))
        {
            return NotFound();
        }

        var details = await _omdbService.GetMovieDetailsAsync(movie.ImdbId);
        if (details == null)
        {
            return NotFound("Could not fetch details from OMDb. Please check API key.");
        }

        return Ok(details);
    }

    // GET: api/Movies
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Movie>>> GetMovies(
        [FromQuery] string? query, 
        [FromQuery] string? genre,
        [FromQuery] double? minRating,
        [FromQuery] int? year,
        [FromQuery] string? language)
    {
        var moviesQuery = _context.Movies.AsQueryable();

        if (!string.IsNullOrEmpty(query))
        {
            moviesQuery = moviesQuery.Where(m => m.Title.Contains(query));
        }

        if (!string.IsNullOrEmpty(genre))
        {
            moviesQuery = moviesQuery.Where(m => m.Genre.Contains(genre));
        }

        if (!string.IsNullOrEmpty(language))
        {
            moviesQuery = moviesQuery.Where(m => m.Language != null && m.Language.Contains(language));
        }

        if (minRating.HasValue)
        {
            moviesQuery = moviesQuery.Where(m => m.AverageRating >= minRating.Value);
        }

        if (year.HasValue)
        {
            moviesQuery = moviesQuery.Where(m => m.Year == year.Value);
        }

        return await moviesQuery.ToListAsync();
    }

    // GET: api/Movies/top
    [HttpGet("top")]
    public async Task<ActionResult<IEnumerable<Movie>>> GetTopMovies()
    {
        return await _context.Movies
            .OrderByDescending(m => m.AverageRating)
            .Take(10)
            .ToListAsync();
    }

    // GET: api/Movies/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Movie>> GetMovie(int id)
    {
        var movie = await _context.Movies.FindAsync(id);

        if (movie == null)
        {
            return NotFound();
        }

        return movie;
    }

    // PUT: api/Movies/5
    // PUT: api/Movies/5
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutMovie(int id, Movie movie)
    {
        if (id != movie.Id)
        {
            return BadRequest();
        }

        _context.Entry(movie).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!MovieExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // POST: api/Movies
    // POST: api/Movies
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Movie>> PostMovie(Movie movie)
    {
        _context.Movies.Add(movie);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetMovie", new { id = movie.Id }, movie);
    }

    // DELETE: api/Movies/5
    // DELETE: api/Movies/5
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        var movie = await _context.Movies.FindAsync(id);
        if (movie == null)
        {
            return NotFound();
        }

        _context.Movies.Remove(movie);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool MovieExists(int id)
    {
        return _context.Movies.Any(e => e.Id == id);
    }
}
