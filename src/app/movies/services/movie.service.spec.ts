import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { Movie, MovieDetails } from '../models/movie.model';
import { MovieService } from './movie.service';

const movie: Movie = {
  id: 27205,
  title: 'Inception',
  overview: 'A thief who steals corporate secrets through dream-sharing technology.',
  poster_path: '/inception.jpg',
  release_date: '2010-07-15',
  vote_average: 8.4,
};

const movieDetails: MovieDetails = {
  ...movie,
  genres: [{ id: 28, name: 'Action' }],
};

function createResponse(
  overrides: Partial<PaginatedResponse<Movie>> = {},
): PaginatedResponse<Movie> {
  return { page: 1, results: [movie], total_pages: 1, total_results: 1, ...overrides };
}

describe('MovieService', () => {
  const apiUrl = environment.tmdbApiUrl;
  let service: MovieService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MovieService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads popular movies and updates the state', () => {
    service.getPopularMovies().subscribe();

    expect(service.loading()).toBe(true);

    const request = httpTesting.expectOne((req) => req.url === `${apiUrl}/movie/popular`);
    expect(request.request.params.get('page')).toBe('1');

    request.flush(createResponse({ total_pages: 3 }));

    expect(service.movies()).toEqual([movie]);
    expect(service.currentPage()).toBe(1);
    expect(service.totalPages()).toBe(3);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('searches movies with a trimmed keyword and the requested page', () => {
    service.searchMovies('  inception  ', 2).subscribe();

    const request = httpTesting.expectOne((req) => req.url === `${apiUrl}/search/movie`);
    expect(request.request.params.get('query')).toBe('inception');
    expect(request.request.params.get('page')).toBe('2');

    request.flush(createResponse({ page: 2, total_pages: 4 }));

    expect(service.currentPage()).toBe(2);
    expect(service.totalPages()).toBe(4);
  });

  it('limits total pages to the TMDb maximum of 500', () => {
    service.getPopularMovies().subscribe();

    httpTesting
      .expectOne((req) => req.url === `${apiUrl}/movie/popular`)
      .flush(createResponse({ total_pages: 48000 }));

    expect(service.totalPages()).toBe(500);
  });

  it('sets an error message and rethrows when the request fails', () => {
    let receivedError: HttpErrorResponse | undefined;

    service.getPopularMovies().subscribe({ error: (error) => (receivedError = error) });

    httpTesting
      .expectOne((req) => req.url === `${apiUrl}/movie/popular`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.error()).toBe('Invalid TMDb API credentials.');
    expect(service.loading()).toBe(false);
    expect(receivedError?.status).toBe(401);
  });

  it('sets a connection error message when the network fails', () => {
    service.getPopularMovies().subscribe({ error: () => undefined });

    httpTesting
      .expectOne((req) => req.url === `${apiUrl}/movie/popular`)
      .error(new ProgressEvent('error'));

    expect(service.error()).toBe('Unable to connect to the server. Please check your connection.');
  });

  it('loads movie details', () => {
    service.getMovieDetails(movie.id).subscribe();

    expect(service.movieDetails()).toBeNull();
    expect(service.loading()).toBe(true);

    httpTesting.expectOne(`${apiUrl}/movie/${movie.id}`).flush(movieDetails);

    expect(service.movieDetails()).toEqual(movieDetails);
    expect(service.loading()).toBe(false);
  });

  it('sets a not found message when the movie does not exist', () => {
    service.getMovieDetails(999).subscribe({ error: () => undefined });

    httpTesting
      .expectOne(`${apiUrl}/movie/999`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(service.error()).toBe('The requested movie was not found.');
    expect(service.movieDetails()).toBeNull();
  });
});
