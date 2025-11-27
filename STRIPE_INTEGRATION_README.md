# Stripe Payment Integration - Setup Guide

## 📋 Overview

This is a complete, production-ready Stripe payment integration for your Angular 20 project. It includes:

- ✅ Full client-side Stripe.js integration
- ✅ Stripe Elements with Card input
- ✅ Payment Intent flow
- ✅ Real-time validation
- ✅ Loading states and error handling
- ✅ Success/failure UI
- ✅ Theme-aware styling (light/dark mode)
- ✅ i18n support (English/Arabic)
- ✅ Responsive design
- ✅ Modern Angular 20 patterns (signals, standalone components, inject())

---

## 📁 Files Created

### Models
- **`src/app/models/payment.models.ts`** - TypeScript interfaces for payment data

### Services
- **`src/app/services/stripe.service.ts`** - Stripe.js client integration
- **`src/app/services/payment.service.ts`** - Backend API communication

### Payment Page Component
- **`src/app/pages/payment-test/payment-test.component.ts`** - Component logic
- **`src/app/pages/payment-test/payment-test.component.html`** - Template
- **`src/app/pages/payment-test/payment-test.component.css`** - Styles

### Configuration
- **`src/environments/environment.ts`** - Environment config (updated)
- **`src/environments/environment.development.ts`** - Dev environment config (updated)
- **`src/app/app.routes.ts`** - Routing (updated)
- **`src/assets/i18n/en.json`** - English translations (updated)
- **`src/assets/i18n/ar.json`** - Arabic translations (updated)

---

## 🚀 Setup Instructions

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in or create a free account
3. Navigate to **Developers → API Keys**
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)

### Step 2: Configure Stripe Publishable Key

Open both environment files and replace the placeholder with your actual Stripe key:

**File: `src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7058/api',
  stripePublishableKey: 'pk_test_YOUR_ACTUAL_KEY_HERE' // ← Replace this
};
```

**File: `src/environments/environment.development.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7058/api',
  stripePublishableKey: 'pk_test_YOUR_ACTUAL_KEY_HERE' // ← Replace this
};
```

⚠️ **IMPORTANT**:
- Use `pk_test_...` for testing
- Use `pk_live_...` for production (only when ready!)
- Never commit your live keys to Git

### Step 3: Update Backend Endpoint

Open `src/app/services/payment.service.ts` and verify/update the endpoint:

```typescript
createPaymentIntent(request: PaymentIntentRequest): Observable<PaymentIntentResponse> {
  // TODO: Replace 'Payment/create-intent' with your actual backend endpoint
  const endpoint = `${environment.apiUrl}/Payment/create-intent`;
  return this.http.post<PaymentIntentResponse>(endpoint, request);
}
```

Replace `/Payment/create-intent` with your actual backend route.

### Step 4: Backend Requirements

Your backend endpoint should:

1. **Accept** a POST request with this structure:
```json
{
  "amount": 1000,
  "currency": "usd",
  "description": "Test payment",
  "metadata": {
    "userId": "123",
    "source": "payment-test-page"
  }
}
```

2. **Return** a response with this structure:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx",
  "amount": 1000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

**Example .NET Backend Implementation:**
```csharp
[HttpPost("create-intent")]
public async Task<IActionResult> CreatePaymentIntent([FromBody] PaymentIntentRequest request)
{
    var options = new PaymentIntentCreateOptions
    {
        Amount = request.Amount,
        Currency = request.Currency,
        Description = request.Description,
        Metadata = request.Metadata,
        AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
        {
            Enabled = true,
        },
    };

    var service = new PaymentIntentService();
    var paymentIntent = await service.CreateAsync(options);

    return Ok(new PaymentIntentResponse
    {
        ClientSecret = paymentIntent.ClientSecret,
        PaymentIntentId = paymentIntent.Id,
        Amount = paymentIntent.Amount,
        Currency = paymentIntent.Currency,
        Status = paymentIntent.Status
    });
}
```

### Step 5: Install Dependencies (if needed)

The project already has all required Angular dependencies. No additional npm packages needed for Stripe (Stripe.js is loaded dynamically from CDN).

### Step 6: Run Your Application

```bash
# Start Angular dev server
ng serve

# Or if you use npm scripts
npm start
```

Navigate to: **http://localhost:4200/payment-test**

---

## 🧪 Testing

### Test Card Numbers

Stripe provides test card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Payment succeeds |
| `4000 0025 0000 3155` | Visa - Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Visa - Payment is declined |

**Other test details:**
- **Expiry Date**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP Code**: Any 5 digits (e.g., `12345`)

