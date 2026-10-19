import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { Movie, MovieDetails } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.tmdbApiUrl;

  private readonly moviesState = signal<Movie[]>([]);
  private readonly movieDetailsState = signal<MovieDetails | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  private readonly currentPageState = signal(1);
  private readonly totalPagesState = signal(0);
  private readonly maxPages = 500;

  readonly movies = this.moviesState.asReadonly();
  readonly movieDetails = this.movieDetailsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly currentPage = this.currentPageState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();

  getPopularMovies(page = 1): Observable<PaginatedResponse<Movie>> {
    const params = new HttpParams().set('page', page);

    return this.requestMovies(`${this.apiUrl}/movie/popular`, params);
  }

  searchMovies(keyword: string, page = 1): Observable<PaginatedResponse<Movie>> {
    const params = new HttpParams().set('query', keyword.trim()).set('page', page);

    return this.requestMovies(`${this.apiUrl}/search/movie`, params);
  }

  getMovieDetails(id: number): Observable<MovieDetails> {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.movieDetailsState.set(null);

    return this.http.get<MovieDetails>(`${this.apiUrl}/movie/${id}`).pipe(
      tap((movie) => this.movieDetailsState.set(movie)),
      catchError((error: HttpErrorResponse) => {
        this.errorState.set(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingState.set(false)),
    );
  }

  private requestMovies(url: string, params: HttpParams): Observable<PaginatedResponse<Movie>> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.get<PaginatedResponse<Movie>>(url, { params }).pipe(
      tap((response) => {
        this.moviesState.set(response.results);
        this.currentPageState.set(response.page);
        this.totalPagesState.set(Math.min(response.total_pages, this.maxPages));
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorState.set(this.getErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.loadingState.set(false)),
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your connection.';
    }

    if (error.status === 401) {
      return 'Invalid TMDb API credentials.';
    }

    if (error.status === 404) {
      return 'The requested movie was not found.';
    }

    return 'Something went wrong. Please try again later.';
  }
}
