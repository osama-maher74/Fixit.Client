import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { PaymentIntentRequest, PaymentIntentResponse } from '../models/payment.models';

/**
 * Mock Payment Service for Testing
 * Use this when backend is not available
 *
 * To use: Replace PaymentService with PaymentMockService in payment-test.component.ts
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentMockService {
  /**
   * Mock create payment intent
   * Returns a fake client secret for testing
   */
  createPaymentIntent(request: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    console.log('🧪 MOCK: Creating payment intent with:', request);

    // Simulate API delay
    return of({
      clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
      paymentIntentId: 'pi_mock_' + Date.now(),
      amount: request.amount,
      currency: request.currency,
      status: 'requires_payment_method'
    }).pipe(delay(500)); // 500ms delay to simulate network
  }

  /**
   * Mock confirm payment
   */
  confirmPaymentOnBackend(paymentIntentId: string): Observable<any> {
    console.log('🧪 MOCK: Confirming payment:', paymentIntentId);

    return of({
      success: true,
      message: 'Payment confirmed (mock)'
    }).pipe(delay(300));
  }

  /**
   * Mock get payment history
   */
  getPaymentHistory(): Observable<any[]> {
    return of([
      {
        id: 1,
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        created: new Date()
      }
    ]).pipe(delay(300));
  }

  /**
   * Mock get payment details
   */
  getPaymentDetails(paymentIntentId: string): Observable<any> {
    return of({
      id: paymentIntentId,
      amount: 1000,
      currency: 'usd',
      status: 'succeeded'
    }).pipe(delay(300));
  }

  /**
   * Mock refund payment
   */
  refundPayment(paymentIntentId: string, amount?: number): Observable<any> {
    return of({
      success: true,
      refundId: 'refund_mock_' + Date.now(),
      amount: amount
    }).pipe(delay(500));
  }

  /**
   * Mock cancel payment intent
   */
  cancelPaymentIntent(paymentIntentId: string): Observable<any> {
    return of({
      success: true,
      status: 'canceled'
    }).pipe(delay(300));
  }
}
