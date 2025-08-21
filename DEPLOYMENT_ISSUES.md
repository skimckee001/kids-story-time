# DEPLOYMENT ISSUES & SOLUTIONS

## ⚠️ CRITICAL: White Screen with MIME Type Error

### Problem
After deploying to Netlify, you get a white screen with error:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream"
```

### Root Cause
Netlify is not serving JavaScript files with the correct MIME type. This happens when:
1. The `netlify.toml` is misconfigured
2. Build assets are in `/assets/` folder but headers don't match
3. Netlify cache issues

### Solution
The `netlify.toml` MUST include proper headers for assets:

```toml
[[headers]]
  for = "/assets/*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"

[[headers]]
  for = "/assets/*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"
```

### If Issue Persists
1. **Clear Netlify cache**: In Netlify dashboard > Deploys > Trigger deploy > Clear cache and deploy site
2. **Check build output**: Ensure `dist/assets/` contains JS/CSS files
3. **Verify netlify.toml**: Must have `publish = "dist"` for React builds

### Prevention
- ALWAYS test deployment after React build changes
- Keep this file updated with any new deployment issues
- Check netlify.toml before major deployments

## Other Common Issues

### Missing Favicon (404 on /vite.svg)
- Solution: Use `/favicon.ico` instead of `/vite.svg` in index.html
- Already fixed in current build

### Environment Variables Not Available
- Solution: Hardcode public keys (Supabase anon key) or set in Netlify dashboard
- Current app has fallback values in `src/lib/supabase.js`

### Functions Not Working
- Ensure `[functions]` directory is set in netlify.toml
- Check function logs in Netlify dashboard

---
Last Updated: 2024-12-21
If white screen persists after fixing headers, try "Clear cache and deploy" in Netlify