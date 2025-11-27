# 🚀 Quick Start - Stripe Integration

## 3-Step Setup

### 1️⃣ Add Your Stripe Key

Edit: `src/environments/environment.ts`

```typescript
stripePublishableKey: 'pk_test_YOUR_KEY_HERE'  // ← Replace this
```

Get your key: https://dashboard.stripe.com/apikeys

---

### 2️⃣ Update Backend URL (Optional)

Edit: `src/app/services/payment.service.ts`

```typescript
const endpoint = `${environment.apiUrl}/Payment/create-intent`;
```

Your backend should return:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx",
  "amount": 1000,
  "currency": "usd"
}
```

---

### 3️⃣ Test It!

```bash
ng serve
```

Navigate to: **http://localhost:4200/payment-test**

Test card: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`
- ZIP: `12345`

---

## 📁 Files Created

```
src/app/
├── models/
│   └── payment.models.ts          (Payment interfaces)
├── services/
│   ├── stripe.service.ts          (Stripe.js integration)
│   └── payment.service.ts         (Backend API calls)
├── pages/
│   └── payment-test/
│       ├── payment-test.component.ts    (Component logic)
│       ├── payment-test.component.html  (Template)
│       └── payment-test.component.css   (Styles)
└── app.routes.ts                  (Route added: /payment-test)

src/environments/
├── environment.ts                 (Updated with Stripe key)
└── environment.development.ts     (Updated with Stripe key)

src/assets/i18n/
├── en.json                        (English translations added)
└── ar.json                        (Arabic translations added)
```

---

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0025 0000 3155` | 🔒 Requires 3D Secure |
| `4000 0000 0000 9995` | ❌ Declined |

More cards: https://stripe.com/docs/testing#cards

---

## 🎨 Key Features

✅ Full Stripe Elements integration
✅ Payment Intent flow
✅ Real-time validation
✅ Loading & error states
✅ Success confirmation
✅ Dark mode support
✅ i18n (English/Arabic)
✅ Responsive design
✅ Angular 20 best practices

---

## 🔧 Customization

### Change Currency
`payment-test.component.ts` → `currency: 'eur'`

### Minimum Amount
`payment-test.component.ts` → `Validators.min(5.00)`

### Styling
`stripe.service.ts` → `getCardElementOptions()`

### Translations
`src/assets/i18n/en.json` → `PAYMENT` section

---

## 🆘 Quick Troubleshooting

**Card element not showing?**
- Check Stripe key is set
- Check browser console
- Verify `card-element` div exists

**Backend errors?**
- Verify backend is running
- Check CORS settings
- Verify endpoint URL matches

**Payment not working?**
- Use test card numbers
- Check Stripe Dashboard logs
- Verify backend returns clientSecret

---

## 📖 Full Documentation

See **STRIPE_INTEGRATION_README.md** for:
- Detailed setup instructions
- Backend implementation examples
- Security best practices
- Architecture explanations
- Advanced features

---

**Ready to accept payments! 💳✨**
