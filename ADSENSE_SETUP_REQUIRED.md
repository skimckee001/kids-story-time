# 🚨 AdSense Setup Required

## Current Status
The ads are returning 400 errors because the AdSense account needs to be properly configured.

## What's Happening
- **Error**: AdSense requests returning HTTP 400 (Bad Request)
- **Cause**: The ad unit (slot ID: 1977532623) either doesn't exist or the site isn't approved in AdSense

## Required Actions

### 1. Verify AdSense Account
1. Log into [Google AdSense](https://www.google.com/adsense/)
2. Check if `kidsstorytime.ai` is added and **approved**
3. If not approved, you'll see a status like "Getting ready" or "In review"

### 2. Create/Verify Ad Units
The code is looking for ad slot `1977532623`. You need to either:
- **Option A**: Create a new ad unit and get the correct slot ID
- **Option B**: Find the existing ad unit with this ID

#### To Create a New Ad Unit:
1. Go to AdSense > Ads > By ad unit
2. Click "+ New ad unit" 
3. Choose "Display ads"
4. Name it: "Story_Page_Middle"
5. Set size to "Responsive"
6. Click "Create"
7. Copy the `data-ad-slot` number (10 digits)
8. Update the code with the new slot ID

### 3. Site Approval Status

#### If Site is "Getting ready" or "In review":
- AdSense needs 24-48 hours to review new sites
- Ads will show 400 errors until approved
- Once approved, ads will automatically start working

#### If Site is Rejected:
Common reasons and fixes:
- **Insufficient content**: Add more stories/pages
- **Missing pages**: Ensure you have Privacy Policy, Terms of Service
- **Navigation issues**: Make sure all links work
- **Content quality**: Original, valuable content for parents/kids

### 4. Testing in Development
The code now includes `data-ad-test="on"` for localhost, which should show test ads instead of real ones during development.

## Quick Checklist
- [ ] AdSense account exists and is active
- [ ] Site `kidsstorytime.ai` is added to AdSense
- [ ] Site status is "Ready" (not "Getting ready" or "In review")  
- [ ] Ad unit exists with slot ID `1977532623` OR update code with correct ID
- [ ] Publisher ID `ca-pub-1413183979906947` is correct
- [ ] Privacy Policy and Terms pages are live and linked

## Code Locations
- **Publisher ID**: `src/components/AdSenseDebug.jsx` line 67
- **Ad Slot ID**: `src/components/StoryDisplay.jsx` line 1233
- **AdSense Script**: `index.html` line 49

## Debug Features Added
The new `AdSenseDebug` component will show:
- Current ad loading status
- Any errors encountered
- Fallback content when ads can't load
- Debug overlay in development mode

## After Approval
Once AdSense approves the site:
1. Ads will automatically start displaying
2. The 400 errors will stop
3. You can switch back from `AdSenseDebug` to `AdSense` component
4. Remove the debug overlay code

## Alternative: Disable Ads Temporarily
If you want to hide ads until AdSense is ready, comment out the AdSense component in:
- `src/components/StoryDisplay.jsx` lines 1231-1236

---
*Last Updated: September 2025*