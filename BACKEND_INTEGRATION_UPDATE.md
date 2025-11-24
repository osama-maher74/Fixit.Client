# Backend Integration Update - Payment Form

## Overview
Updated the payment form to integrate with the actual backend endpoint structure that uses `serviceRequestId` instead of custom payment amounts.

## Changes Made

### 1. Payment Service (`payment.service.ts`)
**Updated method signature:**
```typescript
// BEFORE (legacy):
createPaymentIntent(request: PaymentIntentRequest): Observable<PaymentIntentResponse>

// AFTER (current):
createPaymentIntent(serviceRequestId: number): Observable<any>
```

**Updated endpoint:**
```typescript
// Matches backend structure: POST /api/Payment/{serviceRequestId}
const endpoint = `${environment.apiUrl}/Payment/${serviceRequestId}`;
return this.http.post<any>(endpoint, {});
```

### 2. Payment Component (`payment-test.component.ts`)

#### Form Initialization
**BEFORE:**
```typescript
this.paymentForm = this.fb.group({
  amount: [10, [Validators.required, Validators.min(0.50)]],
  description: ['', [Validators.required, Validators.minLength(3)]]
});
```

**AFTER:**
```typescript
this.paymentForm = this.fb.group({
  serviceRequestId: [
    1,  // Default to 1 for testing
    [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/)  // Only integers
    ]
  ]
});
```

#### Payment Processing
**BEFORE:**
```typescript
const formData = this.paymentForm.value;
const amountInCents = Math.round(parseFloat(formData.amount) * 100);

const paymentRequest: PaymentIntentRequest = {
  amount: amountInCents,
  currency: 'usd',
  description: formData.description,
  metadata: { /* ... */ }
};

const paymentIntentResponse = await this.createPaymentIntent(paymentRequest);
```

**AFTER:**
```typescript
const serviceRequestId = this.paymentForm.get('serviceRequestId')?.value;
const paymentIntentResponse = await this.createPaymentIntent(serviceRequestId);
```

#### Form Getters
**BEFORE:**
```typescript
get amount() { return this.paymentForm.get('amount'); }
get description() { return this.paymentForm.get('description'); }
```

**AFTER:**
```typescript
get serviceRequestId() { return this.paymentForm.get('serviceRequestId'); }
```

### 3. Template (`payment-test.component.html`)

**REPLACED:**
- Amount input field with $ prefix
- Description textarea field

**WITH:**
- Service Request ID input field
- Helper text explaining test values

**New field structure:**
```html
<div class="form-group">
  <label for="serviceRequestId" class="form-label">
    {{ 'PAYMENT.SERVICE_REQUEST_ID_LABEL' | translate }} *
  </label>
  <input
    type="number"
    id="serviceRequestId"
    formControlName="serviceRequestId"
    class="form-control"
    [class.error]="serviceRequestId?.invalid && serviceRequestId?.touched"
    placeholder="1"
    min="1"
  />
  <p class="form-helper-text">
    {{ 'PAYMENT.SERVICE_REQUEST_ID_HELPER' | translate }}
  </p>
</div>
```

### 4. Translations

#### English (`en.json`)
Added:
```json
"SERVICE_REQUEST_ID_LABEL": "Service Request ID",
"SERVICE_REQUEST_ID_REQUIRED": "Service Request ID is required",
"SERVICE_REQUEST_ID_MIN": "Service Request ID must be at least 1",
"SERVICE_REQUEST_ID_INVALID": "Please enter a valid service request ID (numbers only)",
"SERVICE_REQUEST_ID_HELPER": "For testing, use Service Request ID = 1 (price will be $200 from backend)"
```

#### Arabic (`ar.json`)
Added:
```json
"SERVICE_REQUEST_ID_LABEL": "رقم طلب الخدمة",
"SERVICE_REQUEST_ID_REQUIRED": "رقم طلب الخدمة مطلوب",
"SERVICE_REQUEST_ID_MIN": "رقم طلب الخدمة يجب أن يكون 1 على الأقل",
"SERVICE_REQUEST_ID_INVALID": "الرجاء إدخال رقم طلب خدمة صحيح (أرقام فقط)",
"SERVICE_REQUEST_ID_HELPER": "للاختبار، استخدم رقم طلب الخدمة = 1 (السعر سيكون 200 دولار من الخادم)"
```

### 5. Styles (`payment-test.component.css`)

Added helper text styling:
```css
.form-helper-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.375rem;
  margin-bottom: 0;
  line-height: 1.4;
}
```

## Backend Requirements

### Expected Endpoint Structure
```csharp
[HttpPost("{serviceRequestId}")]
[Authorize]
public async Task<ActionResult<ReadServiceRequestDto>> CreatePaymentIntent(int serviceRequestId)
```

### Expected Response Format
The backend should return a response containing:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  // ... other payment details
}
```

The frontend extracts `clientSecret` from the response to confirm the payment with Stripe.

## Testing Instructions

### 1. Prerequisites
- Backend server must be running
- User must be authenticated (endpoint has `[Authorize]` attribute)
- Service request with ID = 1 must exist in database

### 2. Test Flow
1. Navigate to `/payment-test`
2. Enter Service Request ID: `1`
3. Enter test card details:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
4. Click "Pay Now"
5. Expected: Payment of $200 is processed

### 3. Expected Behavior
- Frontend sends: `POST /api/Payment/1` with empty body
- Backend returns: Payment intent with `clientSecret` for $200
- Frontend confirms payment with Stripe using the `clientSecret`
- Success message displays transaction details

## Files Modified

1. ✅ `src/app/services/payment.service.ts` - Updated method signature and endpoint
2. ✅ `src/app/pages/payment-test/payment-test.component.ts` - Updated form and logic
3. ✅ `src/app/pages/payment-test/payment-test.component.html` - Replaced amount/description with serviceRequestId
4. ✅ `src/app/pages/payment-test/payment-test.component.css` - Added helper text styles
5. ✅ `src/assets/i18n/en.json` - Added translations
6. ✅ `src/assets/i18n/ar.json` - Added translations
7. ✅ `STRIPE_PAYMENT_FORM_README.md` - Updated documentation

## Build Status
✅ **Build successful** - No compilation errors
- Payment test component: 74.89 kB
- All lazy chunks loaded correctly

## Notes

1. **Authentication**: The endpoint requires authentication. Ensure the user is logged in before testing.

2. **Service Request ID**: The form validates that the ID is:
   - Required
   - Integer only (pattern validation)
   - Minimum value of 1

3. **Price Determination**: The payment amount (200) comes from the backend based on the service request, not from the frontend form.

4. **Legacy Method**: The old `createPaymentIntentLegacy()` method is kept in the service for reference if custom amounts are needed in the future.

5. **Mock Service**: The `payment-mock.service.ts` still uses the old structure and would need updating if used for testing.
