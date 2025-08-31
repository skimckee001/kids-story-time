// Analytics and Ads Configuration
// This file centralizes all tracking and monetization IDs

const config = {
  // Google Analytics 4
  analytics: {
    measurementId: process.env.VITE_GA_MEASUREMENT_ID || 'G-NRQH8X9NXP',
    // Child-safety settings for COPPA compliance
    settings: {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      restricted_data_processing: true,
      // Custom settings for kids site
      child_directed: true,
      non_personalized_ads: true
    }
  },

  // Google AdSense
  adsense: {
    publisherId: process.env.VITE_ADSENSE_PUBLISHER_ID || 'ca-pub-1413183979906947',
    // Ad slots for different pages
    slots: {
      storyPage: process.env.VITE_AD_SLOT_STORY || 'XXXXXXXXXX',
      libraryPage: process.env.VITE_AD_SLOT_LIBRARY || 'XXXXXXXXXX',
      homePage: process.env.VITE_AD_SLOT_HOME || 'XXXXXXXXXX',
      rewardPage: process.env.VITE_AD_SLOT_REWARD || 'XXXXXXXXXX'
    },
    // Child-directed settings
    childDirected: true,
    testMode: process.env.NODE_ENV === 'development'
  },

  // Feature flags
  features: {
    enableAnalytics: process.env.VITE_ENABLE_ANALYTICS !== 'false',
    enableAds: process.env.VITE_ENABLE_ADS !== 'false',
    debugMode: process.env.NODE_ENV === 'development'
  }
};

// Validation function to ensure IDs are configured
export function validateConfig() {
  const errors = [];
  
  if (config.analytics.measurementId.includes('XXXX')) {
    errors.push('Google Analytics Measurement ID not configured');
  }
  
  if (config.adsense.publisherId.includes('XXXX')) {
    errors.push('AdSense Publisher ID not configured');
  }
  
  Object.entries(config.adsense.slots).forEach(([key, value]) => {
    if (value.includes('XXXX')) {
      errors.push(`AdSense ${key} slot ID not configured`);
    }
  });
  
  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Analytics/Ads Configuration Issues:', errors);
  }
  
  return errors.length === 0;
}

// Helper to get safe analytics config for kids
export function getSafeAnalyticsConfig() {
  return {
    ...config.analytics.settings,
    measurement_id: config.analytics.measurementId
  };
}

// Helper to check if ads should be shown
export function shouldShowAds(userTier) {
  // Don't show ads for paid tiers
  const paidTiers = ['story-maker-basic', 'family-plus', 'movie-director-premium', 'basic', 'plus', 'premium', 'family'];
  
  if (paidTiers.includes(userTier)) {
    return false;
  }
  
  // Only show if ads are enabled and configured
  return config.features.enableAds && !config.adsense.publisherId.includes('XXXX');
}

export default config;