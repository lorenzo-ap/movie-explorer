import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { Movie, MovieDetails } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class MovieRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.tmdbApiUrl;

  getPopular(): Observable<Movie[]> {
    const url = `${this.apiUrl}/movie/popular`;
    return this.http.get<PaginatedResponse<Movie>>(url).pipe(map((res) => res.results));
  }

  search(keyword: string): Observable<Movie[]> {
    const url = `${this.apiUrl}/search/movie`;
    return this.http
      .get<PaginatedResponse<Movie>>(url, {
        params: { query: keyword },
      })
      .pipe(map((res) => res.results));
  }

  getById(id: number): Observable<MovieDetails> {
    const url = `${this.apiUrl}/movie/${id}`;
    return this.http.get<MovieDetails>(url);
  }
}
