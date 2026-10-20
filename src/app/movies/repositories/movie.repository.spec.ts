import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { Movie, MovieDetails } from '../models/movie.model';
import { MovieRepository } from './movie.repository';

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

describe('MovieRepository', () => {
  const apiUrl = environment.tmdbApiUrl;
  let repository: MovieRepository;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(MovieRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('requests popular movies and returns only the results', () => {
    let result: Movie[] | undefined;
    repository.getPopular().subscribe((movies) => (result = movies));

    const request = httpTesting.expectOne(`${apiUrl}/movie/popular`);
    expect(request.request.method).toBe('GET');
    request.flush(createResponse());

    expect(result).toEqual([movie]);
  });

  it('searches movies with the keyword as the query param', () => {
    let result: Movie[] | undefined;
    repository.search('inception').subscribe((movies) => (result = movies));

    const request = httpTesting.expectOne((req) => req.url === `${apiUrl}/search/movie`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('query')).toBe('inception');
    request.flush(createResponse());

    expect(result).toEqual([movie]);
  });

  it('requests movie details by id', () => {
    let result: MovieDetails | undefined;
    repository.getById(27205).subscribe((details) => (result = details));

    const request = httpTesting.expectOne(`${apiUrl}/movie/27205`);
    expect(request.request.method).toBe('GET');
    request.flush(movieDetails);

    expect(result).toEqual(movieDetails);
  });

  it('propagates HTTP errors to the subscriber', () => {
    let error: HttpErrorResponse | undefined;
    repository.getPopular().subscribe({ error: (err) => (error = err) });

    httpTesting
      .expectOne(`${apiUrl}/movie/popular`)
      .flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error?.status).toBe(500);
  });
});
