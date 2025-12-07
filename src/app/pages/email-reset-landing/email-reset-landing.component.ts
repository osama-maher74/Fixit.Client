import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-email-reset-landing',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="landing-container">
      <div class="spinner"></div>
      <p>Processing your password reset request...</p>
    </div>
  `,
    styles: [`
    .landing-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--background-accent);
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-gold);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      color: var(--text-primary);
      font-size: 1.1rem;
    }
  `]
})
export class EmailResetLandingComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    ngOnInit(): void {
        // Extract email and token from URL query params
        this.route.queryParams.subscribe(params => {
            const email = params['email'];
            const token = params['token'];

            if (email && token) {
                // Encode token to preserve special characters
                const encodedToken = encodeURIComponent(token);

                console.log('Landing: Redirecting to reset-password with encoded token');

                // Redirect to the actual reset password page
                this.router.navigate(['/reset-password'], {
                    queryParams: {
                        email: email,
                        token: encodedToken
                    }
                });
            } else {
                // Missing parameters, redirect to login
                console.error('Missing email or token in landing page');
                this.router.navigate(['/login']);
            }
        });
    }
}
