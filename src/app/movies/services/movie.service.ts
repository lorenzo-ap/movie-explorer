import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { Movie, MovieDetails } from '../models/movie.model';
import { MovieRepository } from '../repositories/movie.repository';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly movieRepository = inject(MovieRepository);

  private readonly _movies = signal<Movie[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly movies = this._movies.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly _movieDetail = signal<MovieDetails | null>(null);
  private readonly _detailLoading = signal<boolean>(false);
  private readonly _detailError = signal<string | null>(null);

  readonly movieDetail = this._movieDetail.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();

  getPopularMovies(): Observable<Movie[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.movieRepository.getPopular().pipe(
      tap((response) => this._movies.set(response)),
      catchError((error: unknown) => {
        this._error.set(this.getErrorMessage(error, 'Failed to load popular movies.'));
        return of([]);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  searchMovies(keyword: string): Observable<Movie[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.movieRepository.search(keyword).pipe(
      tap((response) => this._movies.set(response)),
      catchError((error: unknown) => {
        this._error.set(this.getErrorMessage(error, 'Failed to search movies.'));
        return of([]);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  getMovieDetails(id: number): Observable<MovieDetails | null> {
    this._detailLoading.set(true);
    this._detailError.set(null);
    this._movieDetail.set(null);

    return this.movieRepository.getById(id).pipe(
      tap((movie) => this._movieDetail.set(movie)),
      catchError((error: unknown) => {
        this._detailError.set(this.getErrorMessage(error, 'Failed to load movie details.'));
        return of(null);
      }),
      finalize(() => this._detailLoading.set(false)),
    );
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          return 'Unable to connect to the server. Please check your connection.';
        case 401:
          return 'Invalid TMDb API credentials.';
        case 404:
          return 'The requested movie was not found.';
      }
    }

    return fallback;
  }
}
