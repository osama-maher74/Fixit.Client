import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PaymentResult } from '../models/payment.models';

/**
 * Stripe Service
 * Handles all Stripe.js client-side operations with separate card elements
 * - Loading Stripe.js library
 * - Creating separate elements (card number, expiry, CVC)
 * - Confirming card payments
 * - Managing payment state
 */
@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: any = null;
  private cardNumberElement: any = null;
  private cardExpiryElement: any = null;
  private cardCvcElement: any = null;
  private elements: any = null;

  // Signal-based state management
  public isStripeLoaded = signal(false);
  public isProcessing = signal(false);
  public cardNumberError = signal<string | null>(null);
  public cardExpiryError = signal<string | null>(null);
  public cardCvcError = signal<string | null>(null);

  /**
   * Load Stripe.js library dynamically
   */
  async loadStripe(): Promise<boolean> {
    try {
      if (this.stripe) {
        this.isStripeLoaded.set(true);
        return true;
      }

      if (!(window as any).Stripe) {
        await this.loadStripeScript();
      }

      this.stripe = (window as any).Stripe(environment.stripePublishableKey);

      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      this.isStripeLoaded.set(true);
      return true;
    } catch (error) {
      console.error('Error loading Stripe:', error);
      this.isStripeLoaded.set(false);
      return false;
    }
  }

  /**
   * Load Stripe.js script dynamically
   */
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Create and mount separate Stripe card elements
   */
  async createCardElements(isDarkMode: boolean = false): Promise<boolean> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized. Call loadStripe() first.');
      }

      // Get element styling
      const elementStyles = this.getElementStyles(isDarkMode);

      // Create elements instance
      this.elements = this.stripe.elements();

      // Create card number element
      const cardNumberContainer = document.getElementById('card-number-element');
      if (!cardNumberContainer) {
        throw new Error('Card number element not found');
      }

      this.cardNumberElement = this.elements.create('cardNumber', {
        style: elementStyles,
        placeholder: '1234 5678 9012 3456'
      });
      this.cardNumberElement.mount('#card-number-element');

      // Listen for changes
      this.cardNumberElement.on('change', (event: any) => {
        if (event.error) {
          this.cardNumberError.set(event.error.message);
        } else {
          this.cardNumberError.set(null);
        }
      });

      // Create card expiry element
      const cardExpiryContainer = document.getElementById('card-expiry-element');
      if (!cardExpiryContainer) {
        throw new Error('Card expiry element not found');
      }

      this.cardExpiryElement = this.elements.create('cardExpiry', {
        style: elementStyles,
        placeholder: 'MM / YY'
      });
      this.cardExpiryElement.mount('#card-expiry-element');

      this.cardExpiryElement.on('change', (event: any) => {
        if (event.error) {
          this.cardExpiryError.set(event.error.message);
        } else {
          this.cardExpiryError.set(null);
        }
      });

      // Create card CVC element
      const cardCvcContainer = document.getElementById('card-cvc-element');
      if (!cardCvcContainer) {
        throw new Error('Card CVC element not found');
      }

      this.cardCvcElement = this.elements.create('cardCvc', {
        style: elementStyles,
        placeholder: '123'
      });
      this.cardCvcElement.mount('#card-cvc-element');

      this.cardCvcElement.on('change', (event: any) => {
        if (event.error) {
          this.cardCvcError.set(event.error.message);
        } else {
          this.cardCvcError.set(null);
        }
      });

      return true;
    } catch (error) {
      console.error('Error creating card elements:', error);
      return false;
    }
  }

  /**
   * Get element styling based on theme
   */
  private getElementStyles(isDarkMode: boolean) {
    return {
      base: {
        color: isDarkMode ? '#F0F0F0' : '#374151',
        fontFamily: "'Cairo', sans-serif",
        fontSize: '16px',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: isDarkMode ? '#B8B8B8' : '#9CA3AF'
        }
      },
      invalid: {
        color: '#DC2626',
        iconColor: '#DC2626'
      }
    };
  }

  /**
   * Update card elements theme
   */
  updateCardElementsTheme(isDarkMode: boolean): void {
    const styles = this.getElementStyles(isDarkMode);

    if (this.cardNumberElement) {
      this.cardNumberElement.update({ style: styles });
    }
    if (this.cardExpiryElement) {
      this.cardExpiryElement.update({ style: styles });
    }
    if (this.cardCvcElement) {
      this.cardCvcElement.update({ style: styles });
    }
  }

  /**
   * Confirm card payment with Stripe
   */
  async confirmCardPayment(
    clientSecret: string,
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        city?: string;
        country?: string;
        postal_code?: string;
      };
    }
  ): Promise<PaymentResult> {
    try {
      if (!this.stripe || !this.cardNumberElement) {
        throw new Error('Stripe not properly initialized');
      }

      this.isProcessing.set(true);
      this.clearErrors();

      // Confirm the card payment
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: this.cardNumberElement,
            billing_details: billingDetails || {}
          }
        }
      );

      this.isProcessing.set(false);

      if (error) {
        this.cardNumberError.set(error.message);
        return {
          success: false,
          errorMessage: error.message,
          errorCode: error.code
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        };
      }

      return {
        success: false,
        errorMessage: 'Payment requires additional authentication',
        errorCode: 'requires_action'
      };

    } catch (error: any) {
      this.isProcessing.set(false);
      const errorMessage = error?.message || 'Payment failed. Please try again.';
      this.cardNumberError.set(errorMessage);

      return {
        success: false,
        errorMessage: errorMessage,
        errorCode: 'unknown_error'
      };
    }
  }

  /**
   * Clear all card elements
   */
  clearCards(): void {
    if (this.cardNumberElement) {
      this.cardNumberElement.clear();
    }
    if (this.cardExpiryElement) {
      this.cardExpiryElement.clear();
    }
    if (this.cardCvcElement) {
      this.cardCvcElement.clear();
    }
    this.clearErrors();
  }

  /**
   * Clear all errors
   */
  private clearErrors(): void {
    this.cardNumberError.set(null);
    this.cardExpiryError.set(null);
    this.cardCvcError.set(null);
  }

  /**
   * Destroy all card elements
   */
  destroyCardElements(): void {
    if (this.cardNumberElement) {
      this.cardNumberElement.unmount();
      this.cardNumberElement.destroy();
      this.cardNumberElement = null;
    }
    if (this.cardExpiryElement) {
      this.cardExpiryElement.unmount();
      this.cardExpiryElement.destroy();
      this.cardExpiryElement = null;
    }
    if (this.cardCvcElement) {
      this.cardCvcElement.unmount();
      this.cardCvcElement.destroy();
      this.cardCvcElement = null;
    }
    this.elements = null;
    this.clearErrors();
  }

  /**
   * Check if all card elements are ready
   */
  isCardReady(): boolean {
    return this.cardNumberElement !== null &&
           this.cardExpiryElement !== null &&
           this.cardCvcElement !== null &&
           this.isStripeLoaded();
  }

  /**
   * Check if there are any validation errors
   */
  hasErrors(): boolean {
    return this.cardNumberError() !== null ||
           this.cardExpiryError() !== null ||
           this.cardCvcError() !== null;
  }
}
