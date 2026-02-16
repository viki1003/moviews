import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Movie } from '../../models/movie.model';

@Component({
    selector: 'app-movie-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="form-container">
      <h3>{{ movie() ? 'Edit Movie' : 'Add New Movie' }}</h3>
      <form [formGroup]="movieForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="title">Title</label>
          <input id="title" type="text" formControlName="title" placeholder="e.g. Inception">
          @if (movieForm.get('title')?.invalid && movieForm.get('title')?.touched) {
            <span class="error-msg">Title is required</span>
          }
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="year">Year</label>
            <input id="year" type="number" formControlName="year" placeholder="e.g. 2010">
            @if (movieForm.get('year')?.invalid && movieForm.get('year')?.touched) {
              <span class="error-msg">Valid year required</span>
            }
          </div>

          <div class="form-group">
            <label for="genre">Genre</label>
            <input id="genre" type="text" formControlName="genre" placeholder="e.g. Sci-Fi">
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="movieForm.invalid">
            {{ movie() ? 'Update' : 'Add' }} Movie
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .form-container {
      background: var(--surface-card);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    }

    h3 {
      margin-top: 0;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    label {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
    }

    input {
      background: var(--surface-input);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .error-msg {
      color: #ef4444;
      font-size: 0.8rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    button {
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.1s, opacity 0.2s;
    }

    button:active { transform: scale(0.98); }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class MovieFormComponent {
    private fb = inject(FormBuilder);

    movie = signal<Movie | null>(null);
    @Input({ alias: 'movie' }) set _movie(val: Movie | null) {
        this.movie.set(val);
        if (val) {
            this.movieForm.patchValue(val);
        } else {
            this.movieForm.reset({ year: new Date().getFullYear() });
        }
    }

    @Output() save = new EventEmitter<Omit<Movie, 'id'>>();
    @Output() cancel = new EventEmitter<void>();

    movieForm = this.fb.group({
        title: ['', Validators.required],
        year: [new Date().getFullYear(), [Validators.required, Validators.min(1888), Validators.max(2100)]],
        genre: [''],
        logic: ['']
    });

    onSubmit() {
        if (this.movieForm.valid) {
            this.save.emit(this.movieForm.value as Omit<Movie, 'id'>);
            this.movieForm.reset({ year: new Date().getFullYear() });
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}
