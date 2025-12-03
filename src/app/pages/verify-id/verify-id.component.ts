import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CraftsmanService } from '../../services/craftsman.service';
import { IdVerificationService, IdVerificationResponse } from '../../services/id-verification.service';
import { CraftsmanProfile } from '../../models/craftsman.models';

@Component({
  selector: 'app-verify-id',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './verify-id.component.html',
  styleUrl: './verify-id.component.css'
})
export class VerifyIdComponent implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private idVerificationService = inject(IdVerificationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  // Signals for reactive state management
  profile = signal<CraftsmanProfile | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // ID Verification signals
  idFrontImage = signal<File | null>(null);
  idBackImage = signal<File | null>(null);
  idFrontPreview = signal<string | null>(null);
  idBackPreview = signal<string | null>(null);
  isVerifying = signal<boolean>(false);
  verificationResult = signal<IdVerificationResponse | null>(null);
  verificationErrors = signal<string[]>([]);

  ngOnInit(): void {
    this.loadUserProfile();
  }

  /**
   * Load current craftsman profile
   */
  private loadUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.craftsmanService.getCurrentUserProfile().subscribe({
      next: (data: CraftsmanProfile) => {
        console.log('Verify ID - Craftsman profile loaded:', data);
        this.profile.set(data);
        this.isLoading.set(false);

        // If already verified, redirect to profile
        if (data.isVerified) {
          this.router.navigate(['/profile']);
        }
      },
      error: (error: any) => {
        console.error('Verify ID - Error loading profile:', error);
        this.errorMessage.set(error.message || 'Failed to load profile');
        this.isLoading.set(false);

        if (error.message === 'No logged-in user found') {
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      }
    });
  }

  /**
   * Handle front ID image selection
   */
  onIdFrontImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file
      const error = this.idVerificationService.validateImageFile(file);
      if (error) {
        this.verificationErrors.set([this.translate.instant(error)]);
        return;
      }

      this.idFrontImage.set(file);

      // Create preview
      this.idVerificationService.convertToBase64(file).then(base64 => {
        this.idFrontPreview.set(base64);
      }).catch(err => {
        console.error('Error creating preview:', err);
      });

      this.verificationErrors.set([]);
    }
  }

  /**
   * Handle back ID image selection
   */
  onIdBackImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file
      const error = this.idVerificationService.validateImageFile(file);
      if (error) {
        this.verificationErrors.set([this.translate.instant(error)]);
        return;
      }

      this.idBackImage.set(file);

      // Create preview
      this.idVerificationService.convertToBase64(file).then(base64 => {
        this.idBackPreview.set(base64);
      }).catch(err => {
        console.error('Error creating preview:', err);
      });

      this.verificationErrors.set([]);
    }
  }

  /**
   * Remove front ID image
   */
  removeIdFrontImage(): void {
    this.idFrontImage.set(null);
    this.idFrontPreview.set(null);

    // Reset file input
    const fileInput = document.querySelector('#idFrontInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Remove back ID image
   */
  removeIdBackImage(): void {
    this.idBackImage.set(null);
    this.idBackPreview.set(null);

    // Reset file input
    const fileInput = document.querySelector('#idBackInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Verify National ID with AI
   */
  verifyNationalId(): void {
    const front = this.idFrontImage();
    const back = this.idBackImage();

    // Check if both images are selected
    if (!front || !back) {
      this.verificationErrors.set([
        this.translate.instant('ID_VERIFICATION.ERRORS.BOTH_PHOTOS_REQUIRED')
      ]);
      return;
    }

    // Check if already verified
    const profile = this.profile();
    if (profile?.isVerified) {
      this.verificationErrors.set([
        this.translate.instant('ID_VERIFICATION.ALREADY_VERIFIED')
      ]);
      return;
    }

    // Get email from localStorage
    const email = localStorage.getItem('email');
    if (!email) {
      this.verificationErrors.set([
        this.translate.instant('ID_VERIFICATION.ERRORS.EMAIL_NOT_FOUND')
      ]);
      return;
    }

    this.isVerifying.set(true);
    this.verificationErrors.set([]);
    this.verificationResult.set(null);

    this.idVerificationService.verifyNationalId(front, back, email).subscribe({
      next: (result) => {
        console.log('Verification result:', result);
        this.verificationResult.set(result);
        this.isVerifying.set(false);

        if (result.isValid) {
          // Success - show success message and redirect to profile
          this.successMessage.set(
            this.translate.instant('ID_VERIFICATION.VERIFICATION_SUCCESS_MESSAGE')
          );

          // Redirect to profile after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        } else {
          // Failed - show errors
          this.verificationErrors.set(result.errors);
        }
      },
      error: (error) => {
        console.error('Verification error:', error);
        this.isVerifying.set(false);

        // Handle different error types
        let errorMessage = 'ID_VERIFICATION.ERRORS.VERIFICATION_ERROR';
        if (error.status === 0) {
          errorMessage = 'ID_VERIFICATION.ERRORS.NETWORK_ERROR';
        } else if (error.error?.message) {
          // If backend returns a specific message, use it
          this.verificationErrors.set([error.error.message]);
          return;
        }

        this.verificationErrors.set([
          this.translate.instant(errorMessage)
        ]);
      }
    });
  }

  /**
   * Check if craftsman is already verified
   */
  isVerified(): boolean {
    const profile = this.profile();
    return profile?.isVerified || false;
  }

  /**
   * Navigate back to profile
   */
  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
