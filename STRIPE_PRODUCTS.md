# Stripe Product and Price IDs

## Current Products (Live)

### Read to Me ProMax
- **Product ID:** `prod_SzCXUDassA5zJi`
- **Price ID:** `price_1S3E8k0MYOtGjLFhbQQ2EKzw`
- **Monthly Price:** $6.99
- **Features:**
  - 20 stories per day (100/month)
  - 150 AI images per month
  - 30 narrations per month
  - 2 child profiles
  - Full library access
  - Audio downloads
  - Bedtime reminders & streaks
  - Ad-free experience

### Story Pro
- **Product ID:** `prod_Sy7tSlrclTh6K0`
- **Price ID:** `price_1S2Bdq0MYOtGjLFhBYSIU8L9`
- **Monthly Price:** $4.99
- **Features:**
  - 10 stories per day (50/month)
  - 30 AI images per month
  - 3 narrations per month
  - 2 child profiles
  - Full library access
  - Ad-free experience

### Family Plus
- **Product ID:** `prod_Sy7whD8okJo5NO`
- **Price ID:** `price_1S2BgM0MYOtGjLFhlBjRzwaV`
- **Monthly Price:** $7.99
- **Features:**
  - Unlimited stories
  - 250 AI images per month
  - 50 narrations per month
  - 4 child profiles
  - Priority support
  - Beta features access
  - Ad-free experience

## Test Mode Products

For testing in development, use Stripe test mode with the following test keys:
- **Test Public Key:** `pk_test_51RsK5a0MYOtGjLFhHQIFsu70fMh280B1WbipmKXQEYXWt0gQPKK2YvHuhIVfyGSRcVJ21orq3hdK6bCwT5vGU4VU00mskVtFVa`
- **Test Secret Key:** Configure in `.env` as `STRIPE_SECRET_KEY`

## Webhook Configuration

### Webhook Endpoint
- **URL:** `https://kidsstorytime.ai/.netlify/functions/stripe-webhook`
- **Events to Listen:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### Webhook Secret
Configure in Netlify environment as `STRIPE_WEBHOOK_SECRET`

## Environment Variables Required

### Netlify Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Local Development (.env)
```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## TODO
1. ✅ Story Pro product created in Stripe Dashboard
2. ✅ Family Plus product created in Stripe Dashboard
3. ✅ All price IDs updated in codebase
4. Configure webhook endpoint in Stripe Dashboard
5. Test complete subscription flow with live products

## Notes
- All prices are in USD
- Subscriptions are monthly with option for yearly (not yet implemented)
- Free tier (Infrequent Reader) doesn't require Stripe

---
**Last Updated:** September 3, 2025