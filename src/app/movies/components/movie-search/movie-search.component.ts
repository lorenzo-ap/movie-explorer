import { Component, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-movie-search',
  templateUrl: './movie-search.component.html',
})
export class MovieSearchComponent {
  readonly query = input('');
  readonly searched = output<string>();

  private readonly typedQuery = new Subject<string>();

  constructor() {
    this.typedQuery
      .pipe(debounceTime(400), takeUntilDestroyed())
      .subscribe((query) => this.searched.emit(query));
  }

  protected onInput(query: string): void {
    this.typedQuery.next(query);
  }

  protected onSubmit(event: Event, query: string): void {
    event.preventDefault();
    this.searched.emit(query);
  }
}
