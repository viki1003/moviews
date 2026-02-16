using System.ComponentModel.DataAnnotations;

namespace movie_tracker_api.Models;

public class UserMovie
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int MovieId { get; set; }
    public Movie Movie { get; set; } = null!;

    public bool IsFavorite { get; set; }
    
    // 0-5 rating, for example
    public int? Rating { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    public DateTime? WatchedAt { get; set; }
}
