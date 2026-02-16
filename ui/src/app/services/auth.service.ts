import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
    username: string;
    email: string;
    token: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly apiUrl = 'http://localhost:5000/api/auth';

    private readonly userSignal = signal<User | null>(this.getStoredUser());

    readonly user = this.userSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.userSignal());
    readonly isAdmin = computed(() => this.userSignal()?.role === 'Admin');

    register(data: any): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/register`, data).pipe(
            tap(user => this.setSession(user))
        );
    }

    login(data: any): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/login`, data).pipe(
            tap(user => this.setSession(user))
        );
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('user');
        }
        this.userSignal.set(null);
        this.router.navigate(['/login']);
    }

    private setSession(user: User): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(user));
        }
        this.userSignal.set(user);
        this.router.navigate(['/']);
    }

    private getStoredUser(): User | null {
        if (isPlatformBrowser(this.platformId)) {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    }

    getToken(): string | null {
        return this.userSignal()?.token || null;
    }
}
