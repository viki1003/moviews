using System.ComponentModel.DataAnnotations;

namespace movie_tracker_api.Models;

public class ApiUsage
{
    [Key]
    public int Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public DateTime Date { get; set; } = DateTime.Today;
}
