#!/bin/bash

# Script to update Analytics and AdSense IDs
# Usage: ./UPDATE_IDS.sh

echo "📊 Kids Story Time - Analytics & Ads Configuration"
echo "=================================================="
echo ""

# Get Google Analytics ID
read -p "Enter your Google Analytics Measurement ID (G-XXXXXXXXXXX): " GA_ID
if [[ ! $GA_ID =~ ^G-[A-Z0-9]{10,11}$ ]]; then
    echo "⚠️  Warning: GA ID format looks incorrect. Expected format: G-XXXXXXXXXXX"
fi

# Get AdSense Publisher ID
read -p "Enter your AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX): " ADSENSE_ID
if [[ ! $ADSENSE_ID =~ ^ca-pub-[0-9]{16}$ ]]; then
    echo "⚠️  Warning: AdSense ID format looks incorrect. Expected format: ca-pub-XXXXXXXXXXXXXXXX"
fi

# Get Ad Slot IDs
read -p "Enter Story Page Ad Slot ID (10 digits): " AD_SLOT_STORY
read -p "Enter Library Page Ad Slot ID (10 digits): " AD_SLOT_LIBRARY
read -p "Enter Home Page Ad Slot ID (10 digits): " AD_SLOT_HOME

echo ""
echo "📝 Updating configuration files..."

# Update .env.local if it exists
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "✅ Created backup: .env.local.backup"
    
    # Update or add the variables
    if grep -q "VITE_GA_MEASUREMENT_ID" .env.local; then
        sed -i '' "s/VITE_GA_MEASUREMENT_ID=.*/VITE_GA_MEASUREMENT_ID=$GA_ID/" .env.local
    else
        echo "VITE_GA_MEASUREMENT_ID=$GA_ID" >> .env.local
    fi
    
    if grep -q "VITE_ADSENSE_PUBLISHER_ID" .env.local; then
        sed -i '' "s/VITE_ADSENSE_PUBLISHER_ID=.*/VITE_ADSENSE_PUBLISHER_ID=$ADSENSE_ID/" .env.local
    else
        echo "VITE_ADSENSE_PUBLISHER_ID=$ADSENSE_ID" >> .env.local
    fi
    
    if grep -q "VITE_AD_SLOT_STORY" .env.local; then
        sed -i '' "s/VITE_AD_SLOT_STORY=.*/VITE_AD_SLOT_STORY=$AD_SLOT_STORY/" .env.local
    else
        echo "VITE_AD_SLOT_STORY=$AD_SLOT_STORY" >> .env.local
    fi
    
    if grep -q "VITE_AD_SLOT_LIBRARY" .env.local; then
        sed -i '' "s/VITE_AD_SLOT_LIBRARY=.*/VITE_AD_SLOT_LIBRARY=$AD_SLOT_LIBRARY/" .env.local
    else
        echo "VITE_AD_SLOT_LIBRARY=$AD_SLOT_LIBRARY" >> .env.local
    fi
    
    if grep -q "VITE_AD_SLOT_HOME" .env.local; then
        sed -i '' "s/VITE_AD_SLOT_HOME=.*/VITE_AD_SLOT_HOME=$AD_SLOT_HOME/" .env.local
    else
        echo "VITE_AD_SLOT_HOME=$AD_SLOT_HOME" >> .env.local
    fi
    
    echo "✅ Updated .env.local"
fi

# Update hardcoded placeholders in the code
echo "🔄 Updating hardcoded placeholders..."

# Update Analytics Service
sed -i '' "s/G-XXXXXXXXXX/$GA_ID/g" js/analytics-service.js
echo "✅ Updated js/analytics-service.js"

# Update Ad Service
sed -i '' "s/ca-pub-XXXXXXXXXXXXXXXX/$ADSENSE_ID/g" js/ad-service.js
echo "✅ Updated js/ad-service.js"

# Update index.html
sed -i '' "s/ca-pub-XXXXXXXXXXXXXXXX/$ADSENSE_ID/g" index.html
echo "✅ Updated index.html"

# Update React components
sed -i '' "s/ca-pub-XXXXXXXXXXXXXXXX/$ADSENSE_ID/g" src/components/StoryDisplay.jsx
sed -i '' "s/XXXXXXXXXX/$AD_SLOT_STORY/g" src/components/StoryDisplay.jsx
echo "✅ Updated src/components/StoryDisplay.jsx"

echo ""
echo "✅ Configuration Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart the dev server: npm run dev"
echo "2. Test analytics tracking in GA4 Real-time view"
echo "3. Verify ads are showing (may take time for approval)"
echo "4. Add these to Netlify environment variables"
echo ""
echo "⚠️  Important Reminders:"
echo "- Enable child-directed treatment in AdSense"
echo "- Configure COPPA compliance in Analytics"
echo "- Update privacy policy with these services"
echo "- Test with ad blockers to ensure site still works"