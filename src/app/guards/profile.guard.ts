import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const profileGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.getCurrentUser();

    // If user is an admin, redirect to admin dashboard
    if (currentUser && currentUser.role === 'Admin') {
        console.log('🔄 Profile Guard - Admin detected, redirecting to admin dashboard');
        router.navigate(['/admin/dashboard']);
        return false;
    }

    // Check if user is authenticated
    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to login page with return url
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
