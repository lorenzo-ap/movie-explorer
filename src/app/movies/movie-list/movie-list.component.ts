import { Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieSearchComponent } from '../movie-search/movie-search.component';
import { MovieService } from '../movie.service';

@Component({
  imports: [MovieCardComponent, MovieSearchComponent],
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);

  readonly query = input<string>();

  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;
  protected readonly searchQuery = computed(() => this.query()?.trim() ?? '');

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        switchMap((query) =>
          (query
            ? this.movieService.searchMovies(query)
            : this.movieService.getPopularMovies()
          ).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onSearch(query: string): void {
    this.router.navigate(['/'], {
      queryParams: { query: query || null },
      replaceUrl: true,
    });
  }
}
