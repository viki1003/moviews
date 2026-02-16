import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to manage your cinemtic journey</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com">
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••">
          </div>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <button type="submit" [disabled]="loginForm.invalid || isLoading()" class="btn-primary">
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register">Sign Up</a>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .auth-wrapper {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .auth-card {
      background: var(--surface);
      width: 100%;
      max-width: 400px;
      padding: 2.5rem;
      border-radius: 1.5rem;
      border: 1px solid var(--border);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-header h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .auth-header p {
      color: var(--text-muted);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-light);
    }
    input {
      background: #1e293b;
      border: 1px solid var(--border);
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      color: white;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: var(--primary);
    }
    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      text-align: center;
    }
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .auth-footer a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            this.error.set(null);
            this.authService.login(this.loginForm.value).subscribe({
                next: () => {
                    this.isLoading.set(false);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.error.set(err.error || 'Login failed. Please check your credentials.');
                }
            });
        }
    }
}
