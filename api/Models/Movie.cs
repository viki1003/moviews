namespace movie_tracker_api.Models;

public class Movie
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int Year { get; set; }
    public string Genre { get; set; } = string.Empty;
    public string Logic { get; set; } = string.Empty;
    public string? ImdbId { get; set; }
    public string? TmdbId { get; set; }
    public double AverageRating { get; set; }
    public int VoteCount { get; set; }
    public string? Language { get; set; }
}
