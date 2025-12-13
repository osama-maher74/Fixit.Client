import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-resend-verification',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
    templateUrl: './resend-verification.component.html',
    styleUrl: './resend-verification.component.css'
})
export class ResendVerificationComponent implements OnInit {
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    email: string = '';
    isLoading = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    ngOnInit(): void {
        // 💡 Extract email from query params if redirected from expired token page
        this.email = this.route.snapshot.queryParams['email'] || '';
    }

    onSubmit(): void {
        if (!this.email || !this.isValidEmail(this.email)) {
            this.errorMessage.set('Please enter a valid email address');
            this.toastService.error('Please enter a valid email address');
            return;
        }

        this.isLoading.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        this.authService.resendVerificationEmail(this.email).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.successMessage.set(response.message || 'Verification email sent successfully! Please check your inbox.');
                this.toastService.success('Verification email sent! Check your inbox.');

                // Optionally redirect to check-email page after 2 seconds
                setTimeout(() => {
                    this.router.navigate(['/check-email']);
                }, 2000);
            },
            error: (error) => {
                this.isLoading.set(false);
                const errorMsg = error.error?.message || 'Failed to send verification email. Please try again.';
                this.errorMessage.set(errorMsg);
                this.toastService.error(errorMsg);
            }
        });
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
