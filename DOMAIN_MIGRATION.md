# Domain Migration Guide - kidsstorytime.ai

## Domain Information
- **New Domain**: kidsstorytime.ai
- **Previous Domain**: kidsstorytime.org
- **Domain Registrar**: Spaceship
- **Current Hosting**: Netlify
- **Migration Date**: 2025-08-31

## DNS Configuration at Spaceship

### Step 1: Access Spaceship DNS Settings
1. Log in to your Spaceship account
2. Navigate to "My Domains"
3. Click on `kidsstorytime.ai`
4. Select "DNS Management" or "Name Servers"

### Step 2: Configure DNS for Netlify

#### Option A: Using Netlify DNS (Recommended)
1. In Netlify Dashboard:
   - Go to your site settings
   - Navigate to "Domain management"
   - Click "Add custom domain"
   - Enter `kidsstorytime.ai`
   - Follow the instructions to verify ownership

2. In Spaceship:
   - Change nameservers to Netlify's:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

#### Option B: Using Spaceship DNS (External DNS)
1. Keep Spaceship's default nameservers
2. First, get your Netlify site name from your Netlify dashboard (looks like: amazing-einstein-12345.netlify.app)
3. Add these DNS records in Spaceship:

   **For apex/root domain (kidsstorytime.ai):**
   ```
   Type: ALIAS or ANAME (if available) or A
   Name: @ (or leave blank for root)
   Value: [your-site-name].netlify.app (for ALIAS/ANAME)
         OR use A record with IP: 75.2.60.5
   TTL: 3600
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: [your-site-name].netlify.app
   TTL: 3600
   ```

   **Important Notes:**
   - Replace [your-site-name] with your actual Netlify subdomain
   - If Spaceship doesn't support ALIAS/ANAME for the root domain, use the A record with IP 75.2.60.5
   - The CNAME for www should point to your Netlify subdomain, NOT to kidsstorytime.ai

   **Netlify verification (if required):**
   ```
   Type: TXT
   Name: @
   Value: [verification-code-from-netlify]
   TTL: 3600
   ```

### Step 3: Update Netlify Settings
1. Log in to Netlify Dashboard
2. Go to Site settings → Domain management
3. Add custom domain: `kidsstorytime.ai`
4. Add domain alias: `www.kidsstorytime.ai`
5. Set primary domain to `kidsstorytime.ai`

### Step 4: SSL Certificate
- Netlify will automatically provision an SSL certificate via Let's Encrypt
- This may take 24-48 hours after DNS propagation
- Check status in Netlify Dashboard under Domain settings → HTTPS

## Redirect Configuration

### From old domain (kidsstorytime.org) to new domain (kidsstorytime.ai)

Add to `netlify.toml`:
```toml
[[redirects]]
  from = "https://kidsstorytime.org/*"
  to = "https://kidsstorytime.ai/:splat"
  status = 301
  force = true

[[redirects]]
  from = "https://www.kidsstorytime.org/*"
  to = "https://kidsstorytime.ai/:splat"
  status = 301
  force = true
```

### Ensure www redirects to non-www:
```toml
[[redirects]]
  from = "https://www.kidsstorytime.ai/*"
  to = "https://kidsstorytime.ai/:splat"
  status = 301
  force = true
```

## Email Configuration

### Setting up email with kidsstorytime.ai

#### Option 1: Email Forwarding (Simple)
In Spaceship DNS settings, set up email forwarding:
- Forward `support@kidsstorytime.ai` → your personal email
- Forward `privacy@kidsstorytime.ai` → your personal email
- Forward `parents@kidsstorytime.ai` → your personal email

#### Option 2: Professional Email (Google Workspace/Microsoft 365)
Add MX records in Spaceship DNS:

**For Google Workspace:**
```
MX @ ASPMX.L.GOOGLE.COM 1
MX @ ALT1.ASPMX.L.GOOGLE.COM 5
MX @ ALT2.ASPMX.L.GOOGLE.COM 5
MX @ ALT3.ASPMX.L.GOOGLE.COM 10
MX @ ALT4.ASPMX.L.GOOGLE.COM 10
```

**For Microsoft 365:**
```
MX @ [your-domain].mail.protection.outlook.com 0
```

## Files Updated

All references to `kidsstorytime.org` have been updated to `kidsstorytime.ai` in:
- HTML files (index.html, terms.html, privacy.html, etc.)
- JavaScript files (all service files)
- React components (App.jsx, components)
- Documentation files (*.md)
- Configuration files

## Testing Checklist

After DNS propagation (can take 24-48 hours):

- [ ] Test https://kidsstorytime.ai loads correctly
- [ ] Test https://www.kidsstorytime.ai redirects to non-www
- [ ] Verify SSL certificate is active
- [ ] Test old domain redirects (if you still own kidsstorytime.org)
- [ ] Test all internal links work correctly
- [ ] Verify API endpoints are accessible
- [ ] Test authentication flow
- [ ] Check email delivery (if configured)
- [ ] Update Google Analytics with new domain
- [ ] Update Google AdSense with new domain
- [ ] Update any third-party integrations

## Environment Variables to Update

In Netlify Dashboard, update these if needed:
- `SITE_URL`: https://kidsstorytime.ai
- `PUBLIC_URL`: https://kidsstorytime.ai
- Any webhook URLs that reference the old domain

## SEO Considerations

1. **301 Redirects**: Ensure all old URLs redirect to new domain
2. **Google Search Console**: 
   - Add new property for kidsstorytime.ai
   - Submit change of address
   - Submit new sitemap
3. **Update External Links**:
   - Social media profiles
   - Business listings
   - Partner websites
4. **Update Marketing Materials**:
   - Business cards
   - Email signatures
   - Advertising campaigns

## Rollback Plan

If issues occur:
1. Keep kidsstorytime.org active during transition
2. Have DNS records documented
3. Can revert Netlify domain settings
4. Keep backup of all changed files

## Support Contacts

- **Spaceship Support**: https://www.spaceship.com/support
- **Netlify Support**: https://www.netlify.com/support
- **DNS Propagation Check**: https://www.whatsmydns.net

## Notes

- DNS propagation typically takes 24-48 hours globally
- Keep both domains active during transition period
- Monitor 404 errors in Netlify analytics after migration
- Update any hardcoded URLs in database or user content

---

**Migration Status**: In Progress
**Last Updated**: 2025-08-31