# KidsStoryTime.ai - Site Map & URL Structure

## Current Pages (Implemented)

### 1. Main Application (React SPA)
**URL:** `https://kidsstorytime.ai/`
- Story Generation Form
- Story Display
- Story Library
- User Profile Management
- Achievement System
- Community Features
- Parent Dashboard
- Settings

### 2. Landing Page
**URL:** `https://kidsstorytime.ai/landing.html`
- Hero Section with value proposition
- Feature showcase
- Pricing tiers
- Testimonials
- Trust indicators
- CTA sections

### 3. Pricing Page
**URL:** `https://kidsstorytime.ai/pricing-new.html`
- Detailed pricing tiers:
  - Infrequent Reader (Free)
  - Story Pro ($4.99/mo)
  - Read to Me ProMax ($6.99/mo)
  - Family Plus ($7.99/mo)
- Feature comparison
- Monthly/Yearly toggle
- Sign-up CTAs

## Planned Pages (To Be Implemented)

### Core Pages

#### 4. About Us
**URL:** `https://kidsstorytime.ai/about`
- Company mission and vision
- Founder's story (Brett's journey)
- Team members
- Company values
- Educational philosophy
- Safety commitment

#### 5. Contact Us
**URL:** `https://kidsstorytime.ai/contact`
- Contact form
- Email: support@kidsstorytime.ai
- FAQ section
- Support ticket system
- Business inquiries
- Press/Media contact

#### 6. Blog
**URL:** `https://kidsstorytime.ai/blog`
- Parenting tips
- Bedtime story benefits
- Educational content
- Product updates
- Success stories
- SEO-optimized articles

#### 7. Help Center / FAQ
**URL:** `https://kidsstorytime.ai/help`
- Getting started guide
- How to create stories
- Subscription management
- Technical support
- Troubleshooting
- Video tutorials

### Legal Pages

#### 8. Privacy Policy
**URL:** `https://kidsstorytime.ai/privacy`
- Data collection practices
- COPPA compliance
- User rights
- Cookie policy
- Data security measures

#### 9. Terms of Service
**URL:** `https://kidsstorytime.ai/terms`
- User agreement
- Acceptable use policy
- Subscription terms
- Content ownership
- Disclaimers

#### 10. Cookie Policy
**URL:** `https://kidsstorytime.ai/cookies`
- Cookie usage
- Types of cookies
- Managing preferences
- Third-party cookies

### Marketing Pages

#### 11. How It Works
**URL:** `https://kidsstorytime.ai/how-it-works`
- Step-by-step guide
- Video demonstration
- Feature highlights
- Use cases

#### 12. For Schools
**URL:** `https://kidsstorytime.ai/schools`
- Educational benefits
- Classroom integration
- Bulk pricing
- Teacher resources
- Case studies

#### 13. Gift Subscriptions
**URL:** `https://kidsstorytime.ai/gift`
- Gift options
- Gift cards
- Special occasions
- Corporate gifts

### Community Pages

#### 14. Success Stories
**URL:** `https://kidsstorytime.ai/stories`
- User testimonials
- Case studies
- Before/after scenarios
- Video testimonials

#### 15. Resources
**URL:** `https://kidsstorytime.ai/resources`
- Downloadable guides
- Printable activities
- Story prompts
- Reading tips
- Parent resources

## Footer Structure

### Column 1: Product
- How It Works
- Features
- Pricing
- Gift Subscriptions
- Schools & Educators

### Column 2: Company
- About Us
- Blog
- Careers
- Press Kit
- Contact

### Column 3: Support
- Help Center
- FAQ
- Contact Support
- System Status
- Report a Bug

### Column 4: Legal
- Privacy Policy
- Terms of Service
- Cookie Policy
- COPPA Compliance
- Refund Policy

### Column 5: Connect
- Facebook
- Instagram
- Twitter
- YouTube
- Newsletter Signup

## URL Routing Strategy

### Current Issues:
1. React SPA handles all routes at root (`/`)
2. Static HTML files require `.html` extension
3. No proper routing configuration

### Recommended Solution:

#### Option 1: Netlify Redirects (Recommended)
Create `_redirects` file:
```
/pricing    /pricing-new.html    200
/landing    /landing.html        200
/about      /about.html          200
/contact    /contact.html        200
/privacy    /privacy.html        200
/terms      /terms.html          200
/help       /help.html           200
/blog       /blog/index.html     200

# SPA fallback
/*          /index.html          200
```

#### Option 2: React Router Integration
- Integrate all pages into React app
- Use React Router for navigation
- Better UX with no page reloads
- Consistent header/footer

#### Option 3: Next.js Migration (Future)
- Server-side rendering for SEO
- Better performance
- Automatic routing
- API routes included

## SEO Considerations

### Meta Tags Needed:
- Title tags (50-60 characters)
- Meta descriptions (150-160 characters)
- Open Graph tags for social sharing
- Schema markup for rich snippets
- Canonical URLs

### Sitemap.xml Structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kidsstorytime.ai/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://kidsstorytime.ai/pricing</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>
  <!-- Add all pages -->
</urlset>
```

## Implementation Priority

### Phase 1 (Immediate):
1. Fix URL routing with Netlify redirects
2. Create About Us page
3. Create Contact page
4. Add Privacy Policy
5. Add Terms of Service

### Phase 2 (Next Sprint):
1. Help Center/FAQ
2. Blog setup
3. Cookie Policy
4. How It Works page

### Phase 3 (Future):
1. For Schools page
2. Gift Subscriptions
3. Success Stories
4. Resources section
5. Full React Router integration

## Analytics Tracking

Each page should track:
- Page views
- Time on page
- Bounce rate
- Conversion events
- User flow

---

**Last Updated:** September 3, 2025
**Status:** Planning & Implementation Phase