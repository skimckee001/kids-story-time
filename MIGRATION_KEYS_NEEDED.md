# 🔑 API Keys Needed for React Migration

## IMMEDIATE ACTION REQUIRED

The hardcoded Supabase credentials have been removed from the codebase for security. You need to provide the following API keys to continue the migration.

## Required API Keys

### 1. Supabase (Database & Auth)
Get these from: https://app.supabase.com/project/uewfbzzrgiacgplyoccv/settings/api

```env
SUPABASE_URL=https://uewfbzzrgiacgplyoccv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (the full key you already have)
SUPABASE_SERVICE_KEY=(get from Supabase dashboard - Service Role key)
```

### 2. OpenAI (Story & Image Generation)
Get from: https://platform.openai.com/api-keys

```env
OPENAI_API_KEY=sk-... (your OpenAI API key)
```

### 3. Stripe (Payment Processing) - CRITICAL
Get from: https://dashboard.stripe.com/apikeys

```env
STRIPE_PUBLIC_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook settings)
```

### 4. Optional Image Services
Only if you want multiple image generation options:

```env
REPLICATE_API_TOKEN=(from https://replicate.com/account/api-tokens)
PEXELS_API_KEY=(from https://www.pexels.com/api/)
```

## How to Provide These Keys

### Option 1: Create .env file (Recommended for now)
1. Copy `.env.example` to `.env`
2. Fill in all the values above
3. I'll continue with the migration

### Option 2: Direct Entry
Simply paste the keys here in the chat and I'll configure them:

```
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
REPLICATE_API_TOKEN=
PEXELS_API_KEY=
```

### Option 3: Netlify Dashboard (For Production)
Add these in your Netlify dashboard under Site Settings > Environment Variables

## Current Migration Status

✅ **Completed:**
- Removed hardcoded credentials from source code
- Created environment variable configuration
- Set up React-Supabase integration
- Created API bridge to connect React with existing functions

⏳ **Waiting on Keys to Continue:**
- Test React app connection to Supabase
- Set up Stripe payment integration
- Deploy React version to production

🔴 **IMPORTANT SECURITY NOTE:**
The old Supabase keys were exposed in the repository. After providing the keys above, you should:
1. Rotate the Supabase keys in the Supabase dashboard
2. Update them in Netlify
3. Never commit API keys to Git

## Need Help?

- **Supabase Keys**: Go to your project at https://app.supabase.com and find Settings > API
- **Stripe Setup**: Visit https://stripe.com/docs/keys
- **OpenAI**: Visit https://platform.openai.com/account/api-keys

Once you provide these keys, I can immediately continue with:
1. Testing the React app with real data
2. Setting up Stripe checkout
3. Deploying to production

---
Please provide the keys when ready, and I'll continue the migration immediately.