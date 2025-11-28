import { Component, OnInit, AfterViewInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { PaymentService } from '../../services/payment.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { PaymentIntentRequest, PaymentResult } from '../../models/payment.models';

/**
 * Payment Component
 * Professional Stripe payment integration for service requests
 *
 * Features:
 * - Stripe Elements card input
 * - Automatic service request ID from route
 * - Dynamic total amount from backend
 * - Real-time validation
 * - Loading states
 * - Error handling
 * - Success/failure messages
 * - Theme-aware styling
 */
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  // Services
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  public stripeService = inject(StripeService);
  private paymentService = inject(PaymentService);
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);

  // Form
  paymentForm!: FormGroup;

  // State signals
  isLoadingStripe = signal(true);
  isLoadingPaymentInfo = signal(true);
  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  paymentCompleted = signal(false);

  // Service request details
  serviceRequestId = signal<number | null>(null);
  totalAmount = signal<number | null>(null);

  // Payment details for success display
  completedPaymentAmount = signal<number | null>(null);
  completedPaymentId = signal<string | null>(null);

  ngOnInit(): void {
    // Get service request ID from route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('serviceRequestId');
      if (id) {
        const requestId = +id;
        this.serviceRequestId.set(requestId);
        this.loadPaymentInfo(requestId);
      } else {
        this.errorMessage.set('No service request ID provided');
        this.isLoadingPaymentInfo.set(false);
      }
    });

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
   * Load payment information from backend
   */
  private loadPaymentInfo(serviceRequestId: number): void {
    this.isLoadingPaymentInfo.set(true);

    // Create payment intent to get the total amount
    this.paymentService.createPaymentIntent(serviceRequestId).subscribe({
      next: (response) => {
        console.log('Payment info loaded:', response);

        // Extract amount from response (amount is in cents)
        const amount = response.amount || response.totalAmount || 0;
        this.totalAmount.set(amount);

        this.isLoadingPaymentInfo.set(false);
      },
      error: (err) => {
        console.error('Failed to load payment info:', err);
        this.errorMessage.set('Failed to load payment information. Please try again.');
        this.isLoadingPaymentInfo.set(false);
      }
    });
  }

  /**
   * Initialize the payment form
   */
  private initializeForm(): void {
    this.paymentForm = this.fb.group({});
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

    // Check if we have a service request ID
    if (!this.serviceRequestId()) {
      this.errorMessage.set('No service request ID available');
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

      // Step 1: Get service request ID from signal
      const serviceRequestId = this.serviceRequestId()!;

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
   * Navigate back to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Format amount for display (amount is in cents)
   */
  formatAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
  }

  /**
   * Format amount for display in EGP
   */
  formatAmountEGP(amount: number): string {
    return amount.toFixed(2);
  }
}
