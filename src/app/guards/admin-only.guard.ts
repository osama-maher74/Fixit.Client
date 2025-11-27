import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();
  console.log('Admin Guard - Current User:', currentUser);
  console.log('Admin Guard - User Role:', currentUser?.role);
  console.log('Admin Guard - Is Admin?', currentUser?.role === 'Admin');

  if (currentUser && currentUser.role === 'Admin') {
    console.log('✅ Admin Guard - Access Granted');
    return true;
  }

  console.log('❌ Admin Guard - Access Denied, redirecting to home');
  router.navigate(['/']);
  return false;
};
