import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-container" *ngIf="movieDetails() as details; else loading">
      <!-- High-res Backdrop -->
      <div 
        class="backdrop" 
        [style.backgroundImage]="'url(' + getFullPosterUrl(details.Poster) + ')'"
      ></div>
      <div class="backdrop-overlay"></div>

      <div class="content-wrapper">
        <a routerLink="/" class="back-link">← Back to Discover</a>
        
        <div class="main-info">
          <div class="poster-side">
            <img [src]="getFullPosterUrl(details.Poster)" [alt]="details.Title" class="main-poster">
          </div>
          
          <div class="text-side">
            <div class="badges">
              <span class="badge">{{ details.Rated }}</span>
              <span class="badge">{{ details.Runtime }}</span>
              <span class="badge">{{ details.Year }}</span>
            </div>
            
            <h1 class="movie-title">{{ details.Title }}</h1>
            <p class="tagline" *ngIf="details.Genre">{{ details.Genre }}</p>
            
            <div class="ratings-row">
              <div class="rating-box community">
                <span class="rating-source">Community</span>
                <div class="rating-value">
                  <span class="star">★</span>
                  {{ details.imdbRating }}
                </div>
              </div>
              @for (rating of details.Ratings; track rating.Source) {
                <div class="rating-box" [class.rt]="rating.Source === 'Rotten Tomatoes'">
                  <span class="rating-source">{{ rating.Source }}</span>
                  <div class="rating-value">{{ rating.Value }}</div>
                </div>
              }
            </div>

            <div class="overview">
              <h3>Overview</h3>
              <p>{{ details.Plot }}</p>
            </div>

            <div class="credits">
              <div class="credit-item">
                <span class="label">Director</span>
                <span class="value">{{ details.Director }}</span>
              </div>
              <div class="credit-item">
                <span class="label">Writers</span>
                <span class="value">{{ details.Writer }}</span>
              </div>
              <div class="credit-item">
                <span class="label">Cast</span>
                <span class="value">{{ details.Actors }}</span>
              </div>
              <div class="credit-item" *ngIf="details.Awards !== 'N/A'">
                <span class="label">Awards</span>
                <span class="value accent">{{ details.Awards }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Polishing the lenses...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      color: white;
    }

    .detail-container {
      position: relative;
      min-height: 100vh;
      padding: 4rem 2rem;
      overflow-x: hidden;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background-size: cover;
      background-position: center 20%;
      filter: blur(80px) saturate(1.5);
      opacity: 0.3;
      transform: scale(1.1);
      z-index: -2;
    }

    .backdrop-overlay {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 70% 30%, transparent 0%, var(--bg-dark) 80%);
      z-index: -1;
    }

    .content-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      z-index: 10;
    }

    .back-link {
      display: inline-block;
      color: var(--text-muted);
      text-decoration: none;
      margin-bottom: 3rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link:hover { color: var(--primary); }

    .main-info {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 4rem;
      align-items: start;
    }

    .main-poster {
      width: 100%;
      border-radius: 24px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .badges {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .badge {
      background: rgba(255,255,255,0.1);
      padding: 0.4rem 1rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 600;
      backdrop-filter: blur(8px);
    }

    .movie-title {
      font-size: 4.5rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin-bottom: 0.5rem;
    }

    .tagline {
      font-size: 1.5rem;
      color: var(--primary-light);
      font-weight: 500;
      margin-bottom: 2.5rem;
    }

    .ratings-row {
      display: flex;
      gap: 2rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }

    .rating-box {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .rating-source {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }

    .rating-value {
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .star { color: #fbbf24; }
    .rt .rating-value { color: #f43f5e; }

    .overview h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .overview p {
      font-size: 1.15rem;
      line-height: 1.8;
      color: var(--text-light);
      max-width: 800px;
      margin-bottom: 3rem;
    }

    .credits {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      padding: 2.5rem;
      background: rgba(255,255,255,0.03);
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
    }

    .credit-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .credit-item .label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .credit-item .value {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .credit-item .value.accent {
      color: var(--accent);
    }

    .loading-screen {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      color: var(--text-muted);
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(129, 140, 248, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 968px) {
      .main-info { grid-template-columns: 1fr; }
      .poster-side { display: none; }
      .movie-title { font-size: 3rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);

  movieDetails = signal<any>(null);

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => this.movieService.getMovieDetails(+params['id']))
    ).subscribe(details => {
      this.movieDetails.set(details);
    });
  }

  getFullPosterUrl(url: string): string {
    if (!url || url === 'N/A') return '';
    if (url.startsWith('/')) {
      return `${this.movieService.apiBaseUrl}${url}`;
    }
    return url;
  }
}
