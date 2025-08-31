# Stripe Payment Integration Setup Guide

## 📋 Prerequisites
- Stripe account (create at https://stripe.com)
- Bank account for payouts
- Business information (or individual)

## 🎯 Step 1: Access Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in with your account
3. Make sure you're in **Test Mode** initially (toggle in top right)

## 💳 Step 2: Create Products and Prices

### Product 1: Story Maker (Basic Tier)
1. Go to **Products** in the sidebar
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: Story Maker
   - **Description**: Create 10 stories daily with AI illustrations
   - **Image**: Upload a nice icon (optional)
4. Click **"Add product"**
5. In the pricing section:
   - Click **"Add price"**
   - **Pricing model**: Standard pricing
   - **Price**: $4.99
   - **Billing period**: Monthly
   - Click **"Add price"**
6. **Copy the Price ID** (looks like: `price_1A2B3C4D5E6F7G8H`)

### Product 2: Family Plan (Plus Tier)
1. Click **"+ Add product"** again
2. Fill in:
   - **Name**: Family Plan
   - **Description**: Unlimited stories & AI for the whole family
   - **Image**: Upload a family icon (optional)
3. Click **"Add product"**
4. In the pricing section:
   - Click **"Add price"**
   - **Price**: $7.99
   - **Billing period**: Monthly
   - Click **"Add price"**
5. **Copy the Price ID**

### Product 3: Movie Director (Premium - Future)
1. Click **"+ Add product"**
2. Fill in:
   - **Name**: Movie Director (Coming Soon)
   - **Description**: Create animated story videos with AI
3. Click **"Add product"**
4. In the pricing section:
   - Click **"Add price"**
   - **Price**: $14.99
   - **Billing period**: Monthly
   - Click **"Add price"**
5. **Copy the Price ID**

## 🔗 Step 3: Configure Webhooks

### Create Webhook Endpoint
1. Go to **Developers** > **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://kidsstorytime.org/.netlify/functions/stripe-webhook`
   - For local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com)
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the Signing secret** (starts with `whsec_`)

## 🔑 Step 4: Get Your API Keys

1. Go to **Developers** > **API keys**
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend - KEEP SECURE!)

## 📝 Step 5: Configure Customer Portal

1. Go to **Settings** > **Billing** > **Customer portal**
2. Enable the portal
3. Configure:
   - ✅ Customers can update payment methods
   - ✅ Customers can cancel subscriptions
   - ✅ Customers can switch plans
   - ✅ Customers can view invoices
4. Set cancellation policy:
   - Immediate cancellation (recommended for family-friendly approach)
5. Add your business information:
   - Support email: support@kidsstorytime.org
   - Privacy policy: https://kidsstorytime.org/privacy
   - Terms of service: https://kidsstorytime.org/terms
6. Save changes

## 🎁 Step 6: Configure Trial Period (Optional)

For each product price:
1. Edit the price
2. Add a free trial period: 7 days (or your preference)
3. Save

## 💰 Step 7: Set Up Tax (If Required)

1. Go to **Settings** > **Tax**
2. Enable tax collection if needed
3. Add tax registrations for your jurisdictions

## 🔒 Step 8: Security Settings

1. Go to **Settings** > **Security**
2. Enable:
   - Two-factor authentication
   - PCI compliance mode
   - Radar for fraud protection

## 📊 Your Stripe Configuration:

After completing the above, you should have:

### API Keys:
```env
# Test Mode (for development)
STRIPE_PUBLIC_KEY_TEST=pk_test_...
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...

# Live Mode (for production - get these when ready)
STRIPE_PUBLIC_KEY_LIVE=pk_live_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
```

### Price IDs:
```javascript
// Add these to your stripe.js config
const PRICE_IDS = {
  STORY_MAKER_MONTHLY: 'price_...', // $4.99/month
  FAMILY_MONTHLY: 'price_...',      // $7.99/month
  MOVIE_DIRECTOR_MONTHLY: 'price_...' // $14.99/month (future)
};
```

## 🧪 Step 9: Test Your Integration

### Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test Flow:
1. Create a subscription with test card
2. Verify webhook received
3. Check customer portal works
4. Test cancellation
5. Test payment method update

## 🚀 Step 10: Go Live Checklist

Before switching to live mode:
- [ ] All test scenarios pass
- [ ] Webhook endpoint is live
- [ ] Error handling implemented
- [ ] Receipt emails configured
- [ ] Refund policy defined
- [ ] Support process ready
- [ ] Analytics tracking added
- [ ] Fraud rules configured

## 📱 Mobile Considerations

Since many parents use mobile:
- [ ] Test checkout on mobile devices
- [ ] Ensure Apple Pay/Google Pay work
- [ ] Verify responsive design
- [ ] Test saved payment methods

## 👨‍👩‍👧‍👦 Family-Friendly Best Practices

1. **Clear Pricing**: No hidden fees
2. **Easy Cancellation**: One-click cancel
3. **Parental Controls**: Clear who's being charged
4. **Refund Policy**: Generous for kids' content
5. **Trial Period**: Let families try first
6. **Payment Security**: PCI compliant
7. **Email Receipts**: Always send confirmations

## 🔧 Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not receiving | Check URL, use Stripe CLI for local testing |
| Payment fails | Check API keys, verify card details |
| Subscription not updating | Verify webhook events are configured |
| Customer can't cancel | Check portal settings |

## 📞 Support Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [API Reference](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)

---

## Next Steps After Setup:

1. Update `/src/lib/stripe.js` with your price IDs
2. Add environment variables to `.env.local`
3. Test the checkout flow
4. Deploy webhook endpoint
5. Switch to live mode when ready

Remember: Start in test mode, thoroughly test everything, then switch to live mode!