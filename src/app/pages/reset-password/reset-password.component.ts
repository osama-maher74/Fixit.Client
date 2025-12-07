import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>{{ 'RESET_PASSWORD.TITLE' | translate }}</h2>
        <p class="subtitle">{{ 'RESET_PASSWORD.SUBTITLE' | translate }}</p>

        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
          <button class="btn btn-primary w-100 mt-3" routerLink="/login">
            {{ 'RESET_PASSWORD.GO_TO_LOGIN' | translate }}
          </button>
        } @else {
          <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
            
            <!-- Email Field (Readonly) -->
            <div class="form-group">
              <label for="email">{{ 'LOGIN.EMAIL' | translate }}</label>
              <input type="email" id="email" formControlName="email" class="form-control" readonly />
            </div>

            <!-- New Password Field -->
            <div class="form-group">
              <label for="newPassword">{{ 'RESET_PASSWORD.NEW_PASSWORD' | translate }}</label>
              <div class="password-wrapper">
                <input [type]="showPassword() ? 'text' : 'password'" id="newPassword" formControlName="newPassword"
                  class="form-control" [class.error]="newPassword?.invalid && newPassword?.touched"
                  [placeholder]="'LOGIN.PASSWORD_PLACEHOLDER' | translate" />
                <button type="button" class="toggle-password" (click)="togglePasswordVisibility()">
                  {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              @if (newPassword?.invalid && newPassword?.touched) {
                <div class="error-message">
                  @if (newPassword?.errors?.['required']) {
                    <span>{{ 'LOGIN.VALIDATION.PASSWORD_REQUIRED' | translate }}</span>
                  }
                  @if (newPassword?.errors?.['minlength']) {
                    <span>{{ 'LOGIN.VALIDATION.PASSWORD_MIN_LENGTH' | translate }}</span>
                  }
                </div>
              }
            </div>

            <!-- Confirm Password Field -->
            <div class="form-group">
              <label for="confirmPassword">{{ 'RESET_PASSWORD.CONFIRM_PASSWORD' | translate }}</label>
              <input [type]="showPassword() ? 'text' : 'password'" id="confirmPassword" formControlName="confirmPassword"
                class="form-control" [class.error]="confirmPassword?.invalid && confirmPassword?.touched"
                [placeholder]="'LOGIN.PASSWORD_PLACEHOLDER' | translate" />
              @if (confirmPassword?.invalid && confirmPassword?.touched) {
                <div class="error-message">
                  @if (confirmPassword?.errors?.['required']) {
                    <span>{{ 'LOGIN.VALIDATION.PASSWORD_REQUIRED' | translate }}</span>
                  }
                  @if (confirmPassword?.errors?.['mismatch']) {
                    <span>{{ 'REGISTER_CLIENT.VALIDATION.PASSWORD_MISMATCH' | translate }}</span>
                  }
                </div>
              }
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="resetPasswordForm.invalid || isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
                <span>{{ 'RESET_PASSWORD.RESETTING' | translate }}</span>
              } @else {
                <span>{{ 'RESET_PASSWORD.RESET_BUTTON' | translate }}</span>
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
      background-color: var(--background-accent);
    }

    .login-card {
      background-color: var(--background-white);
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 450px;
      border: 1px solid var(--border-light);
    }

    h2 {
      text-align: center;
      color: var(--text-dark);
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
    }

    .subtitle {
      text-align: center;
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      color: var(--text-secondary);
    }

    .btn-primary {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      background-color: var(--primary-gold);
      color: white;
      border: none;
      font-weight: 600;
      transition: background-color 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--primary-gold-hover);
    }

    .btn-primary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .w-100 {
      width: 100%;
    }
    
    .mt-3 {
      margin-top: 1rem;
    }

    .error-message {
        color: #dc3545;
        font-size: 0.8rem;
        margin-top: 0.25rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-light);
      border-radius: 8px;
    }

    .form-control.error {
        border-color: #dc3545;
    }

    .alert {
      padding: 1rem;
      background-color: #d4edda;
      color: #155724;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);

  resetPasswordForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);

  email: string = '';
  token: string = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      this.token = params['token'];

      if (!this.email || !this.token) {
        this.toastService.error('Invalid reset password link. Please try again.');
        this.router.navigate(['/login']);
      } else {
        // Set email in form
        this.resetPasswordForm.patchValue({ email: this.email });
        console.log('Reset Password page loaded with email:', this.email);
      }
    });
  }

  passwordMatchValidator(g: AbstractControl) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.email && this.token) {
      this.isLoading.set(true);

      // Payload matching requirements: {email, token, newPassword}
      const request: any = {
        email: this.email,
        token: this.token,
        newPassword: this.resetPasswordForm.value.newPassword
      };

      this.authService.resetPassword(request).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set(response.message || 'Password reset successfully. Logging you in...');
          this.toastService.success(this.translate.instant('RESET_PASSWORD.SUCCESS_TOAST'));

          // Auto-login
          this.isLoading.set(true);
          this.authService.login({
            Email: this.email,
            Password: this.resetPasswordForm.value.newPassword
          }).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.toastService.success('Logged in successfully');
              this.router.navigate(['/profile']);
            },
            error: (loginError) => {
              this.isLoading.set(false);
              console.error('Auto-login failed', loginError);
              this.toastService.warning('Password reset successful, but auto-login failed. Please login manually.');
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error) => {
          this.isLoading.set(false);
          this.toastService.error(error.error?.message || this.translate.instant('ERROR_DEFAULT'));
        }
      });
    } else {
      this.resetPasswordForm.markAllAsTouched();
      if (!this.email || !this.token) {
        this.toastService.error('Missing email or token. Please click the link in your email again.');
      }
    }
  }
}
