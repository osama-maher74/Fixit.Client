import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from './loading.service';

/**
 * AGGRESSIVE Global Error Handler
 * Prevents ALL error pages from showing - only shows loading
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // Maximum time to show loading before redirecting (8 seconds)
  private readonly MAX_LOADING_TIME = 8000;

  // Track if we're already handling an error to prevent loops
  private isHandlingError = false;

  handleError(error: any): void {
    // Prevent error handling loops
    if (this.isHandlingError) {
      console.warn('⚠️ Error loop detected - skipping duplicate error handling');
      return;
    }

    this.isHandlingError = true;

    console.error('🔴 Global Error Caught:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', this.getErrorMessage(error));

    // IMMEDIATELY show loading for ANY error
    // This prevents error pages from flashing
    this.ngZone.run(() => {
      this.loadingService.show();
      console.log('💡 IMMEDIATELY showing loading to prevent error page');
    });

    // Set timeout to hide loading and redirect if error persists
    setTimeout(() => {
      this.ngZone.run(() => {
        if (this.loadingService.isLoading()) {
          console.warn('⏱️ Loading timeout - redirecting to safe page');
          this.loadingService.forceHide();

          // Redirect to home instead of showing error
          this.router.navigate(['/'], { replaceUrl: true }).then(() => {
            console.log('✅ Redirected to home page');
          });
        }

        this.isHandlingError = false;
      });
    }, this.MAX_LOADING_TIME);

    // Log error details for debugging
    this.logErrorDetails(error);
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error.toLowerCase();
    }

    if (error?.message) {
      return error.message.toLowerCase();
    }

    if (error?.error?.message) {
      return error.error.message.toLowerCase();
    }

    if (error?.rejection?.message) {
      return error.rejection.message.toLowerCase();
    }

    return String(error).toLowerCase();
  }

  private logErrorDetails(error: any): void {
    console.group('📋 Error Details');
    console.log('Type:', error?.constructor?.name);
    console.log('Message:', this.getErrorMessage(error));
    console.log('Stack:', error?.stack);
    console.log('Full Error:', error);
    console.groupEnd();

    // TODO: Send to error tracking service
    // this.errorTrackingService.logError(error);
  }
}
