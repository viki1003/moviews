using System.ComponentModel.DataAnnotations;

namespace movie_tracker_api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Username { get; set; }

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public required string Email { get; set; }

    // In a real app, this should be a salted hash. 
    // For this demo, we'll store it as a string but still treat it securely in logic.
    [Required]
    public required string PasswordHash { get; set; }

    public string Role { get; set; } = "User";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public List<UserMovie> UserMovies { get; set; } = new();
}
