/**
 * Payment Models
 * Defines interfaces and types for Stripe payment integration
 */

/**
 * Request payload for creating a payment intent
 */
export interface PaymentIntentRequest {
  amount: number;           // Amount in cents (e.g., 1000 = $10.00)
  currency: string;         // Currency code (e.g., 'usd', 'eur')
  description?: string;     // Payment description
  serviceId?: number;       // Optional: Link to a service
  craftsmanId?: number;     // Optional: Link to a craftsman
  metadata?: Record<string, string>;  // Optional: Additional metadata
}

/**
 * Response from backend after creating payment intent
 */
export interface PaymentIntentResponse {
  clientSecret: string;     // Stripe client secret for confirming payment
  paymentIntentId: string;  // Payment intent ID from Stripe
  amount: number;           // Amount in cents
  currency: string;         // Currency code
  status: string;           // Payment status (requires_payment_method, succeeded, etc.)
}

/**
 * Payment confirmation result
 */
export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Payment status enum matching Stripe statuses
 */
export enum PaymentStatus {
  RequiresPaymentMethod = 'requires_payment_method',
  RequiresConfirmation = 'requires_confirmation',
  RequiresAction = 'requires_action',
  Processing = 'processing',
  Succeeded = 'succeeded',
  Canceled = 'canceled',
  Failed = 'failed'
}

/**
 * Stripe card element styling options
 */
export interface StripeCardElementOptions {
  style: {
    base: {
      color: string;
      fontFamily: string;
      fontSize: string;
      fontSmoothing: string;
      '::placeholder': {
        color: string;
      };
    };
    invalid: {
      color: string;
      iconColor: string;
    };
  };
  hidePostalCode?: boolean;
}

/**
 * Payment form data
 */
export interface PaymentFormData {
  amount: number;
  description: string;
  serviceId?: number;
  craftsmanId?: number;
}
