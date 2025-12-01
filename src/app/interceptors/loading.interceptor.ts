import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * URLs that should not trigger the global loading indicator
 */
const EXCLUDED_URLS: string[] = [
  '/assets/i18n/', // Translation files
  // Add more URLs as needed:
  // '/api/health-check',
  // '/api/ping',
];

/**
 * HTTP Interceptor that automatically shows/hides the global loading indicator
 * for all HTTP requests except those in the exclusion list
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Check if this request should trigger loading indicator
  const shouldShowLoading = !EXCLUDED_URLS.some(url => req.url.includes(url));

  if (shouldShowLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error but let it propagate
      console.error('HTTP Error:', error);
      return throwError(() => error);
    }),
    finalize(() => {
      // Always hide loading when request completes (success or error)
      if (shouldShowLoading) {
        loadingService.hide();
      }
    })
  );
};
