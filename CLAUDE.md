# Claude Context File - KidsStoryTime.ai React Application

## ⚠️ CRITICAL: Read This First
This file contains essential context for the KidsStoryTime.ai React project. **ALWAYS** read this file when starting a new session.

## Project Overview
KidsStoryTime.ai is a **React 18 + Vite** web application for generating personalized children's stories using AI. The app includes features for story generation, library management, achievements, reading streaks, and subscription management via Stripe.

## Project Location & Version
- **Active Directory**: `/Users/skimckee/Documents/Github/kids-story-time`
- **Framework**: React 18 with Vite (NOT vanilla HTML/JS)
- **Main App File**: `src/App.complete.jsx` (NOT App.jsx)
- **Live URL**: https://kidsstorytime.ai
- **Deployment**: Netlify

## ⚠️ CRITICAL FILES TO USE
```
✅ CORRECT FILES:
src/App.complete.jsx        → Main production app (1,383 lines)
src/main.jsx               → Entry point (imports App.complete.jsx)

❌ DO NOT USE:
src/App.jsx                → Old/incomplete version
src/App.original.jsx       → Backup only
Other App*.jsx files       → Test versions
```

## Technology Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS-in-JS + CSS modules
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI Services**: OpenAI API
- **Deployment**: Netlify

## Critical File Structure
```
/src/
├── main.jsx                    → Entry point
├── App.complete.jsx            → MAIN APP FILE (use this!)
├── App.original.css            → Main styles with responsive
├── index.css                   → Global styles
│
├── /components/
│   ├── Header.jsx              → Shared header (correct order)
│   ├── StoryDisplay.jsx        → Story viewing page
│   ├── StoryLibrary.jsx        → Library management
│   ├── ReadingStreak.jsx       → Streak tracking
│   ├── AchievementSystem.jsx   → Achievements + Goals tabs
│   ├── ReadingGoals.jsx        → Goal setting
│   └── ProfileManager.jsx      → Child profiles
│
├── /lib/
│   └── supabase.js            → Database connection
│
└── /netlify/functions/         → Serverless functions
```

## Environment Variables (REQUIRED)
```bash
# Client-side (MUST start with VITE_)
VITE_SUPABASE_URL=your-supabase-url              # ⚠️ NOT secret in Netlify
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key    # ⚠️ NOT secret in Netlify
VITE_OPENAI_API_KEY=your-openai-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key

# Server-side only
STRIPE_SECRET_KEY=stripe-secret
STRIPE_WEBHOOK_SECRET=webhook-secret
```

## UI/UX Standards (MUST MAINTAIN)

### 1. Header Component Order
The header MUST display elements in this exact order:
1. KidsStoryTime.ai logo
2. Tagline: "Join thousands of families creating magical bedtime moments"
3. Launch Special banner
4. Navigation buttons (Stars, Achievements, Library, etc.)

### 2. Layout Consistency
- All main containers: `max-width: 900px`
- Header, content, and library sections must align
- Consistent padding across all pages

### 3. Mobile Responsiveness
```css
/* Tablet: 768px */
- Padding: 15px (header), 25px 20px (content)
- Stacked layouts, full-width controls

/* Phone: 480px */
- Padding: 8px (app), 12px (header), 20px 15px (content)
- Icon-only buttons where applicable
- Compact layouts
```

### 4. Gender Selection Implementation
```javascript
// State structure (NOT a string!)
const [genderSelection, setGenderSelection] = useState({ 
  boy: false, 
  girl: false 
});

// Both can be selected simultaneously
// Mobile shows only emoji icons: 👦 👧
```

## Recent Major Changes (August 31, 2025)

### ✅ Completed
1. Fixed entry point to use App.complete.jsx
2. Resolved Netlify deployment issues
3. Fixed header order across all pages
4. Implemented proper gender multi-selection
5. Fixed mobile responsiveness
6. Aligned search/filter controls (46px height)
7. Integrated Reading Goals into Achievements
8. Changed all "Pricing" → "Plans"
9. Updated domain references .org → .ai
10. Icon-only gender selection on mobile
11. Fixed checkbox alignment issues

### ⚠️ Known Issues
1. **StarRewardsSystem**: Component not implemented (references commented out)
2. **AdSense**: Fallback placeholder shows when ads don't load
3. **Multiple App files**: Only use App.complete.jsx

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Git Workflow
```bash
# Always pull latest before starting
git pull

# Check your changes
git status
git diff

# Commit with descriptive message
git add .
git commit -m "feat: description of change"
git push
```

## Testing Checklist
When making changes, verify:
- [ ] App loads without console errors
- [ ] Header displays in correct order
- [ ] Mobile layout doesn't squeeze content
- [ ] Gender selection works (both selectable)
- [ ] All containers maintain 900px max-width
- [ ] Search/filter controls are aligned
- [ ] Navigation works between pages
- [ ] Achievements popup shows Goals tab

## Subscription Tiers
```javascript
'reader-free'     // Free tier
'reader'          // Basic paid
'story-maker-basic' // Story creation
'movie-director-premium' // Full features
'family'          // Family plan
'family-plus'     // Enhanced family
```

## Component State Management
- Uses React hooks (useState, useEffect)
- Local storage for child profiles and achievements
- Supabase for persistent data
- No Redux/Context API currently

## Debugging Tips
1. Check browser console for errors
2. Verify environment variables are loaded: `console.log(import.meta.env)`
3. Check Network tab for failed API calls
4. Ensure you're using App.complete.jsx

## Session Handover Protocol
When starting a new session:
1. Read this CLAUDE.md file first
2. Check SESSION_SUMMARY_2025-08-31.md for latest changes
3. Review TODO.md for pending tasks
4. Verify you're in correct directory: `/Users/skimckee/Documents/Github/kids-story-time`
5. Run `npm run dev` to start development

## Important File References
- **Latest Session**: SESSION_SUMMARY_2025-08-31.md
- **Pending Tasks**: TODO.md
- **Deployment Guide**: DEPLOYMENT_GUIDE.md
- **API Setup**: API-SETUP.md

## Contact for Issues
- GitHub Repo: Check commits for recent changes
- Netlify Dashboard: For deployment issues
- Supabase Dashboard: For database issues

---
**Last Updated**: August 31, 2025, 10:30 PM
**Version**: React Application (not vanilla HTML)
**Critical**: Always use App.complete.jsx as main app file