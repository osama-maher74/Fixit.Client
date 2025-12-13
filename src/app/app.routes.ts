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
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'email-reset-landing',
    loadComponent: () => import('./pages/email-reset-landing/email-reset-landing.component').then(m => m.EmailResetLandingComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'check-email',
    loadComponent: () => import('./pages/check-email/check-email.component').then(m => m.CheckEmailComponent)
  },
  {
    path: 'resend-verification',
    loadComponent: () => import('./pages/resend-verification/resend-verification.component').then(m => m.ResendVerificationComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
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
    path: 'admin/client/:id',
    loadComponent: () => import('./pages/admin-client-details/admin-client-details').then(m => m.AdminClientDetails),
    canActivate: [adminOnlyGuard]
  },
  {
    path: 'admin/service-requests',
    loadComponent: () => import('./pages/admin-service-requests/admin-service-requests.component').then(m => m.AdminServiceRequestsComponent),
    canActivate: [adminOnlyGuard]
  },
  {
    path: 'admin/complaints',
    loadComponent: () => import('./pages/admin-complaints/admin-complaints').then(m => m.AdminComplaints),
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
    path: 'verify-id',
    loadComponent: () => import('./pages/verify-id/verify-id.component').then(m => m.VerifyIdComponent),
    canActivate: [authGuard]
  },
  {
    path: 'craftsman-wallet/:id',
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
    loadComponent: () => import('./pages/appointment-scheduling/appointment-scheduling').then(m => m.AppointmentSchedulingComponent),
    canActivate: [authGuard]
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
    path: 'craftsman-requests',
    loadComponent: () => import('./pages/craftsman-requests/craftsman-requests.component').then(m => m.CraftsmanRequestsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'craftsman-reviews',
    loadComponent: () => import('./pages/craftsman-reviews/craftsman-reviews.component').then(m => m.CraftsmanReviewsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'request-details/:id',
    loadComponent: () => import('./pages/request-details/request-details.component').then(m => m.RequestDetailsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'request-details/:id/complaints',
    loadComponent: () => import('./pages/complaints-list/complaints-list').then(m => m.ComplaintsList),
    canActivate: [authGuard]
  },
  {
    path: 'about-us',
    loadComponent: () => import('./pages/about-us/about-us.component').then(m => m.AboutUsComponent)
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./pages/contact-us/contact-us.component').then(m => m.ContactUsComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'client-choice/:id',
    loadComponent: () => import('./pages/client-choice/client-choice.component').then(m => m.ClientChoiceComponent),
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
