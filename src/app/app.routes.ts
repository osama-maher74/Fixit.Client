import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { clientOnlyGuard } from './guards/client-only.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register/client',
    loadComponent: () => import('./pages/register-client/register-client.component').then(m => m.RegisterClientComponent)
  },
  {
    path: 'register/craftsman',
    loadComponent: () => import('./pages/register-craftsman/register-craftsman.component').then(m => m.RegisterCraftsmanComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit-profile',
    loadComponent: () => import('./pages/edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'craftsman-wallet',
    loadComponent: () => import('./pages/craftsman-wallet/craftsman-wallet.component').then(m => m.CraftsmanWalletComponent),
    canActivate: [authGuard]
  },
  {
    path: 'service-booking',
    loadComponent: () => import('./pages/service-booking/service-booking').then(m => m.ServiceBookingComponent)
  },
  {
    path: 'craftsmen-list',
    loadComponent: () => import('./pages/craftsmen-list/craftsmen-list').then(m => m.CraftsmenListComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent),
    canActivate: [clientOnlyGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
