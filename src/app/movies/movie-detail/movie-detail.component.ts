import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovieService } from '../movie.service';

@Component({
  imports: [DatePipe, DecimalPipe],
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly movie = this.movieService.movieDetails;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;

  protected readonly status = computed(() => {
    if (this.loading()) {
      return 'loading';
    }

    if (this.error()) {
      return 'error';
    }

    return this.movie() ? 'loaded' : 'loading';
  });

  protected readonly posterUrl = computed(() => {
    const posterPath = this.movie()?.poster_path;

    return posterPath ? `${environment.tmdbImageUrl}/w500${posterPath}` : null;
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => this.movieService.getMovieDetails(id).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected goBack(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
      return;
    }

    this.router.navigate(['/']);
  }
}
