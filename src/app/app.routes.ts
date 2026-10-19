import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Movie Explorer',
    loadComponent: () =>
      import('./movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'movie/:id',
    title: 'Movie Details',
    loadComponent: () =>
      import('./movies/movie-detail/movie-detail.component').then((m) => m.MovieDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
