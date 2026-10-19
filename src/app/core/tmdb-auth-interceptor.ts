import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const tmdbAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.tmdbApiUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${environment.tmdbToken}` } }));
};
