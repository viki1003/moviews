import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MovieService {
    public readonly apiBaseUrl = environment.apiBaseUrl;
    private apiUrl = `${this.apiBaseUrl}/api/Movies`;
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private getHeaders() {
        const token = this.authService.getToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    }

    getMovies(query?: string, genre?: string, minRating?: number, year?: number, language?: string): Observable<Movie[]> {
        let params = [];
        if (query) params.push(`query=${encodeURIComponent(query)}`);
        if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
        if (minRating) params.push(`minRating=${minRating}`);
        if (year) params.push(`year=${year}`);
        if (language) params.push(`language=${encodeURIComponent(language)}`);

        const url = params.length > 0 ? `${this.apiUrl}?${params.join('&')}` : this.apiUrl;
        return this.http.get<Movie[]>(url);
    }

    getTopMovies(): Observable<Movie[]> {
        return this.http.get<Movie[]>(`${this.apiUrl}/top`);
    }

    getMovieDetails(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/details`);
    }

    getMovie(id: number): Observable<Movie> {
        return this.http.get<Movie>(`${this.apiUrl}/${id}`);
    }

    createMovie(movie: Movie): Observable<Movie> {
        return this.http.post<Movie>(this.apiUrl, movie, this.getHeaders());
    }

    updateMovie(id: number, movie: Movie): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, movie, this.getHeaders());
    }

    deleteMovie(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
    }
}
