import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>{{ 'FORGOT_PASSWORD.TITLE' | translate }}</h2>
        <p class="subtitle">{{ 'FORGOT_PASSWORD.SUBTITLE' | translate }}</p>

        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
          <button class="btn btn-secondary w-100 mt-3" routerLink="/login">
            {{ 'FORGOT_PASSWORD.BACK_TO_LOGIN' | translate }}
          </button>
        } @else {
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">{{ 'LOGIN.EMAIL' | translate }}</label>
              <input type="email" id="email" formControlName="email" class="form-control"
                [class.error]="email?.invalid && email?.touched" 
                [placeholder]="'LOGIN.EMAIL_PLACEHOLDER' | translate" />
              
              <!-- UX Note as requested -->
              <p class="ux-note">Please make sure you enter a valid Gmail address.</p>

              @if (email?.invalid && email?.touched) {
                <div class="error-message">
                  @if (email?.errors?.['required']) {
                    <span>{{ 'LOGIN.VALIDATION.EMAIL_REQUIRED' | translate }}</span>
                  }
                  @if (email?.errors?.['email']) {
                    <span>{{ 'LOGIN.VALIDATION.EMAIL_INVALID' | translate }}</span>
                  }
                </div>
              }
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="forgotPasswordForm.invalid || isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
                <span>{{ 'FORGOT_PASSWORD.SENDING' | translate }}</span>
              } @else {
                <span>{{ 'FORGOT_PASSWORD.SEND_LINK' | translate }}</span>
              }
            </button>
            
            <div class="mt-3 text-center">
              <a routerLink="/login" class="link-btn">{{ 'FORGOT_PASSWORD.BACK_TO_LOGIN' | translate }}</a>
            </div>
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
      font-size: 0.95rem;
    }

    .ux-note {
      font-size: 0.8rem;
      color: #6c757d;
      margin-top: 0.25rem;
      margin-bottom: 0.5rem;
      font-style: italic;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-gold);
      box-shadow: 0 0 0 3px rgba(var(--primary-gold-rgb), 0.1);
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
    
    .link-btn {
      color: var(--primary-gold);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: color 0.3s;
      cursor: pointer;
    }
    
    .link-btn:hover {
      color: var(--primary-gold-hover);
      text-decoration: underline;
    }
    
    .w-100 {
      width: 100%;
    }
    
    .text-center {
      text-align: center;
    }

    .error-message {
        color: #dc3545;
        font-size: 0.8rem;
        margin-top: 0.25rem;
    }

    .form-control.error {
        border-color: #dc3545;
        background-color: #fff8f8;
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
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  forgotPasswordForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Check if response has a success message or just strictly success boolean
          // Usually backend returns { success: true, message: "..." }
          this.successMessage.set(response.message || 'Reset link sent successfully to your email.');
          this.toastService.success(this.translate.instant('FORGOT_PASSWORD.SUCCESS_TOAST'));
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Forgot password error:', error);
          // Pass specific error message if available
          this.toastService.error(error.error?.message || this.translate.instant('ERROR_DEFAULT'));
        }
      });
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }
}
