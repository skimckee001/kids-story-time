# 🚨 Required Netlify Environment Variables

## Critical Issue: 502 Bad Gateway on Story Generation

The v2 story generation is failing with a 502 error because the OpenAI API key is not properly configured.

## Required Environment Variables

### For Story Generation to Work:

1. **`OPENAI_API_KEY`** (NOT `VITE_OPENAI_API_KEY`)
   - **Status**: REQUIRED for v2 to work
   - **Where**: Netlify Dashboard → Site Settings → Environment Variables
   - **Value**: Your OpenAI API key (starts with `sk-`)
   - **Important**: Do NOT use VITE_ prefix for this one!

2. **`VITE_STORYGEN_V2_ENABLED`**
   - **Status**: Already set to TRUE ✅
   - **Purpose**: Enables v2 generation system

### How to Set Environment Variables in Netlify:

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (kidsstorytime)
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Scopes**: Select all (or at least Production)
6. Click **Create variable**

### Difference Between Variables:

| Variable | Where Used | Purpose |
|----------|------------|---------|
| `OPENAI_API_KEY` | Netlify Functions (Backend) | Used by generate-story-v2.js |
| `VITE_OPENAI_API_KEY` | Frontend (if needed) | Not currently used |
| `VITE_STORYGEN_V2_ENABLED` | Frontend | Enables v2 in UI |

### Verifying the Fix:

After adding `OPENAI_API_KEY`:

1. Trigger a new deployment (or it will auto-deploy)
2. Test story generation
3. Check browser console - should NOT see 502 errors
4. Should see stories generating successfully

### Current Status:

- ❌ `OPENAI_API_KEY` - Missing (causing 502 error)
- ✅ `VITE_STORYGEN_V2_ENABLED` - Set to TRUE
- ✅ Code fixes - All deployed

Once you add the `OPENAI_API_KEY` environment variable, the v2 story generation should start working immediately after the next deployment.

---
*Last Updated: September 2025*