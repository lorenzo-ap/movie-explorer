import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieSearchComponent } from '../movie-search/movie-search.component';
import { MovieService } from '../../services/movie.service';

@Component({
  imports: [MovieCardComponent, MovieSearchComponent, PaginationComponent],
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);

  readonly query = input<string>();
  readonly page = input(1, {
    transform: (value) => Math.max(1, numberAttribute(value, 1)),
  });

  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;
  protected readonly currentPage = this.movieService.currentPage;
  protected readonly totalPages = this.movieService.totalPages;
  protected readonly searchQuery = computed(() => this.query()?.trim() ?? '');

  private readonly request = computed(() => ({ query: this.searchQuery(), page: this.page() }));

  constructor() {
    toObservable(this.request)
      .pipe(
        switchMap(({ query, page }) =>
          (query
            ? this.movieService.searchMovies(query, page)
            : this.movieService.getPopularMovies(page)
          ).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onSearch(query: string): void {
    this.router.navigate(['/'], {
      queryParams: { query: query || null, page: null },
      replaceUrl: true,
    });
  }

  protected onPageChange(page: number): void {
    this.router.navigate(['/'], {
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge',
    });
  }
}
