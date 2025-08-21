# 🚀 Deployment Guide - Kids Story Time React App

## ✅ Current Status
- **Story Generation**: Working ✅
- **React App**: Fully functional ✅
- **Netlify Functions**: Tested and working ✅
- **Database**: Connected to Supabase ✅

## 📋 Pre-Deployment Checklist

### 1. Stripe Setup (Required for Payments)
- [ ] Log into [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Create Products:
  - **Premium Monthly**: $9.99/month
  - **Family Monthly**: $19.99/month
- [ ] Copy the Price IDs (starts with `price_...`)
- [ ] Update `src/lib/stripe.js` with the Price IDs:
  ```javascript
  premium: {
    priceId: 'price_YOUR_PREMIUM_ID_HERE',
  },
  family: {
    priceId: 'price_YOUR_FAMILY_ID_HERE',
  }
  ```
- [ ] Set up webhook endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
- [ ] Get webhook signing secret

### 2. Environment Variables for Netlify
Add these in Netlify Dashboard → Site Settings → Environment Variables:

```env
# Core Services (REQUIRED)
SUPABASE_URL=https://uewfbzzrgiacgplyoccv.supabase.co
SUPABASE_ANON_KEY=[your key from .env.local]
SUPABASE_SERVICE_KEY=[your service key from .env.local]
OPENAI_API_KEY=[your OpenAI key from .env.local]

# Stripe (REQUIRED for payments)
STRIPE_PUBLIC_KEY=[your Stripe public key from .env.local]
STRIPE_SECRET_KEY=[your Stripe secret key from .env.local]
STRIPE_WEBHOOK_SECRET=[get from Stripe dashboard after setting webhook]

# React/Vite versions (same values)
VITE_SUPABASE_URL=https://uewfbzzrgiacgplyoccv.supabase.co
VITE_SUPABASE_ANON_KEY=[same as SUPABASE_ANON_KEY]
VITE_STRIPE_PUBLIC_KEY=[same as STRIPE_PUBLIC_KEY]
VITE_OPENAI_API_KEY=[same as OPENAI_API_KEY]

# Optional
REPLICATE_API_TOKEN=[if you have one]
PEXELS_API_KEY=[if you have one]
```

## 🎯 Deployment Steps

### Option 1: Deploy via Netlify CLI (Recommended)
```bash
# Install Netlify CLI (already done)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site (first time only)
netlify init

# Deploy to draft URL for testing
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Option 2: Deploy via GitHub Integration
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → Select `kids-story-time` repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Add environment variables (from list above)
6. Click "Deploy site"

## 🔄 Migration Strategy

### Phase 1: Testing (Current)
- ✅ Deploy React app to staging URL
- ✅ Test all features work
- ✅ Verify story generation
- [ ] Test payment flow with Stripe test mode

### Phase 2: Soft Launch
- [ ] Deploy to production URL (kidsstorytime.org)
- [ ] Keep both versions running for 1 week
- [ ] Monitor for issues
- [ ] Gather user feedback

### Phase 3: Full Migration
- [ ] Redirect all traffic to React version
- [ ] Archive old HTML files
- [ ] Update all documentation

## 🧪 Testing After Deployment

1. **Basic Functionality**
   - [ ] Can create a story
   - [ ] Story displays correctly
   - [ ] Images generate (if applicable)
   - [ ] Can save story (with login)

2. **Authentication**
   - [ ] Sign up works
   - [ ] Login works
   - [ ] Password reset works
   - [ ] Session persists

3. **Payments (with test card)**
   - [ ] Can upgrade to Premium
   - [ ] Can upgrade to Family
   - [ ] Webhook updates subscription
   - [ ] Features unlock after payment

4. **Performance**
   - [ ] Page loads quickly
   - [ ] Story generation < 20 seconds
   - [ ] No console errors

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   netlify rollback
   ```

2. **Or via Dashboard**
   - Go to Deploys tab in Netlify
   - Click on previous successful deploy
   - Click "Publish deploy"

## 📊 Success Metrics

Monitor these after deployment:
- [ ] Error rate < 1%
- [ ] Story generation success rate > 95%
- [ ] Page load time < 3 seconds
- [ ] User complaints < 5

## 🔗 Important URLs

- **Production**: https://kidsstorytime.org
- **Netlify Dashboard**: https://app.netlify.com
- **GitHub Repo**: https://github.com/skimckee001/kids-story-time
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://app.supabase.com/project/uewfbzzrgiacgplyoccv

## 📝 Post-Deployment Tasks

1. **Update DNS** (if using custom domain)
   - Point kidsstorytime.org to Netlify

2. **Enable Netlify Features**
   - [ ] Enable Analytics
   - [ ] Enable Form detection
   - [ ] Set up Split Testing (optional)

3. **Monitor**
   - Check Netlify Functions logs
   - Monitor Supabase usage
   - Track OpenAI API usage

## ⚡ Quick Commands

```bash
# View logs
netlify functions:log

# Test function locally
netlify functions:invoke generate-story --payload '{"childName":"Test"}'

# Open Netlify dashboard
netlify open

# Check deployment status
netlify status
```

## 🎉 Success Indicators

You'll know the deployment is successful when:
1. ✅ Site loads at your URL
2. ✅ Can generate a story
3. ✅ No errors in console
4. ✅ Functions respond correctly
5. ✅ Database connections work

---

**Last Updated**: 2025-08-21
**Status**: Ready for deployment! 🚀