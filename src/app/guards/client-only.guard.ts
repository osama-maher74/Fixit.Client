import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Guard to restrict access to client-only pages
 * Redirects craftsmen to home page
 */
export const clientOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isAuthenticated()) {
    // Allow non-authenticated users to view
    return true;
  }

  // Check user role
  return authService.currentUser$.pipe(
    map(user => {
      if (user && user.role === 'Craftsman') {
        // Redirect craftsmen to home
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};
