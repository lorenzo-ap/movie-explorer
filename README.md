# Movie Explorer

A web application for browsing and searching movies, built with Angular 22, Signals and Tailwind CSS on top of [The Movie Database (TMDb) API](https://developer.themoviedb.org/docs).

## Features

- Popular movies list with pagination
- Live search: results update while typing (debounced), the **Search** button searches immediately
- Clearing the search returns to popular movies
- Movie details page: poster, title, overview, genres, rating and release date
- Back button that returns to the previous results, or to the home page when the details page was opened directly
- Search query and page are stored in the URL, so results survive a refresh, the browser Back button and can be shared
- Loading, error, empty and not found states
- Responsive layout from mobile to desktop

## Tech stack

- Angular 22: standalone components, signals, signal inputs/outputs, new control flow (`@if`, `@for`, `@switch`)
- RxJS for HTTP and request cancellation
- Tailwind CSS 4
- Vitest for unit tests
- pnpm

## Getting started

### Prerequisites

- Node.js `^22.22.3`, `^24.15.0` or `>=26`
- pnpm
- A TMDb account and an **API Read Access Token** (TMDb → Settings → API)

### Setup

```bash
pnpm install
cp src/environments/environment.example.ts src/environments/environment.ts
```

Open `src/environments/environment.ts` and paste your API Read Access Token into `tmdbToken`. This file is git-ignored, so the token is never committed.

### Scripts

| Command       | Description                                   |
| ------------- | --------------------------------------------- |
| `pnpm start`  | Start the dev server on http://localhost:4200 |
| `pnpm build`  | Production build into `dist/movie-explorer`   |
| `pnpm test`   | Run unit tests                                |
| `pnpm format` | Format the source code with Prettier          |

## Project structure

```
src/app
├── core
│   └── interceptors          tmdb-auth-interceptor: adds the Bearer token to TMDb requests
├── movies
│   ├── components
│   │   ├── movie-list        page: search, results grid, pagination
│   │   ├── movie-search      search input and button
│   │   ├── movie-card        single movie in the grid
│   │   └── movie-detail      page: movie details
│   ├── models                Movie, MovieDetails, Genre
│   └── services              MovieService: TMDb requests and state
└── shared
    ├── components
    │   └── pagination        reusable previous / next pagination
    └── models                PaginatedResponse<T>
```

## Technical decisions

**State in signals.** `MovieService` keeps `movies`, `movieDetails`, `loading`, `error`, `currentPage` and `totalPages` in private writable signals and exposes them as read-only signals. Only the service changes the state; components read it.

**The service returns Observables.** `getPopularMovies()`, `searchMovies()` and `getMovieDetails()` update the signals through `tap` / `catchError` / `finalize` and return the request, so the caller decides when to subscribe and when to cancel.

**Cancelling outdated requests.** The list and details pages turn their inputs into a stream with `toObservable` and use `switchMap`, so a slower old response can never overwrite a newer one. `catchError` is placed on the inner request, so one failed request does not stop the stream.

**The URL holds the search state.** The search query and page live in the URL (`/?query=batman&page=2`) and are bound to component inputs with `withComponentInputBinding()`. Typing, the Search button, pagination, refresh and browser navigation all go through the same path.

**Debounced search.** Typing emits after 400 ms without input; submitting the form emits immediately. Typing uses `replaceUrl` so it does not fill the browser history.

**Container and presentational components.** `MovieListComponent` and `MovieDetailComponent` talk to the service and the router. `MovieCardComponent`, `MovieSearchComponent` and `PaginationComponent` only receive inputs and emit outputs, which keeps them reusable and easy to test.

**Authentication in an interceptor.** The TMDb token is added by a functional HTTP interceptor, only for requests to the TMDb API.

**Lazy-loaded routes.** Each page is loaded with `loadComponent` and becomes a separate chunk.

## Tests

`MovieService` is covered with `HttpTestingController`: popular movies, search parameters, pagination, the 500 page limit, error messages for network, 401 and 404 errors, and movie details.

```bash
pnpm test --watch=false
```

## Notes

- This is a frontend-only application, so the TMDb token is part of the JavaScript bundle that is sent to the browser. In a production app the requests would go through a backend proxy that keeps the token on the server.
- TMDb allows at most 500 pages per list, so pagination is limited to 500 pages.
- TMDb may be unavailable in some regions without a VPN.
