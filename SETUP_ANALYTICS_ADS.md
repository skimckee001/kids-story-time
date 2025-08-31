# Analytics and Ads Setup Guide

## 📊 Google Analytics Setup

### Step 1: Create/Access Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring" or "Admin" if you have an existing account

### Step 2: Create a Property for KidsStoryTime
1. Click "Create Property"
2. Enter property name: "KidsStoryTime.org"
3. Select your timezone and currency
4. Click "Next"

### Step 3: Set up a Web Data Stream
1. Choose "Web" as platform
2. Enter website URL: `https://kidsstorytime.ai`
3. Enter stream name: "KidsStoryTime Main"
4. Click "Create stream"

### Step 4: Get Your Measurement ID
1. Your Measurement ID will appear (format: `G-XXXXXXXXXX`)
2. **Copy this ID** - we'll need it for the code

### Step 5: Configure Enhanced Measurement (Optional but Recommended)
- Page views ✅
- Scrolls ✅
- Outbound clicks ✅
- Site search ✅
- Form interactions ✅
- File downloads ✅

## 💰 Google AdSense Setup

### Step 1: Create/Access AdSense Account
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign in with your Google account
3. Click "Get started" if new

### Step 2: Add Your Site
1. Enter your website: `https://kidsstorytime.ai`
2. Select your country
3. Choose payment currency
4. Review and accept terms

### Step 3: Get Your Publisher ID
1. Go to Account > Settings > Account Information
2. Find your Publisher ID (format: `pub-XXXXXXXXXXXXXXXX`)
3. **Copy this ID** - we'll use it as `ca-pub-XXXXXXXXXXXXXXXX`

### Step 4: Create Ad Units for Kids Site
Since this is a kids' site, create family-friendly ad units:

#### Ad Unit 1: Story Page Ad
1. Click "Ads" > "By ad unit" > "Display ads"
2. Name: "Story_Page_Middle"
3. Size: Responsive
4. Click "Create"
5. **Copy the ad slot ID** (the number in data-ad-slot)

#### Ad Unit 2: Library Page Ad
1. Create another display ad
2. Name: "Library_Page"
3. Size: Responsive
4. **Copy the ad slot ID**

#### Ad Unit 3: Home Page Ad
1. Create another display ad
2. Name: "Home_Page_Bottom"
3. Size: Responsive
4. **Copy the ad slot ID**

### Step 5: Configure Child Safety Settings
**CRITICAL for Kids' Site:**
1. Go to Blocking controls > All sites
2. Enable "Child-directed treatment"
3. Block sensitive categories:
   - Dating
   - Gambling
   - Alcohol
   - Politics
   - Religion (optional)
   - Weight loss
   - Get rich quick schemes

## 📝 Your IDs to Collect:

After completing the above steps, you should have:

### Google Analytics:
- [ ] Measurement ID: `G-___________` (11 characters after G-)

### Google AdSense:
- [ ] Publisher ID: `ca-pub-________________` (16 digits after ca-pub-)
- [ ] Story Page Ad Slot: `__________` (10 digits)
- [ ] Library Page Ad Slot: `__________` (10 digits)
- [ ] Home Page Ad Slot: `__________` (10 digits)

## 🔒 Best Practices for Kids' Sites:

### Privacy Compliance:
1. **COPPA Compliance** (US):
   - Don't collect personal info from users under 13
   - Use Google's child-directed treatment
   - Disable personalized ads

2. **GDPR-K Compliance** (EU):
   - Get parental consent for data processing
   - Limit data collection
   - Provide clear privacy policy

3. **Ad Safety**:
   - Only family-friendly advertisers
   - No behavioral targeting
   - Regular ad monitoring
   - Quick removal process for inappropriate ads

### Analytics Configuration:
```javascript
// Recommended GA4 config for kids' site
gtag('config', 'G-YOUR_ID', {
  'anonymize_ip': true,
  'allow_google_signals': false,
  'allow_ad_personalization_signals': false,
  'restricted_data_processing': true
});
```

### AdSense Best Practices:
- Place ads clearly labeled as "Advertisement"
- Don't place ads near interactive elements
- Limit to 1-2 ads per page for better UX
- Monitor regularly for inappropriate content

## 📋 Verification Checklist:

Before going live:
- [ ] Analytics tracking working in GA4 Real-time
- [ ] Ads showing but marked as "child-directed"
- [ ] Privacy policy updated with GA/AdSense
- [ ] Cookie consent banner configured
- [ ] Test with ad blocker to ensure site works
- [ ] Parents can easily report inappropriate ads

## 🚨 Important Notes:

1. **Approval Time**: AdSense can take 24-48 hours to approve
2. **Testing**: Use Analytics DebugView for testing
3. **Ad Revenue**: Child-directed ads typically have lower CPM
4. **Alternative**: Consider YouTube Kids model (subscription instead of ads)

---

Once you have all the IDs above, we'll update them in the code!