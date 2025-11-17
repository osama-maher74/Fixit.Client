import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        console.error('Full error response:', error);
        console.error('Error body:', error.error);

        // Try to extract error message from various possible formats
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.error?.errors) {
          // Handle validation errors
          const validationErrors = error.error.errors;
          const errorMessages = Object.keys(validationErrors).map(key =>
            `${key}: ${validationErrors[key].join(', ')}`
          );
          errorMessage = errorMessages.join('; ');
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = `Error Code: ${error.status}`;
        }

        // Handle 401 Unauthorized
        if (error.status === 401) {
          // Redirect to login
          router.navigate(['/login']);
        }
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};
