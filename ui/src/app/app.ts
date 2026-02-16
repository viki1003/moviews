import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">
          <span class="logo-emoji">🎬</span>
          <span class="logo-text">Mo<span class="gradient-text">views</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          
          @if (authService.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Admin</a>
          }

          <div class="nav-divider"></div>

          @if (authService.isAuthenticated()) {
            <span class="user-info">Hi, {{ authService.user()?.username }}</span>
            <button (click)="authService.logout()" class="btn-ghost">Logout</button>
          } @else {
            <a routerLink="/login" class="login-btn">Sign In</a>
            <a routerLink="/register" class="btn-primary">Get Started</a>
          }
        </div>
      </div>
    </nav>

    <main class="app-main">
      <router-outlet />
    </main>

    <footer class="app-footer">
      <p>&copy; 2026 Moviews. Built with passion for cinema.</p>
    </footer>
  `,
  styles: [`
    .navbar {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
    }
    .gradient-text {
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      color: white;
    }
    .nav-divider {
      width: 1px;
      height: 24px;
      background: var(--border);
    }
    .user-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .login-btn {
      color: var(--text) !important;
    }
    .app-main {
      min-height: calc(100vh - 160px);
    }
    .app-footer {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
    }
  `],
  styleUrl: './app.css'
})
export class App {
  readonly authService = inject(AuthService);
}
