import { Component, inject, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieService } from '../../services/movie.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1>Discover Your Next <span class="gradient-text">Masterpiece</span></h1>
        <p>Track, rate, and explore the cinematic world with ease.</p>
        
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search by title, director, or keyword..."
          >
        </div>
      </div>
    </section>

    <div class="main-layout">
      <!-- Sidebar Filters -->
      <aside class="sidebar">
        <div class="filter-group">
          <h3 class="filter-label">Genres</h3>
          <div class="filter-options scrollable">
            <button 
              class="filter-chip" 
              [class.active]="selectedGenre() === ''"
              (click)="selectedGenre.set('')"
            >All Genres</button>
            @for (genre of genres; track genre) {
              <button 
                class="filter-chip" 
                [class.active]="selectedGenre() === genre"
                (click)="selectedGenre.set(genre)"
              >{{ genre }}</button>
            }
          </div>
        </div>

        <div class="filter-group">
          <h3 class="filter-label">Language</h3>
          <select [ngModel]="selectedLanguage()" (ngModelChange)="selectedLanguage.set($event)" class="sidebar-select">
            <option value="">All Languages</option>
            @for (lang of languages; track lang) {
              <option [value]="lang">{{ lang }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <h3 class="filter-label">Minimum Rating</h3>
          <div class="rating-filter">
            @for (rate of [4, 3, 2, 1]; track rate) {
              <button 
                class="filter-chip" 
                [class.active]="minRating() === rate"
                (click)="minRating.set(minRating() === rate ? 0 : rate)"
              >
                {{ rate }}+ <span class="star">★</span>
              </button>
            }
          </div>
        </div>

        <div class="filter-group">
          <h3 class="filter-label">Release Year</h3>
          <select [ngModel]="selectedYear()" (ngModelChange)="selectedYear.set($event)" class="sidebar-select">
            <option [value]="0">All Years</option>
            @for (year of years; track year) {
              <option [value]="year">{{ year }}</option>
            }
          </select>
        </div>

        <button class="reset-btn" (click)="resetFilters()">Reset All Filters</button>
      </aside>

      <!-- Movie Content -->
      <main class="content-area">
        <div class="results-header">
          <h2 class="section-title">
            @if (isSearching()) {
              Search Results
            } @else {
              Top 10 Masterpieces
            }
          </h2>
          <span class="count-badge" *ngIf="movies().length > 0">{{ movies().length }} movies found</span>
        </div>
        
        @if (movies(); as movieList) {
          <div class="movie-grid">
            @for (movie of movieList; track movie.id) {
              <div class="movie-card" [routerLink]="['/movie', movie.id]" style="cursor: pointer;">
                <div class="card-image">
                  @if (movie.imdbId && !failedLocalPosters().has(movie.id)) {
                    <img [src]="getLocalPosterUrl(movie.imdbId)" [alt]="movie.title" loading="lazy" (error)="onLocalPosterError(movie.id)">
                  } @else {
                    <div class="custom-placeholder">
                      <div class="placeholder-content">
                        <span class="placeholder-title">{{ movie.title }}</span>
                        <span class="placeholder-year">{{ movie.year }}</span>
                      </div>
                      <div class="placeholder-overlay"></div>
                    </div>
                  }
                  
                  <div class="rating-badge">
                    <span class="star">★</span>
                    <span class="rating-value">{{ movie.averageRating || 'N/A' }}</span>
                  </div>
                  <span class="movie-year-tag">{{ movie.year }}</span>
                </div>
                <div class="card-info">
                  <h3 [title]="movie.title">{{ movie.title }}</h3>
                  <div class="genre-list">
                    @for (g of movie.genre.split(', '); track g) {
                      <span class="genre-tag">{{ g }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          
          @if (movieList.length === 0) {
            <div class="no-results">
              <span class="no-results-icon">🎞️</span>
              <h3>No movies found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button class="reset-btn-compact" (click)="resetFilters()">Clear Filters</button>
            </div>
          }
        } @else {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Gathering masterpieces...</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Outfit', sans-serif;
      --sidebar-width: 280px;
    }

    .hero {
      height: 40vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: linear-gradient(to bottom, rgba(15, 23, 42, 0.7), var(--background)),
                  url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
      margin-bottom: 0;
    }

    .hero-content {
      width: 100%;
      max-width: 800px;
      padding: 0 2rem;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .gradient-text {
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      font-size: 1.25rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.75rem 1.5rem;
      border-radius: 100px;
      max-width: 600px;
      margin: 0 auto;
      transition: all 0.3s ease;
    }

    .search-bar:focus-within {
      background: rgba(30, 41, 59, 1);
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.2);
    }

    .search-bar input {
      background: transparent;
      border: none;
      color: white;
      flex: 1;
      padding: 0.5rem 1rem;
      font-size: 1.1rem;
      outline: none;
    }

    .search-icon { font-size: 1.2rem; }

    .main-layout {
      display: flex;
      max-width: 1600px;
      margin: 0 auto;
      padding: 3rem 2rem;
      gap: 3rem;
    }

    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      position: sticky;
      top: 100px;
      height: fit-content;
    }

    .filter-group {
      margin-bottom: 2.5rem;
    }

    .filter-label {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-options.scrollable {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .filter-chip {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-chip:hover {
      border-color: var(--primary);
      background: rgba(129, 140, 248, 0.1);
    }

    .filter-chip.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .sidebar-select {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.75rem;
      border-radius: 8px;
      outline: none;
      cursor: pointer;
    }

    .reset-btn {
      width: 100%;
      padding: 0.75rem;
      background: transparent;
      border: 1px dashed var(--border);
      color: var(--text-muted);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .reset-btn:hover {
      border-color: #ef4444;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    .content-area {
      flex: 1;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }

    .count-badge {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .movie-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 2rem;
    }

    .movie-card {
      background: var(--surface);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .movie-card:hover {
      transform: translateY(-12px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border-color: var(--primary);
    }

    .card-image {
      aspect-ratio: 2/3;
      position: relative;
      background: #1e293b;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .custom-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      position: relative;
    }

    .placeholder-content {
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .placeholder-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-height: 5.2em;
    }

    .placeholder-year {
      color: var(--primary-light);
      font-weight: 600;
    }

    .placeholder-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
    }

    .rating-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: #fbbf24;
      color: #000;
      padding: 0.4rem 0.8rem;
      border-radius: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      z-index: 10;
    }

    .movie-year-tag {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(129, 140, 248, 0.9);
      backdrop-filter: blur(8px);
      color: white;
      padding: 0.35rem 0.8rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 800;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10;
    }

    .card-info {
      padding: 1.5rem;
    }

    .card-info h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .genre-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .genre-tag {
      font-size: 0.7rem;
      background: rgba(129, 140, 248, 0.1);
      color: #a5b4fc;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10rem 0;
      color: var(--text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(129, 140, 248, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 6rem 2rem;
      background: var(--surface);
      border-radius: 24px;
      border: 1px dashed var(--border);
    }

    .no-results-icon { font-size: 4rem; margin-bottom: 1.5rem; display: block; }
    .no-results h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .no-results p { color: var(--text-muted); margin-bottom: 2rem; }

    .reset-btn-compact {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .main-layout { flex-direction: column; }
      .sidebar { width: 100%; position: static; }
      .filter-options { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 1rem; }
      .filter-chip { flex-shrink: 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly movieService = inject(MovieService);

  readonly searchQuery = signal('');
  readonly selectedGenre = signal('');
  readonly selectedLanguage = signal('');
  readonly minRating = signal(0);
  readonly selectedYear = signal(0);
  readonly movies = signal<any[]>([]);
  readonly failedLocalPosters = signal<Set<number>>(new Set());

  readonly genres = [
    'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Musical',
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
  ];

  readonly languages = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Japanese',
    'Korean', 'Mandarin', 'Cantonese', 'Russian', 'Hindi', 'Tamil'
  ];

  readonly years = Array.from({ length: 126 }, (_, i) => 2025 - i); // From 2025 back to 1900

  readonly isSearching = computed(() =>
    this.searchQuery().length > 0 ||
    this.selectedGenre() !== '' ||
    this.selectedLanguage() !== '' ||
    this.minRating() > 0 ||
    this.selectedYear() > 0
  );

  constructor() {
    // We use an observable stream for searching to easily apply debouncing
    combineLatest([
      toObservable(this.searchQuery),
      toObservable(this.selectedGenre),
      toObservable(this.selectedLanguage),
      toObservable(this.minRating),
      toObservable(this.selectedYear)
    ]).pipe(
      debounceTime(500), // Increased to 500ms for stability
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      switchMap(([query, genre, language, rating, year]) => {
        if (this.isSearching()) {
          return this.movieService.getMovies(query, genre, rating, year > 0 ? year : undefined, language);
        } else {
          return this.movieService.getTopMovies();
        }
      })
    ).subscribe(data => {
      this.movies.set(data);
    });
  }

  getLocalPosterUrl(imdbId: string): string {
    if (!imdbId) return '';
    const id = imdbId.startsWith('tt') ? imdbId : `tt${imdbId.padStart(7, '0')}`;
    return `${this.movieService.apiBaseUrl}/posters/${id}.jpg`;
  }

  onLocalPosterError(movieId: number) {
    this.failedLocalPosters.update(prev => {
      const next = new Set(prev);
      next.add(movieId);
      return next;
    });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedGenre.set('');
    this.selectedLanguage.set('');
    this.minRating.set(0);
    this.selectedYear.set(0);
    this.failedLocalPosters.set(new Set());
  }
}
