import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./components/movie-list/movie-list.component').then(m => m.MovieListComponent),
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'movie/:id',
        loadComponent: () => import('./components/movie-detail/movie-detail.component').then(m => m.MovieDetailComponent)
    }
];
