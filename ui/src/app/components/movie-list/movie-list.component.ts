import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { MovieFormComponent } from '../movie-form/movie-form.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, MovieFormComponent],
  template: `
    <div class="list-container">
      <div class="toolbar">
        <h2>Admin Dashboard</h2>
        @if (authService.isAdmin() && !showForm()) {
          <button class="btn-primary" (click)="showForm.set(true)">
            + Add Movie
          </button>
        }
      </div>

      @if (showForm()) {
        <app-movie-form 
          [movie]="selectedMovie()" 
          (save)="onSave($event)" 
          (cancel)="onCancel()"
        />
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading your movies...</p>
        </div>
      }

      @if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button (click)="loadMovies()">Try Again</button>
        </div>
      }

      @if (!loading() && !error()) {
        @if (movies().length === 0) {
          <div class="empty-state">
            <p>No movies tracked yet.</p>
            <button (click)="showForm.set(true)">Start your collection</button>
          </div>
        } @else {
          <div class="movie-grid">
            @for (movie of movies(); track movie.id) {
              <div class="movie-card fade-in">
                <div class="card-content">
                  <div class="movie-header">
                    <h3>{{ movie.title }}</h3>
                    <span class="badger">{{ movie.year }}</span>
                  </div>
                  <p class="genre">{{ movie.genre }}</p>
                </div>
                @if (authService.isAdmin()) {
                  <div class="card-actions">
                    <button class="btn-icon" (click)="editMovie(movie)" title="Edit">✏️</button>
                    <button class="btn-icon delete" (click)="deleteMovie(movie.id)" title="Delete">🗑️</button>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .list-container {
      animation: fadeIn 0.5s ease-out;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .btn-add {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
    }

    .btn-add:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.5);
    }

    .movie-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .movie-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    .movie-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      border-color: var(--primary);
    }

    .movie-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .movie-header h3 {
      font-size: 1.25rem;
      margin: 0;
      line-height: 1.4;
    }

    .badger {
      background: rgba(99, 102, 241, 0.1);
      color: #818cf8;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .genre {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.95rem;
    }

    .card-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .movie-card:hover .card-actions {
      opacity: 1;
    }

    .btn-icon {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s;
      color: var(--text-primary);
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-icon.delete:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class MovieListComponent {
  private movieService = inject(MovieService);
  protected authService = inject(AuthService);

  movies = signal<Movie[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  showForm = signal<boolean>(false);
  selectedMovie = signal<Movie | null>(null);

  constructor() {
    this.loadMovies();
  }

  loadMovies() {
    this.loading.set(true);
    this.error.set(null);
    this.movieService.getMovies().subscribe({
      next: (data) => {
        this.movies.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading movies', err);
        this.error.set('Could not load movies. Please ensure the API is running.');
        this.loading.set(false);
      }
    });
  }

  onSave(movieData: Omit<Movie, 'id'>) {
    if (this.selectedMovie()) {
      // Update
      const id = this.selectedMovie()!.id;
      this.movieService.updateMovie(id, { ...movieData, id }).subscribe({
        next: () => {
          this.movies.update(current =>
            current.map(m => m.id === id ? { ...movieData, id } : m)
          );
          this.closeForm();
        },
        error: (err) => console.error('Error updating movie', err)
      });
    } else {
      // Create
      // Backend ignores ID on create, but we satisfy the interface
      const newMovie = { ...movieData, id: 0 };
      this.movieService.createMovie(newMovie).subscribe({
        next: (createdMovie) => {
          this.movies.update(current => [...current, createdMovie]);
          this.closeForm();
        },
        error: (err) => console.error('Error creating movie', err)
      });
    }
  }

  editMovie(movie: Movie) {
    this.selectedMovie.set(movie);
    this.showForm.set(true);
  }

  deleteMovie(id: number) {
    if (confirm('Delete this movie?')) {
      this.movieService.deleteMovie(id).subscribe({
        next: () => {
          this.movies.update(current => current.filter(m => m.id !== id));
        },
        error: (err) => {
          console.error('Error deleting movie', err);
          alert('Failed to delete movie');
        }
      });
    }
  }

  onCancel() {
    this.closeForm();
  }

  private closeForm() {
    this.showForm.set(false);
    this.selectedMovie.set(null);
  }
}
