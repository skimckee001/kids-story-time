// Subscription Tier Definitions and Limits
export const SUBSCRIPTION_TIERS = {
  'try-now': {
    name: 'Try Now',
    dailyStories: 1,
    monthlyStories: null, // No monthly limit for try-now
    aiIllustrations: 0,
    narrations: 0,
    childProfiles: 0,
    libraryAccess: false,
    saveStories: false,
    pdfExport: false,
    watermarkedPdf: false,
    hasAds: true
  },
  'reader': {
    name: 'Reader (Free)',
    dailyStories: 3,
    monthlyStories: 10,
    aiIllustrations: 1, // per month
    narrations: 1, // per month
    childProfiles: 1,
    libraryAccess: 2, // Last 2 stories
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: true,
    hasAds: true
  },
  'basic': {
    name: 'Story Maker',
    price: { monthly: 4.99, yearly: 39 },
    dailyStories: 10,
    monthlyStories: 50,
    aiIllustrations: 30, // per month
    narrations: 30, // per month
    childProfiles: 2,
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false
  },
  'plus': {
    name: 'Family',
    price: { monthly: 7.99, yearly: 59 },
    dailyStories: 20,
    monthlyStories: 120,
    aiIllustrations: 'unlimited', // Fair use: up to 5 per story
    narrations: 'unlimited', // Fair use: up to 5 per day
    childProfiles: 5,
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false,
    extraFeatures: ['bedtime-reminders', 'streaks', 'audio-downloads', 'multi-language']
  },
  'premium': {
    name: 'Movie Director',
    price: { monthly: 14.99, yearly: 99 },
    comingSoon: true,
    dailyStories: 'unlimited',
    monthlyStories: 'unlimited',
    aiIllustrations: 'unlimited',
    narrations: 'unlimited',
    childProfiles: 'unlimited',
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false,
    extraFeatures: ['video-stories', 'custom-characters', 'multiple-art-styles', 'voice-cloning']
  }
};

// Helper function to get tier limits
export function getTierLimits(tier, user = null) {
  // Non-logged-in users get try-now tier
  if (!user) {
    return SUBSCRIPTION_TIERS['try-now'];
  }
  
  // Default to reader tier for logged-in users without subscription
  const userTier = tier || 'reader';
  return SUBSCRIPTION_TIERS[userTier] || SUBSCRIPTION_TIERS['reader'];
}

// Check if user can generate a story
export function canGenerateStory(tier, dailyUsed, monthlyUsed, user) {
  const limits = getTierLimits(tier, user);
  
  if (limits.dailyStories === 'unlimited') return true;
  if (dailyUsed >= limits.dailyStories) return false;
  
  if (limits.monthlyStories === 'unlimited' || limits.monthlyStories === null) return true;
  if (monthlyUsed >= limits.monthlyStories) return false;
  
  return true;
}

// Check if user can use AI illustrations
export function canUseAIIllustration(tier, monthlyUsed, user) {
  const limits = getTierLimits(tier, user);
  
  if (limits.aiIllustrations === 'unlimited') return true;
  if (limits.aiIllustrations === 0) return false;
  if (monthlyUsed >= limits.aiIllustrations) return false;
  
  return true;
}

// Check if user can use narration
export function canUseNarration(tier, monthlyUsed, user) {
  const limits = getTierLimits(tier, user);
  
  if (limits.narrations === 'unlimited') return true;
  if (limits.narrations === 0) return false;
  if (monthlyUsed >= limits.narrations) return false;
  
  return true;
}

// Get upgrade message based on current tier
export function getUpgradeMessage(tier, limitType = 'stories') {
  const messages = {
    'try-now': {
      stories: 'Create a free account to get 3 stories per day!',
      ai: 'Create a free account to unlock AI illustrations!',
      library: 'Create a free account to save your stories!'
    },
    'reader': {
      stories: 'Upgrade to Story Maker for 10 stories per day!',
      ai: 'Upgrade to Story Maker for 30 AI illustrations per month!',
      library: 'Upgrade to Story Maker for full library access!'
    },
    'basic': {
      stories: 'Upgrade to Family for 20 stories per day!',
      ai: 'Upgrade to Family for unlimited AI illustrations!',
      library: 'You already have full library access!'
    },
    'plus': {
      stories: 'You have the maximum story limit!',
      ai: 'You have unlimited AI illustrations!',
      library: 'You have full library access!'
    }
  };
  
  return messages[tier]?.[limitType] || 'Upgrade your plan for more features!';
}