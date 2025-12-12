import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  verificationMessage = signal<string | null>(null);
  verificationSuccess = signal(false);
  isTokenExpired = signal(false);
  userEmail = signal<string | null>(null);
  resendingEmail = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user came from email verification link
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = params['token'];
      const action = params['action'];

      if (action === 'verify' && email && token) {
        this.handleEmailVerification(email, token);
      }
    });
  }

  private handleEmailVerification(email: string, token: string): void {
    this.isLoading.set(true);
    this.userEmail.set(email);

    this.authService.verifyEmail({ email, token }).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        // Check if already verified
        if (response.alreadyVerified) {
          this.verificationSuccess.set(true);
          this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.ALREADY_VERIFIED'));
          this.toastService.info(this.translate.instant('VERIFY_EMAIL.ALREADY_VERIFIED'));
        } else {
          this.verificationSuccess.set(true);
          this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.SUCCESS'));
          this.toastService.success(this.translate.instant('VERIFY_EMAIL.SUCCESS'));
        }

        // Pre-fill email in login form
        this.loginForm.patchValue({ email });
        this.isTokenExpired.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.verificationSuccess.set(false);

        console.log('========== VERIFICATION ERROR ==========');
        console.log('Error status:', error.status);
        console.log('Error body:', error.error);
        console.log('Specific error code:', error.error?.error);

        // Based on backend code:
        // return BadRequest(new { success = false, error = "TokenExpired", ... })
        if (error.status === 400 && error.error?.error === 'TokenExpired') {
          console.log('✅ Detected TokenExpired from backend');
          this.isTokenExpired.set(true);

          // Backend sends: email = result.Email
          if (error.error.email) {
            this.userEmail.set(error.error.email);
          }

          this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.TOKEN_EXPIRED_MESSAGE'));
        }
        else if (error.status === 404 || (error.error?.error === 'UserNotFound')) {
          this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.USER_NOT_FOUND'));
          this.toastService.error(this.translate.instant('VERIFY_EMAIL.USER_NOT_FOUND'));
        }
        else {
          // Other errors
          const errorMsg = error.error?.message || this.translate.instant('VERIFY_EMAIL.VERIFICATION_FAILED');
          this.verificationMessage.set(errorMsg);
          this.toastService.error(errorMsg);
        }
      }
    });
  }

  resendVerificationEmail(): void {
    const email = this.userEmail();
    if (!email) {
      this.toastService.error('Email address not found');
      return;
    }

    this.resendingEmail.set(true);

    this.authService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.resendingEmail.set(false);
        this.isTokenExpired.set(false);
        this.verificationSuccess.set(true);
        this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.RESEND_SUCCESS'));
        this.toastService.success(this.translate.instant('VERIFY_EMAIL.RESEND_SUCCESS'));
      },
      error: (error) => {
        this.resendingEmail.set(false);

        // Check if email was verified in the meantime
        if (error.status === 400 && error.error?.message?.includes('already verified')) {
          this.isTokenExpired.set(false);
          this.verificationSuccess.set(true);
          this.verificationMessage.set(this.translate.instant('VERIFY_EMAIL.ALREADY_VERIFIED'));
          this.toastService.info(this.translate.instant('VERIFY_EMAIL.ALREADY_VERIFIED'));
        } else {
          const errorMsg = error.error?.message || this.translate.instant('VERIFY_EMAIL.RESEND_ERROR');
          this.toastService.error(errorMsg);
        }
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const loginData: LoginRequest = {
        Email: this.loginForm.value.email,
        Password: this.loginForm.value.password
      };

      console.log('========== LOGIN ATTEMPT START ==========');
      console.log('Login form data:', this.loginForm.value);
      console.log('Login payload (PascalCase):', loginData);
      console.log('Email being sent:', loginData.Email);

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('========== LOGIN SUCCESS ==========');
          console.log('Login response received:', response);

          // Start SignalR connection after successful login
          this.notificationService.reconnectSignalR();

          // Wait a moment for auth service to finish storing data
          setTimeout(() => {
            const storedEmail = localStorage.getItem('email');
            const storedUser = localStorage.getItem('current_user');
            console.log('Verification - Email in localStorage after login:', storedEmail);
            console.log('Verification - User in localStorage after login:', storedUser);

            if (!storedEmail) {
              console.error('❌ CRITICAL: Email was NOT stored in localStorage!');
              console.error('Check auth.service.ts handleAuthResponse method');
            }
            if (!storedUser) {
              console.error('❌ CRITICAL: User was NOT stored in localStorage!');
            }

            // Redirect based on user role
            console.log('User role:', response.role);

            let redirectUrl: string;
            if (response.role === 'Admin') {
              redirectUrl = '/admin/dashboard';
            } else {
              redirectUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
            }

            console.log('Navigating to:', redirectUrl);
            this.isLoading.set(false);
            this.router.navigate([redirectUrl]);
          }, 100);
        },
        error: (error) => {
          console.error('========== LOGIN ERROR ==========');
          console.error('Login error:', error);
          console.error('Error message:', error.message);
          console.error('Error status:', error.status);
          this.isLoading.set(false);
          this.toastService.error(error.message || this.translate.instant('LOGIN.ERROR_DEFAULT'));
        }
      });
    } else {
      console.warn('Login form is invalid');
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
