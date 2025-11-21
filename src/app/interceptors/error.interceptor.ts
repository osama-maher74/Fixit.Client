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
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        console.error('Error body type:', typeof error.error);

        // Try to extract error message from various possible formats
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.errors) {
          // Handle validation errors - check if it's an array or object
          const validationErrors = error.error.errors;
          console.error('Validation errors:', validationErrors);

          if (Array.isArray(validationErrors)) {
            // Handle array of error objects
            const errorMessages = validationErrors.map((err: any) => {
              if (typeof err === 'string') {
                return err;
              } else if (err.field && err.erorrs && Array.isArray(err.erorrs)) {
                // Handle typo in backend: "erorrs" instead of "errors"
                return err.erorrs.join(', ');
              } else if (err.field && err.errors && Array.isArray(err.errors)) {
                return err.errors.join(', ');
              } else if (err.field && err.message) {
                return `${err.field}: ${err.message}`;
              } else if (err.message) {
                return err.message;
              } else if (err.description) {
                return err.description;
              }
              return JSON.stringify(err);
            });
            errorMessage = errorMessages.join('; ');
          } else {
            // Handle object with validation errors (ASP.NET Core format)
            const errorMessages = Object.keys(validationErrors).map(key =>
              `${key}: ${Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key]}`
            );
            errorMessage = errorMessages.join('; ');
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.statusText) {
          errorMessage = `${error.statusText} (${error.status})`;
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = `HTTP Error ${error.status}`;
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
