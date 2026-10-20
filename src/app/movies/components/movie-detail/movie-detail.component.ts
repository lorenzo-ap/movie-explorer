import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, computed, inject, input, numberAttribute, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MovieService } from '../../services/movie.service';

@Component({
  imports: [DatePipe, DecimalPipe],
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly id = input.required({ transform: numberAttribute });

  protected readonly movie = this.movieService.movieDetail;
  protected readonly loading = this.movieService.detailLoading;
  protected readonly error = this.movieService.detailError;

  protected readonly status = computed(() => {
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    return 'loaded';
  });

  protected readonly posterUrl = computed(() => {
    const posterPath = this.movie()?.poster_path;
    return posterPath ? `${environment.tmdbImageUrl}/w500${posterPath}` : null;
  });

  ngOnInit(): void {
    this.movieService.getMovieDetails(this.id()).subscribe();
  }

  protected goBack(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
      return;
    }

    this.router.navigate(['/']);
  }
}
