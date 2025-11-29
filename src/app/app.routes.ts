import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { clientOnlyGuard } from './guards/client-only.guard';
import { loginGuard } from './guards/login.guard';
import { adminOnlyGuard } from './guards/admin-only.guard';
import { homeGuard } from './guards/home.guard';
import { profileGuard } from './guards/profile.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [homeGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [adminOnlyGuard]
  },
  {
    path: 'admin/craftsman/:id',
    loadComponent: () => import('./pages/craftsman-details/craftsman-details').then(m => m.CraftsmanDetails),
    canActivate: [adminOnlyGuard]
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
    canActivate: [profileGuard]
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
    path: 'appointment-scheduling',
    loadComponent: () => import('./pages/appointment-scheduling/appointment-scheduling').then(m => m.AppointmentSchedulingComponent)
  },
  {
    path: 'craftsman/:id/availability',
    loadComponent: () => import('./pages/availability-editor/availability-editor').then(m => m.AvailabilityEditorComponent)
  },
  {
    path: 'craftsman/:id/timeslots',
    loadComponent: () => import('./pages/time-slots/time-slots').then(m => m.TimeSlotsComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent),
    canActivate: [clientOnlyGuard]
  },
  {
    path: 'payment/:serviceRequestId',
    loadComponent: () => import('./pages/payment/payment.component').then(m => m.PaymentComponent)
  },
  {
    path: 'offer-review/:serviceRequestId/:offerId',
    loadComponent: () => import('./pages/offer-review/offer-review').then(m => m.OfferReviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'offers/:id',
    loadComponent: () => import('./pages/offers/offers').then(m => m.OffersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-requests',
    loadComponent: () => import('./pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'request-details/:id',
    loadComponent: () => import('./pages/request-details/request-details.component').then(m => m.RequestDetailsComponent),
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
