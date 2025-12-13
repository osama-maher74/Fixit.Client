import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        
        @if (isLoading()) {
          <!-- Loading State -->
          <div class="loading-state">
            <div class="spinner"></div>
            <p class="loading-text">Verifying your email...</p>
          </div>
        } @else if (verificationSuccess()) {
          <!-- Success State -->
          <div class="icon-container success">
            <svg class="checkmark" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          
          <h2 class="title success-title">Email Verified Successfully!</h2>
          <p class="message">Your account is now active. You can login to start using the platform.</p>
          
          <button class="btn-primary" routerLink="/login">
            Login Now
          </button>
          
          <p class="auto-redirect-text">Redirecting to login in {{ countdown() }} seconds...</p>
        } @else {
          <!-- Failure State -->
          <div class="icon-container error">
            <svg class="error-icon" viewBox="0 0 52 52">
              <circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="error-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
            </svg>
          </div>
          
          <h2 class="title error-title">Verification Failed</h2>
          <p class="message">{{ errorMessage() }}</p>
          
          @if (resendSuccess()) {
            <div class="success-message">
              <p>✅ {{ resendSuccessMessage() }}</p>
            </div>
          }
          
          <button 
            class="btn-resend" 
            (click)="resendVerificationEmail()"
            [disabled]="isResending()">
            @if (isResending()) {
              <span class="spinner"></span>
              <span>Sending...</span>
            } @else {
              <span>Resend Verification Link</span>
            }
          </button>
          
          <button class="btn-secondary" routerLink="/" style="margin-top: 1rem;">
            Go to Home
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
      background-color: var(--background-accent);
    }

    .verify-card {
      background-color: var(--background-white);
      padding: 3rem 2.5rem;
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 500px;
      border: 1px solid var(--border-light);
      text-align: center;
    }

    /* Loading State */
    .loading-state {
      padding: 2rem 0;
    }

    .spinner {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 215, 0, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-gold);
      animation: spin 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    /* Icon Container */
    .icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Success Checkmark */
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      stroke-width: 2;
      stroke: #4BB543;
      stroke-miterlimit: 10;
      box-shadow: inset 0 0 0 #4BB543;
      animation: fillSuccess 0.4s ease-in-out 0.4s forwards, scaleSuccess 0.3s ease-in-out 0.9s both;
    }

    .checkmark-circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: #4BB543;
      fill: none;
      animation: strokeSuccess 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .checkmark-check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: strokeSuccess 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }

    @keyframes strokeSuccess {
      100% {
        stroke-dashoffset: 0;
      }
    }

    @keyframes scaleSuccess {
      0%, 100% {
        transform: none;
      }
      50% {
        transform: scale3d(1.1, 1.1, 1);
      }
    }

    @keyframes fillSuccess {
      100% {
        box-shadow: inset 0 0 0 30px rgba(75, 181, 67, 0.1);
      }
    }

    /* Error Icon */
    .error-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      stroke-width: 2;
      stroke: #dc3545;
      stroke-miterlimit: 10;
      box-shadow: inset 0 0 0 #dc3545;
      animation: fillError 0.4s ease-in-out 0.4s forwards, scaleError 0.3s ease-in-out 0.9s both;
    }

    .error-circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: #dc3545;
      fill: none;
      animation: strokeError 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .error-cross {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      stroke-width: 2;
      animation: strokeError 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }

    @keyframes strokeError {
      100% {
        stroke-dashoffset: 0;
      }
    }

    @keyframes scaleError {
      0%, 100% {
        transform: none;
      }
      50% {
        transform: scale3d(1.1, 1.1, 1);
      }
    }

    @keyframes fillError {
      100% {
        box-shadow: inset 0 0 0 30px rgba(220, 53, 69, 0.1);
      }
    }

    /* Typography */
    .title {
      margin-bottom: 1rem;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .success-title {
      color: #4BB543;
    }

    .error-title {
      color: #dc3545;
    }

    .message {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .auto-redirect-text {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Buttons */
    .btn-primary,
    .btn-secondary {
      width: 100%;
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background-color: var(--primary-gold);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-gold-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }

    @media (max-width: 640px) {
      .verify-card {
        padding: 2rem 1.5rem;
      }

      .title {
        font-size: 1.5rem;
      }

      .checkmark,
      .error-icon {
        width: 60px;
        height: 60px;
      }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private toastService = inject(ToastService);

  isLoading = signal(true);
  verificationSuccess = signal(false);
  errorMessage = signal('The link may be invalid or expired.');
  countdown = signal(5);
  isResending = signal(false);
  resendSuccess = signal(false);
  resendSuccessMessage = signal('');
  userEmail = signal<string | null>(null);
  private countdownInterval: any;

  ngOnInit(): void {
    // Extract query parameters
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = params['token'];

      if (!email || !token) {
        this.isLoading.set(false);
        this.verificationSuccess.set(false);
        this.errorMessage.set('Invalid verification link. Missing email or token.');
        return;
      }

      // Store email for resend functionality
      this.userEmail.set(email);

      // Call verification API
      this.verifyEmail(email, token);
    });
  }

  private verifyEmail(email: string, token: string): void {
    this.authService.verifyEmail({ email, token }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.verificationSuccess.set(true);

        // Start countdown for auto-redirect
        this.startCountdown();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.verificationSuccess.set(false);

        // Extract error message from response
        const message = error.error?.message || error.error?.title || 'Verification failed. The link may be invalid or expired.';
        this.errorMessage.set(message);
      }
    });
  }

  resendVerificationEmail(): void {
    const email = this.userEmail();
    if (!email) {
      this.toastService.error('Email not found. Please try again.');
      return;
    }

    this.isResending.set(true);
    this.resendSuccess.set(false);

    this.authService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
        this.resendSuccessMessage.set(response.message || 'A new verification link has been sent to your email.');
        this.toastService.success('New verification link sent! Check your email.');
      },
      error: (error) => {
        this.isResending.set(false);
        const errorMsg = error.error?.message || 'Failed to resend verification email.';
        this.toastService.error(errorMsg);
      }
    });
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      const current = this.countdown();
      if (current > 1) {
        this.countdown.set(current - 1);
      } else {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
