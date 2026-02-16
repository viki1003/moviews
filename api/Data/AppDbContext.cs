using Microsoft.EntityFrameworkCore;
using movie_tracker_api.Models;

namespace movie_tracker_api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Movie> Movies { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserMovie> UserMovies { get; set; }
    public DbSet<ApiUsage> ApiUsages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserMovie>()
            .HasKey(um => new { um.UserId, um.MovieId });

        modelBuilder.Entity<UserMovie>()
            .HasOne(um => um.User)
            .WithMany(u => u.UserMovies)
            .HasForeignKey(um => um.UserId);

        modelBuilder.Entity<UserMovie>()
            .HasOne(um => um.Movie)
            .WithMany() // Assuming Movie doesn't need a collection of UserMovies for now to keep it simple, or we can add it.
            .HasForeignKey(um => um.MovieId);
    }
}
