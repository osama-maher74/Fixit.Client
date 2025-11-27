import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If user is already authenticated, redirect to profile
    if (authService.isAuthenticated()) {
        router.navigate(['/profile']);
        return false;
    }

    // Allow access to login page for non-authenticated users
    return true;
};
