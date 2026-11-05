import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Endpoints that must NOT trigger an automatic token refresh
const SKIP_REFRESH_PATTERNS = ['/auth/login', '/auth/refresh'];

function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_PATTERNS.some((p) => url.includes(p));
}

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
}

// Module-level state shared across all interceptor invocations
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Always send credentials (HttpOnly cookie) for all API requests
  let modifiedReq = req.clone({ withCredentials: true });

  // Attach the in-memory access token if available
  const token = authService.getAccessToken();
  if (token && !shouldSkipRefresh(req.url)) {
    modifiedReq = addBearer(modifiedReq, token);
  }

  return next(modifiedReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !shouldSkipRefresh(req.url)
      ) {
        return handle401(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // Queue the request until refresh completes
    return refreshDone$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(addBearer(originalReq, newToken)))
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return authService.refreshToken().pipe(
    switchMap((newToken: string) => {
      isRefreshing = false;
      refreshDone$.next(newToken);
      return next(addBearer(originalReq, newToken));
    }),
    catchError((err: unknown) => {
      isRefreshing = false;
      refreshDone$.next(null);
      authService.clearSession();
      return throwError(() => err);
    })
  );
}

