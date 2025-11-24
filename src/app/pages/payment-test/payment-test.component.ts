import { Component, OnInit, AfterViewInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { PaymentService } from '../../services/payment.service';
// import { PaymentMockService } from '../../services/payment-mock.service'; // Uncomment to use mock
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { PaymentIntentRequest, PaymentResult } from '../../models/payment.models';

/**
 * Payment Test Component
 * A complete Stripe payment integration page for testing payments
 *
 * Features:
 * - Stripe Elements card input
 * - Amount and description form
 * - Real-time validation
 * - Loading states
 * - Error handling
 * - Success/failure messages
 * - Theme-aware styling
 */
@Component({
  selector: 'app-payment-test',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './payment-test.component.html',
  styleUrl: './payment-test.component.css'
})
export class PaymentTestComponent implements OnInit, AfterViewInit, OnDestroy {
  // Services
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  public stripeService = inject(StripeService);
  private paymentService = inject(PaymentService);
  // private paymentService = inject(PaymentMockService); // Uncomment to use mock service
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);

  // Form
  paymentForm!: FormGroup;

  // State signals
  isLoadingStripe = signal(true);
  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  paymentCompleted = signal(false);

  // Payment details for success display
  completedPaymentAmount = signal<number | null>(null);
  completedPaymentId = signal<string | null>(null);

  // Billing details form
  billingName = signal<string>('');

  ngOnInit(): void {
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    // Initialize Stripe after view is ready
    this.initializeStripe();
  }

  ngOnDestroy(): void {
    // Cleanup Stripe elements
    this.stripeService.destroyCardElements();
  }

  /**
   * Initialize the payment form
   */
  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      serviceRequestId: [
        5,  // Default to 5 for testing
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^\d+$/)  // Only integers
        ]
      ]
    });
  }

  /**
   * Initialize Stripe.js and create card element
   */
  private async initializeStripe(): Promise<void> {
    try {
      this.isLoadingStripe.set(true);

      // Load Stripe library
      const loaded = await this.stripeService.loadStripe();

      if (!loaded) {
        throw new Error('Failed to load Stripe');
      }

      // Wait for Angular to render the DOM completely
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 100);
        });
      });

      // Create card elements with current theme
      const isDarkMode = this.themeService.isDark();
      const created = await this.stripeService.createCardElements(isDarkMode);

      if (!created) {
        throw new Error('Failed to create card elements');
      }

      // Successfully loaded - hide loading spinner
      this.isLoadingStripe.set(false);

    } catch (error: any) {
      console.error('Stripe initialization error:', error);
      this.isLoadingStripe.set(false);
      this.errorMessage.set(
        this.translate.instant('PAYMENT.ERROR_STRIPE_INIT')
      );
    }
  }

  /**
   * Update card elements theme when theme changes
   * Call this if user toggles theme
   */
  updateCardTheme(): void {
    const isDarkMode = this.themeService.isDark();
    this.stripeService.updateCardElementsTheme(isDarkMode);
  }

  /**
   * Handle form submission and process payment
   */
  async onSubmit(): Promise<void> {
    // Clear previous messages
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Validate form
    if (this.paymentForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    // Check if Stripe is ready
    if (!this.stripeService.isCardReady()) {
      this.errorMessage.set(
        this.translate.instant('PAYMENT.ERROR_STRIPE_NOT_READY')
      );
      return;
    }

    // Check for card validation errors
    if (this.stripeService.hasErrors()) {
      this.errorMessage.set(
        this.translate.instant('PAYMENT.ERROR_CARD_VALIDATION')
      );
      return;
    }

    try {
      this.isProcessing.set(true);

      // Step 1: Get service request ID from form
      const serviceRequestId = this.paymentForm.get('serviceRequestId')?.value;

      // Step 2: Create payment intent on backend using service request ID
      const paymentIntentResponse = await this.createPaymentIntent(serviceRequestId);

      // Log the response to see its structure
      console.log('Backend response:', paymentIntentResponse);

      // Extract clientSecret from response (handle different possible structures)
      let clientSecret: string | undefined;

      if (paymentIntentResponse?.clientSecret) {
        clientSecret = paymentIntentResponse.clientSecret;
      } else if (paymentIntentResponse?.client_secret) {
        clientSecret = paymentIntentResponse.client_secret;
      } else if (typeof paymentIntentResponse === 'string') {
        clientSecret = paymentIntentResponse;
      }

      if (!clientSecret) {
        console.error('No clientSecret found in response:', paymentIntentResponse);
        throw new Error('Invalid response from server: missing clientSecret');
      }

      console.log('Using clientSecret:', clientSecret);

      // Step 3: Confirm payment with Stripe
      const currentUser = this.authService.getCurrentUser();
      const paymentResult = await this.stripeService.confirmCardPayment(
        clientSecret,
        {
          name: currentUser ? `${currentUser.fName} ${currentUser.lName}` : undefined,
          email: currentUser?.email
        }
      );

      // Step 4: Handle payment result
      this.handlePaymentResult(paymentResult);

    } catch (error: any) {
      console.error('Payment error:', error);
      this.isProcessing.set(false);

      const errorMsg = error?.message || this.translate.instant('PAYMENT.ERROR_GENERIC');
      this.errorMessage.set(errorMsg);
    }
  }

  /**
   * Create payment intent via backend API using service request ID
   */
  private createPaymentIntent(serviceRequestId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.paymentService.createPaymentIntent(serviceRequestId).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Handle payment result from Stripe
   */
  private handlePaymentResult(result: PaymentResult): void {
    this.isProcessing.set(false);

    if (result.success) {
      // Payment succeeded - Stripe has already confirmed the payment
      this.paymentCompleted.set(true);
      this.completedPaymentAmount.set(result.amount || 0);
      this.completedPaymentId.set(result.paymentIntentId || '');

      this.successMessage.set(
        this.translate.instant('PAYMENT.SUCCESS_MESSAGE')
      );

      // Clear the form and cards
      this.paymentForm.reset();
      this.stripeService.clearCards();

      // Log the successful payment
      console.log('Payment successful! Payment Intent ID:', result.paymentIntentId);

    } else {
      // Payment failed
      const errorMsg = result.errorMessage || this.translate.instant('PAYMENT.ERROR_GENERIC');
      this.errorMessage.set(errorMsg);
    }
  }

  /**
   * Optional: Notify backend about successful payment
   */
  private confirmPaymentOnBackend(paymentIntentId: string): void {
    this.paymentService.confirmPaymentOnBackend(paymentIntentId).subscribe({
      next: (response) => {
        console.log('Payment confirmed on backend:', response);
      },
      error: (error) => {
        console.error('Backend confirmation error:', error);
        // Don't show error to user since payment already succeeded
      }
    });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormAsTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Reset the payment form and start a new payment
   */
  resetPayment(): void {
    this.paymentCompleted.set(false);
    this.completedPaymentAmount.set(null);
    this.completedPaymentId.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.paymentForm.reset();
    this.stripeService.clearCards();
  }

  /**
   * Navigate back to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Getters for form controls (for template validation)
  get serviceRequestId() {
    return this.paymentForm.get('serviceRequestId');
  }

  /**
   * Format amount for display
   */
  formatAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
  }
}
