import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const homeGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.getCurrentUser();

    // If user is an admin, redirect to admin dashboard
    if (currentUser && currentUser.role === 'Admin') {
        console.log('🔄 Home Guard - Admin detected, redirecting to admin dashboard');
        router.navigate(['/admin/dashboard']);
        return false;
    }

    // Allow access to home page for non-admin users
    return true;
};
