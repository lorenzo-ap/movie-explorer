import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Movie Explorer',
    loadComponent: () =>
      import('./movies/components/movie-list/movie-list.component').then(
        (m) => m.MovieListComponent,
      ),
  },
  {
    path: 'movie/:id',
    title: 'Movie Details',
    loadComponent: () =>
      import('./movies/components/movie-detail/movie-detail.component').then(
        (m) => m.MovieDetailComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
