import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Movie, MovieDetails } from '../models/movie.model';
import { MovieRepository } from '../repositories/movie.repository';
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

const httpError = (status: number) => throwError(() => new HttpErrorResponse({ status }));

describe('MovieService', () => {
  let service: MovieService;
  const repository = {
    getPopular: vi.fn(),
    search: vi.fn(),
    getById: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [{ provide: MovieRepository, useValue: repository }],
    });

    service = TestBed.inject(MovieService);
  });

  describe('getPopularMovies', () => {
    it('sets the movies and clears the error', () => {
      repository.getPopular.mockReturnValue(of([movie]));

      let result: Movie[] | undefined;
      service.getPopularMovies().subscribe((movies) => (result = movies));

      expect(result).toEqual([movie]);
      expect(service.movies()).toEqual([movie]);
      expect(service.error()).toBeNull();
    });

    it('is loading while the request is in flight and not afterwards', () => {
      const response = new Subject<Movie[]>();
      repository.getPopular.mockReturnValue(response);

      service.getPopularMovies().subscribe();
      expect(service.loading()).toBe(true);

      response.next([movie]);
      response.complete();
      expect(service.loading()).toBe(false);
    });

    it('completes with an empty list and sets the error on failure', () => {
      repository.getPopular.mockReturnValue(httpError(500));

      let result: Movie[] | undefined;
      let completed = false;
      service.getPopularMovies().subscribe({
        next: (movies) => (result = movies),
        complete: () => (completed = true),
      });

      expect(result).toEqual([]);
      expect(completed).toBe(true);
      expect(service.error()).toBe('Failed to load popular movies.');
      expect(service.loading()).toBe(false);
    });

    it('clears a previous error when a new request starts', () => {
      repository.getPopular.mockReturnValueOnce(httpError(500));
      service.getPopularMovies().subscribe();
      expect(service.error()).not.toBeNull();

      const response = new Subject<Movie[]>();
      repository.getPopular.mockReturnValueOnce(response);
      service.getPopularMovies().subscribe();

      expect(service.error()).toBeNull();
    });
  });

  describe('searchMovies', () => {
    it('passes the keyword to the repository and sets the movies', () => {
      repository.search.mockReturnValue(of([movie]));

      service.searchMovies('inception').subscribe();

      expect(repository.search).toHaveBeenCalledWith('inception');
      expect(service.movies()).toEqual([movie]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('completes with an empty list and sets the error on failure', () => {
      repository.search.mockReturnValue(httpError(500));

      let result: Movie[] | undefined;
      service.searchMovies('inception').subscribe((movies) => (result = movies));

      expect(result).toEqual([]);
      expect(service.error()).toBe('Failed to search movies.');
      expect(service.loading()).toBe(false);
    });
  });

  describe('getMovieDetails', () => {
    it('sets the movie detail', () => {
      repository.getById.mockReturnValue(of(movieDetails));

      let result: MovieDetails | null | undefined;
      service.getMovieDetails(27205).subscribe((details) => (result = details));

      expect(repository.getById).toHaveBeenCalledWith(27205);
      expect(result).toEqual(movieDetails);
      expect(service.movieDetail()).toEqual(movieDetails);
      expect(service.detailLoading()).toBe(false);
      expect(service.detailError()).toBeNull();
    });

    it('clears the previous detail and is loading while in flight', () => {
      repository.getById.mockReturnValueOnce(of(movieDetails));
      service.getMovieDetails(27205).subscribe();
      expect(service.movieDetail()).toEqual(movieDetails);

      const response = new Subject<MovieDetails>();
      repository.getById.mockReturnValueOnce(response);
      service.getMovieDetails(1).subscribe();

      expect(service.movieDetail()).toBeNull();
      expect(service.detailLoading()).toBe(true);

      response.next({ ...movieDetails, id: 1 });
      response.complete();
      expect(service.detailLoading()).toBe(false);
    });

    it('completes with null and sets the detail error on failure', () => {
      repository.getById.mockReturnValue(httpError(500));

      let result: MovieDetails | null | undefined;
      let completed = false;
      service.getMovieDetails(27205).subscribe({
        next: (details) => (result = details),
        complete: () => (completed = true),
      });

      expect(result).toBeNull();
      expect(completed).toBe(true);
      expect(service.movieDetail()).toBeNull();
      expect(service.detailError()).toBe('Failed to load movie details.');
      expect(service.detailLoading()).toBe(false);
    });
  });

  describe('separate list and detail state', () => {
    it('keeps list loading and error independent from detail state', () => {
      repository.getPopular.mockReturnValue(new Subject<Movie[]>());
      repository.getById.mockReturnValue(httpError(500));

      service.getPopularMovies().subscribe();
      service.getMovieDetails(27205).subscribe();

      expect(service.loading()).toBe(true);
      expect(service.error()).toBeNull();
      expect(service.detailLoading()).toBe(false);
      expect(service.detailError()).toBe('Failed to load movie details.');
    });

    it('does not touch detail state when the list request fails', () => {
      repository.getPopular.mockReturnValue(httpError(500));

      service.getPopularMovies().subscribe();

      expect(service.error()).toBe('Failed to load popular movies.');
      expect(service.detailError()).toBeNull();
      expect(service.detailLoading()).toBe(false);
    });
  });

  describe('error messages', () => {
    const cases: [number, string][] = [
      [0, 'Unable to connect to the server. Please check your connection.'],
      [401, 'Invalid TMDb API credentials.'],
      [404, 'The requested movie was not found.'],
    ];

    it.each(cases)('uses the status %i message for every method', (status, message) => {
      repository.getPopular.mockReturnValue(httpError(status));
      repository.search.mockReturnValue(httpError(status));
      repository.getById.mockReturnValue(httpError(status));

      service.getPopularMovies().subscribe();
      expect(service.error()).toBe(message);

      service.searchMovies('x').subscribe();
      expect(service.error()).toBe(message);

      service.getMovieDetails(1).subscribe();
      expect(service.detailError()).toBe(message);
    });
  });
});
