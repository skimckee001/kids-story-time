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
  'reader-free': {
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
  'story-pro': {
    name: 'Story Pro',
    price: { monthly: 4.99, yearly: 39 },
    dailyStories: 10,
    monthlyStories: 50,
    aiIllustrations: 30, // per month
    narrations: 3, // per month
    childProfiles: 2,
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false
  },
  'read-to-me-promax': {
    name: 'Read to Me ProMax',
    price: { monthly: 6.99, yearly: 55 },
    dailyStories: 20,
    monthlyStories: 100,
    aiIllustrations: 150, // per month
    narrations: 30, // per month
    childProfiles: 2,
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false,
    extraFeatures: ['bedtime-reminders', 'streaks', 'audio-downloads']
  },
  'family-plus': {
    name: 'Family Plus',
    price: { monthly: 7.99, yearly: 59 },
    dailyStories: 'unlimited',
    monthlyStories: 'unlimited',
    aiIllustrations: 250, // per month
    narrations: 50, // per month
    childProfiles: 4,
    libraryAccess: 'full',
    saveStories: true,
    pdfExport: true,
    watermarkedPdf: false,
    hasAds: false,
    extraFeatures: ['priority-support', 'beta-features']
  }
};

// Helper function to get tier limits
export function getTierLimits(tier, user = null) {
  // Non-logged-in users get try-now tier
  if (!user) {
    return SUBSCRIPTION_TIERS['try-now'];
  }
  
  // Map old tier names to new ones for backward compatibility
  const tierMigration = {
    'free': 'reader-free',
    'reader': 'reader-free',
    'basic': 'story-pro',
    'story-maker-basic': 'story-pro',
    'plus': 'read-to-me-promax',
    'premium': 'read-to-me-promax',
    'family': 'family-plus',
    'pro': 'family-plus',
    'movie-director-premium': 'family-plus'
  };
  
  // Apply migration if needed
  let userTier = tier || 'reader-free';
  if (tierMigration[userTier]) {
    userTier = tierMigration[userTier];
  }
  
  return SUBSCRIPTION_TIERS[userTier] || SUBSCRIPTION_TIERS['reader-free'];
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
    'reader-free': {
      stories: 'Upgrade to Story Pro for 10 stories per day!',
      ai: 'Upgrade to Story Pro for 30 AI illustrations per month!',
      library: 'Upgrade to Story Pro for full library access!'
    },
    'story-pro': {
      stories: 'Upgrade to Read to Me ProMax for 20 stories per day!',
      ai: 'Upgrade to Read to Me ProMax for 150 AI illustrations!',
      library: 'You already have full library access!'
    },
    'read-to-me-promax': {
      stories: 'Upgrade to Family Plus for unlimited stories!',
      ai: 'Upgrade to Family Plus for 250 AI illustrations!',
      library: 'You already have full library access!'
    },
    'family-plus': {
      stories: 'You have unlimited stories!',
      ai: 'You have the maximum AI illustrations!',
      library: 'You have full library access!'
    }
  };
  
  return messages[tier]?.[limitType] || 'Upgrade your plan for more features!';
}