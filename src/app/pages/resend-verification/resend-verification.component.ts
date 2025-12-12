import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-resend-verification',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
    templateUrl: './resend-verification.component.html',
    styleUrl: './resend-verification.component.css'
})
export class ResendVerificationComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private router = inject(Router);

    resendForm: FormGroup;
    isLoading = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    constructor() {
        this.resendForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    get email() {
        return this.resendForm.get('email');
    }

    onSubmit(): void {
        if (this.resendForm.valid) {
            this.isLoading.set(true);
            this.successMessage.set(null);
            this.errorMessage.set(null);

            const email = this.resendForm.value.email;

            this.authService.resendVerificationEmail(email).subscribe({
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
        } else {
            this.resendForm.markAllAsTouched();
        }
    }
}
