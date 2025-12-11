import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="email-check-container">
      <div class="email-check-card">
        
        <!-- Email Icon/Image -->
        <div class="icon-container">
          <div class="icon-wrapper">
            <img src="assets/email-check.png" alt="Check Email" class="email-icon" />
          </div>
        </div>

        <!-- Title -->
        <h2 class="title">Check your Gmail to Verify Account</h2>

        <!-- Message -->
        <p class="message">
          We have sent a verification link to your email. Please check your inbox 
          (and spam folder) to activate your account.
        </p>

        <!-- Action Button -->
        <button class="btn-primary" routerLink="/login">
          Back to Login
        </button>
      </div>
    </div>
  `,
  styles: [`
    .email-check-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
      background-color: var(--background-accent);
    }

    .email-check-card {
      background-color: var(--background-white);
      padding: 3rem 2.5rem;
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 500px;
      border: 1px solid var(--border-light);
      text-align: center;
    }

    .icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 10px 25px rgba(255, 215, 0, 0.25));
      animation: smoothFloat 4s ease-in-out infinite;
    }

    .email-icon {
      width: 160px;
      height: auto;
      mix-blend-mode: multiply;
    }

    @keyframes smoothFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .title {
      color: var(--text-dark);
      margin-bottom: 1rem;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .message {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      background-color: var(--primary-gold);
      color: white;
      border: none;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary:hover {
      background-color: var(--primary-gold-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }

    @media (max-width: 640px) {
      .email-check-card {
        padding: 2rem 1.5rem;
      }

      .title {
        font-size: 1.5rem;
      }

      .email-icon {
        width: 120px;
      }
    }
  `]
})
export class CheckEmailComponent {}
