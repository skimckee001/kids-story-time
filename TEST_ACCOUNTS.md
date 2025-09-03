# Test Accounts & Tier Testing Guide

## 🧪 Developer Test Panel

### How to Access

The app includes a built-in Developer Test Panel for easy tier switching and testing.

#### Access Methods:
1. **Local Development**: Automatically visible when running on localhost
2. **Production Testing**: 
   - Add `?dev=true` to the URL (e.g., `https://kidsstorytime.ai?dev=true`)
   - OR press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac) to toggle dev mode
3. **Look for**: Purple 🧪 button in bottom-right corner

### Available Test Tiers

| Tier | Name | Description | Features |
|------|------|-------------|----------|
| **try-now** | Guest User | No account required | 1 story to try, basic features |
| **reader-free** | Free Reader | Basic free account | 1 story/day, no AI images, basic library |
| **story-maker-basic** | Story Maker | Entry paid tier | 10 stories/day, AI images, full library |
| **movie-director-premium** | Movie Director | Premium tier | 20 stories/day, voice narration, all features |
| **family** | Family Plan | Multi-user | Unlimited profiles, 20 stories/day |
| **family-plus** | Family Plus | Ultimate tier | Everything unlimited, priority support |

## Test Account Credentials

When using the Dev Test Panel, mock accounts are created with these emails:
- Guest: `guest@test.com`
- Free: `free@test.com`
- Basic: `basic@test.com`
- Premium: `premium@test.com`
- Family: `family@test.com`
- Family Plus: `familyplus@test.com`

## How to Test Different Tiers

1. **Open Dev Panel**: Click the 🧪 button
2. **Select a Tier**: Click any tier button to instantly switch
3. **Clear Test Account**: Use the red "Clear Test Account" button to reset
4. **Page Refreshes**: The page will reload when switching tiers

## Features by Tier

### Try Now (Guest)
- ✅ 1 free story
- ✅ Basic library (localStorage only)
- ✅ Star rewards system
- ✅ Achievement tracking
- ❌ No account required
- ❌ No AI images
- ❌ No saving to cloud

### Reader Free
- ✅ 1 story per day
- ✅ Cloud library storage
- ✅ Basic achievements
- ✅ Reading streaks
- ❌ No AI images
- ❌ Limited customization

### Story Maker Basic ($4.99/month)
- ✅ 10 stories per day
- ✅ AI-generated images
- ✅ Full customization
- ✅ Multiple child profiles
- ✅ Advanced achievements
- ✅ Export to PDF

### Movie Director Premium ($7.99/month)
- ✅ 20 stories per day
- ✅ Voice narration
- ✅ Sound effects
- ✅ Advanced AI images
- ✅ Story templates
- ✅ Priority generation

### Family Plans
- ✅ All premium features
- ✅ Unlimited child profiles
- ✅ Parent dashboard
- ✅ Educational insights
- ✅ Custom themes
- ✅ Priority support

## Testing Checklist

When testing each tier, verify:

- [ ] Story generation limit enforced
- [ ] AI image generation availability
- [ ] Library storage (local vs cloud)
- [ ] Achievement system access
- [ ] Star rewards functionality
- [ ] Voice narration (premium only)
- [ ] Profile limits
- [ ] Upgrade prompts appear correctly
- [ ] Feature locks work properly

## Troubleshooting

### Dev Panel Not Showing?
1. Check URL has `?dev=true`
2. Try keyboard shortcut: `Ctrl+Shift+D`
3. Check browser console for errors
4. Clear cache and reload

### Tier Not Switching?
1. Check localStorage isn't full
2. Try "Clear Test Account" first
3. Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### Features Not Updating?
1. Some features require page reload
2. Clear browser cache
3. Check console for tier confirmation

## Notes

- Test accounts are **local only** - they don't hit the database
- Changes persist in localStorage until cleared
- Dev panel is hidden in production unless explicitly enabled
- Test mode doesn't affect real user accounts
- All test data stays in browser localStorage

## Quick Commands

```javascript
// Enable dev mode via console
localStorage.setItem('devMode', 'true');
location.reload();

// Check current tier
localStorage.getItem('subscriptionTier');

// Clear all test data
localStorage.removeItem('mockUser');
localStorage.removeItem('subscriptionTier');
localStorage.removeItem('devMode');
location.reload();
```

---
*Last Updated: September 2025*