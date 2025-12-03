export const environment = {
  production: false,
  apiUrl: 'https://localhost:7058/api',

  // IMPORTANT: Replace with your actual Stripe Publishable Key (starts with pk_test_ or pk_live_)
  // Get your key from: https://dashboard.stripe.com/apikeys
  // WARNING: The current key appears to be an OpenAI secret key - DO NOT use secret keys in frontend!
  stripePublishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE',

  // ID Verification Configuration
  idVerification: {
    maxFileSizeMB: 5,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png'],
    maxRetries: 3
  }
};
