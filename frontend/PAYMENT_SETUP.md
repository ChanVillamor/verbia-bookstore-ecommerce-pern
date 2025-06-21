# Payment Setup Guide

## Environment Variables Required

### Frontend (.env file in frontend directory)

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### Backend (.env file in backend directory)

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here (optional)
```

## Troubleshooting Order Success Page

If the order success page is not showing after payment:

1. **Check Console Logs**: Open browser developer tools and check the console for any errors or debugging messages.

2. **Verify Stripe Keys**: Make sure your Stripe publishable and secret keys are correct and from the same Stripe account.

3. **Test Payment Flow**: Use the "Test Order Success Navigation" button (green button) in development mode to test if navigation works.

4. **Check Backend Logs**: Look at the backend console for any errors during order creation.

5. **Verify Order Creation**: Check if orders are being created in your database.

## Common Issues

1. **Missing Environment Variables**: If Stripe keys are not set, payments will fail.

2. **Network Issues**: Make sure both frontend and backend are running on the correct ports.

3. **Database Issues**: Ensure your database is running and accessible.

4. **Authentication Issues**: Make sure the user is logged in and the token is valid.

## Testing

1. Use Stripe test card numbers:

   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002

2. Use any future expiry date and any 3-digit CVC.

3. Use any valid postal code.
