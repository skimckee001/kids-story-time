# Complete Testing Guide: Authentication & Stripe Payments

## 🚨 Current Status
- **Email Verification**: Currently NOT working (bypassed for testing)
- **Dev Mode**: Available for quick tier testing
- **Stripe**: Test mode configured

## 📱 Quick Testing Method (Recommended)

### 1. Use Dev Mode for Tier Testing
```javascript
// Open browser console and run:
localStorage.setItem('devMode', 'true');
location.reload();
```
- Look for purple 🧪 button in bottom-right corner
- Click to switch between tiers instantly
- No real authentication required

## 🔐 Authentication Testing

### Method 1: Test Without Email Verification (Current Setup)

#### A. Create Test Account (Bypasses Email Verification)
1. Open app at http://localhost:3001
2. Click "Sign Up" button in header
3. Enter test credentials:
   - Email: `test-[tier]@example.com` (e.g., `test-basic@example.com`)
   - Password: `TestPass123!`
   - Parent Name: Test User
   - ✅ Check "I agree to terms"
4. Click "Create Account"
5. **Note**: Account will be created but email won't be verified

#### B. Sign In to Existing Test Account
1. Click "Sign In" button
2. Use these pre-configured test accounts:
   ```
   Email: free@test.com      Password: TestPass123!
   Email: basic@test.com     Password: TestPass123!
   Email: premium@test.com   Password: TestPass123!
   ```
3. Click "Sign In"

### Method 2: Mock User Testing (No Database Required)

```javascript
// Open browser console and run:
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  tier: 'story-maker-basic' // Change tier as needed
};
localStorage.setItem('mockUser', JSON.stringify(mockUser));
location.reload();
```

Available tiers:
- `try-now` (Guest)
- `reader-free` (Free tier)
- `story-pro` ($4.99/month)
- `read-to-me-promax` ($6.99/month)
- `family-plus` ($7.99/month)

## 💳 Stripe Payment Testing

### Prerequisites
1. Ensure `.env` file has Stripe keys:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Test Card Numbers
Use these Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`
- **Expiry**: Any future date (e.g., 12/34)
- **CVV**: Any 3 digits (e.g., 123)
- **Zip**: Any valid zip (e.g., 12345)

### Testing Each Tier Purchase

#### 1. Story Pro ($4.99/month)
```javascript
// Price ID: price_story_pro_monthly
```
1. Click "Upgrade" or "Choose Plan"
2. Select "Story Pro" plan
3. Click "Subscribe for $4.99/month"
4. Enter test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription tier updates to `story-pro`

#### 2. Read to Me ProMax ($6.99/month)
```javascript
// Price ID: price_read_to_me_monthly
```
1. From Story Pro tier, click "Upgrade"
2. Select "Read to Me ProMax"
3. Use test card: `4242 4242 4242 4242`
4. Verify tier updates to `read-to-me-promax`

#### 3. Family Plus ($7.99/month)
```javascript
// Price ID: price_family_plus_monthly
```
1. Select "Family Plus" plan
2. Use test card: `4242 4242 4242 4242`
3. Verify tier updates to `family-plus`

### Webhook Testing (Local Development)

#### Using Stripe CLI:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
```

## 🧪 Complete Test Flow

### Step 1: Fresh Start
```javascript
// Clear all test data
localStorage.clear();
location.reload();
```

### Step 2: Test Free Tier
1. Create account with email: `free-test@example.com`
2. Verify limitations:
   - ✅ 1 story per day
   - ❌ No AI images
   - ✅ Basic library

### Step 3: Test Upgrade Flow
1. Click "Upgrade" button
2. Select "Story Pro" ($4.99)
3. Enter card: `4242 4242 4242 4242`
4. Complete payment
5. Verify features unlock:
   - ✅ 10 stories per day
   - ✅ 30 AI images
   - ✅ 3 narrations

### Step 4: Test Premium Features
```javascript
// Quick switch to premium
localStorage.setItem('subscriptionTier', 'read-to-me-promax');
location.reload();
```
1. Test voice narration
2. Test AI image generation
3. Test story export to PDF

### Step 5: Test Downgrade/Cancel
1. Click user menu → "Manage Subscription"
2. Click "Cancel Subscription"
3. Confirm cancellation
4. Verify access continues until period end

## 🔧 Troubleshooting

### Email Verification Not Working
**Current Workaround**: Email verification is bypassed. Users can sign up and immediately use the app without confirming email.

**To Fix Email Verification**:
1. Check Supabase email templates
2. Verify SMTP settings in Supabase dashboard
3. Check spam folder for verification emails

### Stripe Not Working
1. Check browser console for errors
2. Verify Stripe keys in `.env`
3. Ensure `npm run dev` is running
4. Check Netlify Functions are deployed

### User Not Persisting
```javascript
// Force user persistence
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Re-authenticate
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPass123!'
  });
}
```

## 📊 Testing Checklist

### Authentication
- [ ] Sign up with new email
- [ ] Sign in with existing account
- [ ] Password reset flow
- [ ] Social login (if configured)
- [ ] Remember me functionality
- [ ] Sign out

### Subscription Tiers
- [ ] Free tier limitations work
- [ ] Story Pro features unlock
- [ ] Read to Me ProMax features work
- [ ] Family Plus unlimited access
- [ ] Upgrade flow completes
- [ ] Downgrade/cancel works

### Payment Processing
- [ ] Stripe checkout opens
- [ ] Test card accepted
- [ ] Subscription created in Stripe
- [ ] Webhook updates database
- [ ] User tier updates in app
- [ ] Billing portal accessible

### Feature Access by Tier

#### Free Tier (reader-free)
- [ ] 1 story per day limit enforced
- [ ] No AI images (uses default)
- [ ] Basic library access
- [ ] Star rewards work
- [ ] Achievements track

#### Story Pro ($4.99)
- [ ] 10 stories per day
- [ ] 30 AI images per month
- [ ] 3 narrations per month
- [ ] 2 child profiles
- [ ] PDF export (no watermark)

#### Read to Me ProMax ($6.99)
- [ ] 20 stories per day
- [ ] 150 AI images per month
- [ ] 30 narrations per month
- [ ] Voice selection works
- [ ] Audio downloads

#### Family Plus ($7.99)
- [ ] Unlimited stories
- [ ] 250 AI images per month
- [ ] 50 narrations per month
- [ ] 4 child profiles
- [ ] All features unlocked

## 🚀 Quick Commands

```javascript
// Enable dev mode
localStorage.setItem('devMode', 'true');

// Set specific tier
localStorage.setItem('subscriptionTier', 'story-pro');

// Create mock user
localStorage.setItem('mockUser', JSON.stringify({
  id: 'test-123',
  email: 'test@example.com',
  tier: 'family-plus'
}));

// Clear all test data
localStorage.clear();

// Check current tier
localStorage.getItem('subscriptionTier');

// Force reload with new tier
location.reload();
```

## 📝 Notes

1. **Production Testing**: Use `?dev=true` parameter on production URL
2. **Stripe Dashboard**: Monitor test payments at https://dashboard.stripe.com/test/payments
3. **Supabase Dashboard**: Check user creation at your Supabase project URL
4. **Email Issues**: Currently bypassed - users don't need to verify email
5. **Mobile Testing**: Use Chrome DevTools device mode for responsive testing

---
*Last Updated: September 4, 2025*
*Version: 1.0*