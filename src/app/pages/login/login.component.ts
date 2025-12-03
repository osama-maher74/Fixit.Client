import { Component, inject, signal } from '@angular/core';
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
export class LoginComponent {
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

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
