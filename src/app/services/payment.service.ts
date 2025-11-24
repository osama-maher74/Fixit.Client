import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentIntentRequest, PaymentIntentResponse } from '../models/payment.models';

/**
 * Payment Service
 * Handles all backend API calls related to payments
 * Communicates with your backend Stripe integration
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);

  /**
   * Create a payment intent on the backend using service request ID
   * Backend endpoint: POST /api/Payment/{serviceRequestId}
   *
   * @param serviceRequestId - The service request ID (use 1 for testing, price = 200)
   * @returns Observable<any> - Contains clientSecret and payment details
   */
  createPaymentIntent(serviceRequestId: number): Observable<any> {
    const endpoint = `${environment.apiUrl}/Payment/${serviceRequestId}`;
    return this.http.post<any>(endpoint, {});
  }

  /**
   * LEGACY: Create payment intent with custom request (not used with current backend)
   * Kept for reference if you need custom payment amounts in the future
   */
  createPaymentIntentLegacy(request: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    const endpoint = `${environment.apiUrl}/Payment/create-intent`;
    return this.http.post<PaymentIntentResponse>(endpoint, request);
  }

  /**
   * Optional: Confirm payment on backend after successful Stripe confirmation
   * Use this if you need to update your database or trigger business logic
   *
   * @param paymentIntentId - The payment intent ID from Stripe
   * @returns Observable<any> - Backend confirmation response
   */
  confirmPaymentOnBackend(paymentIntentId: string): Observable<any> {
    // TODO: Replace with your actual backend endpoint
    const endpoint = `${environment.apiUrl}/Payment/confirm`;

    return this.http.post(endpoint, { paymentIntentId });
  }

  /**
   * Optional: Get payment history for current user
   *
   * @returns Observable<any[]> - Array of past payments
   */
  getPaymentHistory(): Observable<any[]> {
    // TODO: Replace with your actual backend endpoint
    const endpoint = `${environment.apiUrl}/Payment/history`;

    return this.http.get<any[]>(endpoint);
  }

  /**
   * Optional: Get payment details by ID
   *
   * @param paymentIntentId - The payment intent ID
   * @returns Observable<any> - Payment details
   */
  getPaymentDetails(paymentIntentId: string): Observable<any> {
    // TODO: Replace with your actual backend endpoint
    const endpoint = `${environment.apiUrl}/Payment/${paymentIntentId}`;

    return this.http.get(endpoint);
  }

  /**
   * Optional: Refund a payment
   *
   * @param paymentIntentId - The payment intent ID to refund
   * @param amount - Amount to refund in cents (optional, full refund if not provided)
   * @returns Observable<any> - Refund response
   */
  refundPayment(paymentIntentId: string, amount?: number): Observable<any> {
    // TODO: Replace with your actual backend endpoint
    const endpoint = `${environment.apiUrl}/Payment/refund`;

    return this.http.post(endpoint, {
      paymentIntentId,
      amount
    });
  }

  /**
   * Optional: Cancel a payment intent before it's confirmed
   *
   * @param paymentIntentId - The payment intent ID to cancel
   * @returns Observable<any> - Cancellation response
   */
  cancelPaymentIntent(paymentIntentId: string): Observable<any> {
    // TODO: Replace with your actual backend endpoint
    const endpoint = `${environment.apiUrl}/Payment/cancel`;

    return this.http.post(endpoint, { paymentIntentId });
  }
}
