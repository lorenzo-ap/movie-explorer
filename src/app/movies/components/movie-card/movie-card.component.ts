import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Movie } from '../../models/movie.model';

@Component({
  imports: [RouterLink],
  selector: 'app-movie-card',
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();

  readonly posterUrl = computed(() => {
    const posterPath = this.movie().poster_path;
    return posterPath ? `${environment.tmdbImageUrl}/w342${posterPath}` : null;
  });
}
