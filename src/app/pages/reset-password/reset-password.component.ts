import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ResetPasswordRequest } from '../../models/auth.models';

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

            <button type="submit" class="btn btn-primary" [disabled]="isLoading()">
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
    }
    
    .w-100 {
      width: 100%;
    }
    
    .mt-3 {
      margin-top: 1rem;
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
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.email = params['email'];
            this.token = params['token'];

            if (!this.email || !this.token) {
                this.toastService.error('Invalid password reset link.');
                this.router.navigate(['/login']);
            }
        });
    }

    passwordMatchValidator(g: FormGroup) {
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
        if (this.resetPasswordForm.valid) {
            this.isLoading.set(true);

            const request: ResetPasswordRequest = {
                email: this.email,
                token: this.token,
                newPassword: this.resetPasswordForm.value.newPassword,
                confirmPassword: this.resetPasswordForm.value.confirmPassword
            };

            this.authService.resetPassword(request).subscribe({
                next: (response) => {
                    this.isLoading.set(false);
                    this.successMessage.set(response.message || this.translate.instant('RESET_PASSWORD.SUCCESS_MESSAGE'));
                    this.toastService.success(this.translate.instant('RESET_PASSWORD.SUCCESS_TOAST'));
                },
                error: (error) => {
                    this.isLoading.set(false);
                    this.toastService.error(error.error?.message || this.translate.instant('ERROR_DEFAULT'));
                }
            });
        } else {
            this.resetPasswordForm.markAllAsTouched();
        }
    }
}
