import { Component, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { MovieService } from '../../services/movie.service';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MovieSearchComponent } from '../movie-search/movie-search.component';

@Component({
  imports: [MovieCardComponent, MovieSearchComponent],
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);

  protected readonly query = input<string>();
  protected readonly trimmedQuery = computed(() => this.query()?.trim() || '');

  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;

  protected readonly status = computed(() => {
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    return 'loaded';
  });

  constructor() {
    toObservable(this.trimmedQuery)
      .pipe(
        switchMap((query) =>
          query ? this.movieService.searchMovies(query) : this.movieService.getPopularMovies(),
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