[Full list of test cards](https://stripe.com/docs/testing#cards)

### Testing Flow

1. Navigate to `/payment-test`
2. Enter an amount (minimum $0.50)
3. Enter a description
4. Enter card details: `4242 4242 4242 4242`, `12/34`, `123`, `12345`
5. Click "Pay Now"
6. Check console for any errors
7. Verify success message appears

---

## 🎨 Customization

### Change Currency

Edit `payment-test.component.ts`:
```typescript
const paymentRequest: PaymentIntentRequest = {
  amount: amountInCents,
  currency: 'eur',  // Change to 'eur', 'gbp', etc.
  description: formData.description,
  // ...
};
```

### Minimum Amount

Edit `payment-test.component.ts`:
```typescript
amount: [
  '',
  [
    Validators.required,
    Validators.min(5.00),  // Change minimum amount here
    Validators.pattern(/^\d+(\.\d{1,2})?$/)
  ]
]
```

### Card Element Styling

Edit `stripe.service.ts` in the `getCardElementOptions()` method:
```typescript
private getCardElementOptions(isDarkMode: boolean): StripeCardElementOptions {
  return {
    style: {
      base: {
        color: isDarkMode ? '#F0F0F0' : '#374151',
        fontFamily: "'Cairo', sans-serif",
        fontSize: '16px', // Customize font size
        // ... customize other styles
      }
    }
  };
}
```

### Translations

Edit the translation files:
- **English**: `src/assets/i18n/en.json`
- **Arabic**: `src/assets/i18n/ar.json`

All payment-related keys are under the `PAYMENT` section.

---

## 🔒 Security Best Practices

### ✅ What This Integration Does Right

1. **Client Secret Flow**: Uses PaymentIntent with client secrets (PCI-compliant)
2. **No Card Data Storage**: Card details never touch your server
3. **Stripe Elements**: Uses secure, hosted input fields
4. **HTTPS Only**: Stripe.js requires HTTPS in production
5. **Token-based Auth**: Uses your existing JWT authentication

### ⚠️ Important Security Notes

1. **Never expose Secret Keys**: Only use Publishable keys in frontend
2. **Always validate on backend**: Don't trust client-side payment amounts
3. **Use webhook signatures**: Verify Stripe webhook signatures on backend
4. **Environment Variables**: In production, use environment variables for keys
5. **HTTPS Required**: Stripe.js will NOT work over HTTP in production

---

## 🛠️ Troubleshooting

### Issue: "Stripe is not defined"

**Solution**: Check that your `stripePublishableKey` is set correctly in environment files.

### Issue: Card element not showing

**Solution**:
1. Check browser console for errors
2. Verify the DOM element with id `card-element` exists
3. Ensure Stripe.js script loaded (check Network tab)

### Issue: "Failed to load Stripe"

**Solution**:
1. Check internet connection
2. Verify no ad blockers are blocking Stripe
3. Check browser console for CSP errors

### Issue: CORS errors when calling backend

**Solution**:
1. Verify backend CORS settings allow your frontend origin
2. Check the API URL in environment files
3. Ensure backend is running

### Issue: Payment succeeds but backend not notified

**Solution**:
1. Implement Stripe webhooks on backend
2. Listen for `payment_intent.succeeded` event
3. Verify webhook endpoint signature

---

## 📚 Architecture & Patterns

### Service Pattern

**StripeService** (`stripe.service.ts`)
- Handles all Stripe.js operations
- Loads Stripe library dynamically
- Creates and manages card elements
- Confirms payments
- Signal-based state management

**PaymentService** (`payment.service.ts`)
- Handles backend API calls
- Creates payment intents
- Optional: Confirms payments, gets history, refunds

### Component Pattern

**PaymentTestComponent** (`payment-test.component.ts`)
- Standalone component (Angular 20)
- Reactive forms with validation
- Signal-based state
- Dependency injection with `inject()`
- Clean separation: UI logic vs business logic

### State Management

Uses Angular Signals (Angular 19+):
```typescript
isProcessing = signal(false);
errorMessage = signal<string | null>(null);

// Update
this.isProcessing.set(true);

// Read in template
@if (isProcessing()) { ... }
```

### Form Validation

Uses Angular Reactive Forms:
- Built-in validators (required, min, pattern)
- Custom validators (card validation handled by Stripe)
- Real-time error display
- Touch-based validation

---

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe.js Reference](https://stripe.com/docs/js)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Test Cards](https://stripe.com/docs/testing#cards)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

---

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Check the network tab for failed API calls
3. Verify your Stripe keys are correct
4. Ensure backend is running and accessible
5. Check Stripe Dashboard logs for payment attempts

---

## 🎉 Next Steps

After getting basic payments working:

1. **Add Webhooks**: Listen for payment events on backend
2. **Save Payment Records**: Store payment history in your database
3. **Add Receipt Emails**: Send confirmation emails after successful payments
4. **Implement Refunds**: Add refund functionality
5. **Add Payment Methods**: Support Apple Pay, Google Pay, etc.
6. **Add Subscriptions**: Implement recurring payments if needed
7. **Production Checklist**: Switch to live keys, test thoroughly

---

## ✨ Features Included

- ✅ Complete payment flow (intent → confirm → success)
- ✅ Real-time card validation
- ✅ Loading states during processing
- ✅ Error handling with user-friendly messages
- ✅ Success confirmation with payment details
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ RTL support (Arabic)
- ✅ i18n translations (English/Arabic)
- ✅ Accessibility considerations
- ✅ Clean, documented code
- ✅ Production-ready architecture

---

**Built with Angular 20 + Stripe.js + Modern Best Practices** 🚀
