import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
  // Protected routes example - uncomment and modify as needed
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  //   canActivate: [authGuard]
  // },
  {
    path: '**',
    redirectTo: ''
  }
];
