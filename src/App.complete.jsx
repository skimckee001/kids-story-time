import { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import StoryDisplay from './components/StoryDisplay';
import StoryLibrary from './components/StoryLibrary';
import ProfileManager from './components/ProfileManager';
import AchievementSystem from './components/AchievementSystem';
import ReadingStreak from './components/ReadingStreak';
import StarRewardsSystem, { addStarsToChild } from './components/StarRewardsSystem';
import ParentDashboard from './components/ParentDashboard';
import BedtimeMode from './components/BedtimeMode';
import ReadingGoals from './components/ReadingGoals';
import CelebrationAnimation, { useCelebration } from './components/CelebrationAnimation';
import OnboardingTooltips from './components/OnboardingTooltips';
import StripeTestComponent from './components/StripeTestComponent';
import CommunityAchievements from './components/CommunityAchievements';
import ReferralProgram from './components/ReferralProgram';
import UserGeneratedContent from './components/UserGeneratedContent';
import DevTestPanel from './components/DevTestPanel';
import { getTierLimits, canGenerateStory, canUseAIIllustration, getUpgradeMessage } from './utils/subscriptionTiers';
import AuthenticationManager from './components/AuthenticationManager';
import { useEnhancedAuth } from './hooks/useEnhancedAuth.jsx';
import { getOptimalImageStyle, getAvailableStylesForAge } from './utils/enhancedImageStyles';
import { initAllEnhancements } from './utils/stepperEnhancements';
import { usageTracker } from './utils/usageTracker';
import logger from './utils/logger';
import { generateMockStoryWithDelay, shouldUseMockGenerator } from './utils/mockStoryGenerator';
import { 
  generateEnhancedPrompt, 
  validateStoryOutput, 
  getEnhancedImageStyle,
  calculateReadingTime,
  scoreStoryQuality,
  WORD_COUNT_TARGETS,
  CONTENT_GUIDELINES 
} from './utils/storyEnhancements';
import './App.original.css';
import './styles/desktop-fixes.css';
import './styles/iphone-edge-to-edge.css'; // Edge-to-edge iPhone layout (remove to revert)

// Story length options matching the current HTML
const STORY_LENGTHS = [
  { id: 'short', label: 'Short (2-3 minutes)' },
  { id: 'medium', label: 'Medium (5-7 minutes)' },
  { id: 'long', label: 'Long (10-15 minutes)' },
  { id: 'extended', label: 'Extended (20-25 minutes)' },
  { id: 'long-extended', label: 'Very Long (25-30 minutes)' },
  { id: 'extra-long', label: 'Extra Long (35-40 minutes)' }
];

// Dynamic themes based on reading level - expanded with popular topics
const THEMES_BY_LEVEL = {
  'pre-reader': [
    { id: 'animals', label: 'Animals', emoji: '🐻' },
    { id: 'bedtime', label: 'Bedtime Stories', emoji: '🌙' },
    { id: 'colors', label: 'Colors & Shapes', emoji: '🌈' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { id: 'vehicles', label: 'Cars & Trucks', emoji: '🚗' },
    { id: 'farm', label: 'Farm Life', emoji: '🚜' },
    { id: 'feelings', label: 'Feelings', emoji: '😊' },
    { id: 'counting', label: 'Numbers', emoji: '🔢' },
    { id: 'playground', label: 'Playground Fun', emoji: '🎠' },
    { id: 'pets', label: 'Pets', emoji: '🐕' },
    { id: 'seasons', label: 'Seasons', emoji: '🍂' },
    { id: 'food', label: 'Yummy Food', emoji: '🍎' }
  ],
  'early-phonics': [
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
    { id: 'animals', label: 'Animal Friends', emoji: '🦁' },
    { id: 'friendship', label: 'Best Friends', emoji: '🤝' },
    { id: 'fairytale', label: 'Fairy Tales', emoji: '🏰' },
    { id: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
    { id: 'ocean', label: 'Under the Sea', emoji: '🌊' },
    { id: 'school', label: 'School Days', emoji: '🎒' },
    { id: 'superheroes', label: 'Superheroes', emoji: '🦸' },
    { id: 'princesses', label: 'Princesses', emoji: '👸' },
    { id: 'pirates', label: 'Pirates', emoji: '🏴‍☠️' },
    { id: 'bugs', label: 'Bugs & Insects', emoji: '🐛' },
    { id: 'birthday', label: 'Birthday Party', emoji: '🎂' }
  ],
  'beginning-reader': [
    { id: 'adventure', label: 'Adventure Quest', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery Solving', emoji: '🔍' },
    { id: 'space', label: 'Space Explorer', emoji: '🚀' },
    { id: 'superheroes', label: 'Superhero Team', emoji: '🦸' },
    { id: 'magic', label: 'Magic School', emoji: '✨' },
    { id: 'sports', label: 'Sports Champions', emoji: '⚽' },
    { id: 'dragons', label: 'Dragon Tales', emoji: '🐉' },
    { id: 'unicorns', label: 'Unicorn Magic', emoji: '🦄' },
    { id: 'robots', label: 'Robot Friends', emoji: '🤖' },
    { id: 'ninjas', label: 'Ninja Training', emoji: '🥷' },
    { id: 'detectives', label: 'Detective Club', emoji: '🕵️' },
    { id: 'camping', label: 'Camping Adventure', emoji: '🏕️' }
  ],
  'developing-reader': [
    { id: 'adventure', label: 'Epic Adventure', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery Detective', emoji: '🔍' },
    { id: 'fantasy', label: 'Fantasy Quest', emoji: '🧙‍♂️' },
    { id: 'scifi', label: 'Sci-Fi Future', emoji: '🚀' },
    { id: 'friendship', label: 'Friendship Challenge', emoji: '🤝' },
    { id: 'history', label: 'Time Travelers', emoji: '📜' },
    { id: 'survival', label: 'Survival Skills', emoji: '🏃' },
    { id: 'magic-school', label: 'Magic Academy', emoji: '🎓' },
    { id: 'spy', label: 'Secret Agent', emoji: '🕶️' },
    { id: 'mythology', label: 'Greek Myths', emoji: '⚡' },
    { id: 'haunted', label: 'Haunted House', emoji: '👻' },
    { id: 'treasure', label: 'Treasure Hunt', emoji: '💎' }
  ],
  'fluent-reader': [
    { id: 'adventure', label: 'World Adventure', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery Thriller', emoji: '🔍' },
    { id: 'fantasy', label: 'Epic Fantasy', emoji: '🧙‍♂️' },
    { id: 'scifi', label: 'Science Fiction', emoji: '🚀' },
    { id: 'mythology', label: 'Ancient Mythology', emoji: '⚡' },
    { id: 'time-travel', label: 'Time Travel', emoji: '⏰' },
    { id: 'dystopian', label: 'Future World', emoji: '🌆' },
    { id: 'parallel', label: 'Parallel Universe', emoji: '🌌' },
    { id: 'superpowers', label: 'Hidden Powers', emoji: '💫' },
    { id: 'quest', label: 'Hero\'s Journey', emoji: '🗡️' },
    { id: 'aliens', label: 'Alien Contact', emoji: '👽' },
    { id: 'virtual', label: 'Virtual Reality', emoji: '🎮' }
  ],
  'insightful-reader': [
    { id: 'dystopian', label: 'Dystopian Future', emoji: '🌆' },
    { id: 'philosophy', label: 'Deep Questions', emoji: '💭' },
    { id: 'mystery', label: 'Complex Mystery', emoji: '🔍' },
    { id: 'scifi', label: 'Hard Sci-Fi', emoji: '🚀' },
    { id: 'historical', label: 'Historical Fiction', emoji: '📜' },
    { id: 'psychological', label: 'Mind Games', emoji: '🧠' },
    { id: 'coming-of-age', label: 'Coming of Age', emoji: '🌱' },
    { id: 'social', label: 'Social Issues', emoji: '🌍' },
    { id: 'identity', label: 'Finding Identity', emoji: '🎭' },
    { id: 'rebellion', label: 'Teen Rebellion', emoji: '✊' },
    { id: 'apocalyptic', label: 'Post-Apocalyptic', emoji: '🌅' },
    { id: 'ai', label: 'AI Ethics', emoji: '🤖' }
  ]
};

function App() {
    // Form state
    const [childName, setChildName] = useState('');
    const [genderSelection, setGenderSelection] = useState({ boy: true, girl: true });
    const [includeNameInStory, setIncludeNameInStory] = useState(true);
    const [readingLevel, setReadingLevel] = useState('early-phonics');
    const [selectedThemes, setSelectedThemes] = useState([]);
    const [storyLength, setStoryLength] = useState('medium');
    const [customPrompt, setCustomPrompt] = useState('');
    const [storyContext, setStoryContext] = useState('');
    const [imageStyle, setImageStyle] = useState('age-appropriate');
    
    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    // Replace old auth state with new enhanced auth hook
    const { user, authModal, openAuthModal, closeAuthModal, handleAuthSuccess } = useEnhancedAuth();
  const [subscriptionTier, setSubscriptionTier] = useState('try-now'); // Updated tier system
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [profileManagerCreateMode, setProfileManagerCreateMode] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [storiesRemaining, setStoriesRemaining] = useState(1);
  const [monthlyStoriesUsed, setMonthlyStoriesUsed] = useState(0);
  const [aiIllustrationsUsed, setAiIllustrationsUsed] = useState(0);
  const [narrationsUsed, setNarrationsUsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [starPoints, setStarPoints] = useState(0);
  const [selectedChildProfile, setSelectedChildProfile] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [bedtimeModeActive, setBedtimeModeActive] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [achievementCount, setAchievementCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [showStripeTest, setShowStripeTest] = useState(false);
  const [showCommunityAchievements, setShowCommunityAchievements] = useState(false);
  const [showReferralProgram, setShowReferralProgram] = useState(false);
  const [showUserContent, setShowUserContent] = useState(false);
  const [showTierTester, setShowTierTester] = useState(false);
  const { triggerCelebration, CelebrationComponent } = useCelebration();

  // Check for dev mode
  useEffect(() => {
    const checkDevMode = () => {
      // Only use build-time flag for production safety
      const isDev = import.meta.env.DEV;
      logger.debug('Dev mode check:', {
        buildTimeFlag: import.meta.env.DEV,
        isDev
      });
      setIsDevMode(isDev);
    };
    
    checkDevMode();
    // Re-check on navigation
    window.addEventListener('popstate', checkDevMode);
    return () => window.removeEventListener('popstate', checkDevMode);
  }, []);

  // Load guest stars on mount if no user is logged in
  useEffect(() => {
    if (!user && !selectedChildProfile) {
      const guestStars = localStorage.getItem('stars_guest');
      if (guestStars) {
        setStarPoints(parseInt(guestStars) || 0);
      }
    }
  }, [user, selectedChildProfile]);

  // Load usage stats when user changes
  useEffect(() => {
    if (user) {
      loadUserUsageStats();
    }
  }, [user]);

  const loadUserUsageStats = async () => {
    if (!user) return;
    
    // For test users, don't overwrite local state from database
    const isTestUser = user?.id?.startsWith('test-') || 
                      !import.meta.env.VITE_SUPABASE_URL || 
                      import.meta.env.VITE_SUPABASE_URL.includes('dummy');
    
    if (isTestUser) {
      // Keep the current local state for test users
      return;
    }
    
    try {
      const usage = await usageTracker.loadUsageStats(user.id);
      if (usage) {
        // Only update if current values are 0 (initial load)
        // This prevents resetting after story generation
        if (monthlyStoriesUsed === 0) {
          setMonthlyStoriesUsed(usage.stories_used || 0);
        }
        if (aiIllustrationsUsed === 0) {
          setAiIllustrationsUsed(usage.ai_illustrations_used || 0);
        }
        if (narrationsUsed === 0) {
          setNarrationsUsed(usage.narrations_used || 0);
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  useEffect(() => {
    // Click outside handler for dropdown menus
    const handleClickOutside = (event) => {
      // Check if click is outside more menu
      if (showMoreMenu && !event.target.closest('.more-menu-container')) {
        setShowMoreMenu(false);
      }
      // Check if click is outside user menu
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    
    // Add listener when either menu is open
    if (showMoreMenu || showUserMenu) {
      // Use setTimeout to avoid immediate close on open
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreMenu, showUserMenu]);
  
  const handleStripeUpgrade = async (tier) => {
    // Price IDs for Stripe (these should be from your Stripe dashboard)
    const priceIds = {
      'story-pro': 'price_story_pro_monthly', // $4.99
      'read-to-me-promax': 'price_read_to_me_monthly', // $6.99
      'family-plus': 'price_family_plus_monthly' // $7.99
    };
    
    const tierMap = {
      'Story Pro': 'story-pro',
      'Read to Me Pro-Max': 'read-to-me-promax',
      'Family Plus': 'family-plus'
    };
    
    const targetTier = tierMap[tier] || 'story-pro';
    const priceId = priceIds[targetTier];
    
    if (!user) {
      // Need to sign up first
      openAuthModal();
      return;
    }
    
    try {
      // For localhost testing, just show an alert
      if (window.location.hostname === 'localhost') {
        alert(`Stripe checkout would open for ${tier} (${targetTier})\nPrice ID: ${priceId}\n\nNote: Stripe checkout requires Netlify functions to be running.`);
        return;
      }
      
      // Call the Stripe checkout function
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          tier: targetTier
        })
      });
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('Unable to open checkout. Please try again.');
    }
  };
  
  const getNextUpgradeTier = (currentTier) => {
    const tierProgression = {
      'try-now': { 
        name: 'Story Pro', price: '$4.99/month',
        features: ['✓ 10 stories per day', '✓ 30 AI images per month', '✓ 3 narrations per month',
                   '✓ 2 child profiles', '✓ Full library access', '✓ Non-watermarked PDFs'],
        highlight: ['✓ 30 AI images per month']
      },
      'reader-free': { 
        name: 'Story Pro', price: '$4.99/month',
        features: ['✓ 10 stories per day', '✓ 30 AI images per month', '✓ 3 narrations per month',
                   '✓ 2 child profiles', '✓ Full library access', '✓ Non-watermarked PDFs'],
        highlight: ['✓ 30 AI images per month']
      },
      'story-pro': { 
        name: 'Read to Me Pro-Max', price: '$6.99/month',
        features: ['✓ 20 stories per day', '✓ 150 AI images per month', '✓ 30 narrations per month',
                   '✓ 2 child profiles', '✓ Audio downloads', '✓ Bedtime reminders & streaks', '✓ Non-watermarked PDFs'],
        highlight: ['✓ 150 AI images per month', '✓ 30 narrations per month']
      },
      'read-to-me-promax': { 
        name: 'Family Plus', price: '$7.99/month',
        features: ['✓ Unlimited stories', '✓ 250 AI images per month', '✓ 50 narrations per month',
                   '✓ 4 child profiles', '✓ Priority support', '✓ Beta features access', '✓ Non-watermarked PDFs'],
        highlight: ['✓ 4 child profiles', '✓ Unlimited stories', '✓ 50 narrations per month']
      },
      'family-plus': null,
      'family': null,
      'story-maker-basic': { 
        name: 'Read to Me Pro-Max', price: '$6.99/month',
        features: ['✓ 20 stories per day', '✓ 150 AI images per month', '✓ 30 narrations per month',
                   '✓ 2 child profiles', '✓ Audio downloads', '✓ Bedtime reminders & streaks', '✓ Non-watermarked PDFs'],
        highlight: ['✓ 150 AI images per month', '✓ 30 narrations per month']
      },
      'movie-director-premium': null
    };
    return tierProgression[currentTier] || tierProgression['reader-free'];
  };
  
  // Theme colors are now consistent - reading level only affects content
  // The reading level dropdown still controls which themes are available
  // but doesn't change the app's color scheme
  
  useEffect(() => {
    checkUser();
    
    // Check if coming from pricing page with a plan parameter
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan && !user) {
      // Show auth modal if user selected a plan from pricing page
      setShowAuth(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Load saved profile if exists
    const savedProfile = localStorage.getItem('selectedChildProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setSelectedChildProfile(profile);
      // Auto-populate form with profile data
      setChildName(profile.name || '');
      setGenderSelection({
        boy: profile.gender === 'male',
        girl: profile.gender === 'female'
      });
      setIncludeNameInStory(profile.include_name_in_stories !== false);
      setReadingLevel(profile.reading_level || 'developing-reader');
      setSelectedThemes(profile.favorite_themes || []);
      setImageStyle(profile.preferred_image_style || 'age-appropriate');
      
      // Add favorite items to the story prompt
      if (profile.favorite_items && profile.favorite_items.length > 0) {
        const favoriteItemsText = `Include these favorite things: ${profile.favorite_items.join(', ')}`;
        setCustomPrompt(favoriteItemsText);
      }
      
      // Load star points for this profile
      const savedStars = localStorage.getItem(`stars_${profile.id}`);
      if (savedStars) {
        setStarPoints(parseInt(savedStars) || 0);
      }
      
      // Load achievement count
      const savedAchievements = localStorage.getItem(`achievements_${profile.id}`);
      if (savedAchievements) {
        try {
          const achievementList = JSON.parse(savedAchievements);
          setAchievementCount(achievementList.length);
        } catch (e) {
          setAchievementCount(0);
        }
      }
    }
    
    // Initialize iOS/mobile enhancements after DOM is ready
    const timer = setTimeout(() => {
      try {
        const cleanup = initAllEnhancements();
        return cleanup;
      } catch (error) {
        logger.debug('Enhancement initialization skipped:', error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user]); // Add user as dependency so it updates when auth state changes

  const checkUser = async () => {
    try {
      // First check if we have a user from the auth hook
      if (user) {
        // User is already authenticated via useEnhancedAuth hook
        const tier = user.tier || 'reader-free';
        setSubscriptionTier(tier);
        const limits = getTierLimits(tier, user);
        setStoriesRemaining(limits.dailyStories);
        return;
      }
      
      // Check for mock user in localStorage (for testing only)
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        const userData = JSON.parse(mockUser);
        
        // Migrate old tier names to new ones
        const tierMigration = {
          'free': 'reader-free',
          'reader': 'reader-free',
          'basic': 'story-maker-basic',
          'plus': 'family-plus',
          'premium': 'story-maker-basic', // Map old premium to story-maker
          'family': 'family-plus',
          'pro': 'family-plus'
        };
        
        // Apply migration if needed
        if (userData.tier && tierMigration[userData.tier]) {
          userData.tier = tierMigration[userData.tier];
          // Update localStorage with migrated tier
          localStorage.setItem('mockUser', JSON.stringify(userData));
        }
        
        // For mock users, we'll manually update subscription tier
        // but not override the auth hook's user state
        const tier = userData.tier || 'reader-free';
        setSubscriptionTier(tier);
        const limits = getTierLimits(tier, userData);
        setStoriesRemaining(limits.dailyStories);
        return;
      }

      // User from auth hook will handle real authentication
      // Check subscription status if we have an authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Don't call setUser here - let the auth hook manage it
        // Just check subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, daily_stories_count')
          .eq('id', authUser.id)
          .single();
        
        if (profile) {
          // Migrate old tier names from database
          const tierMigration = {
            'free': 'reader-free',
            'reader': 'reader-free',
            'basic': 'story-maker-basic',
            'plus': 'family-plus',
            'premium': 'story-maker-basic',
            'family': 'family-plus',
            'pro': 'family-plus'
          };
          
          let tier = profile.subscription_tier || 'reader-free';
          // Apply migration if needed
          if (tierMigration[tier]) {
            tier = tierMigration[tier];
          }
          
          setSubscriptionTier(tier);
          const limits = getTierLimits(tier, user);
          setStoriesRemaining(limits.dailyStories - (profile.daily_stories_count || 0));
        } else {
          // Default to reader-free tier for logged-in users
          setSubscriptionTier('reader-free');
          const limits = getTierLimits('reader-free', user);
          setStoriesRemaining(limits.dailyStories);
        }
      } else {
        // Non-logged-in users get try-now tier
        setSubscriptionTier('try-now');
        setStoriesRemaining(1);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const getAvailableThemes = () => {
    return THEMES_BY_LEVEL[readingLevel] || THEMES_BY_LEVEL['developing-reader'];
  };

  const toggleTheme = (themeId) => {
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  };
  
  const getImageStyles = () => {
    // Free tier gets only cartoon style
    const isFreeTier = !user || subscriptionTier === 'try-now' || subscriptionTier === 'free' || subscriptionTier === 'reader-free';
    
    // Story Pro and above get all styles
    const isPaidTier = subscriptionTier === 'story-pro' || subscriptionTier === 'story-maker-basic' || 
                       subscriptionTier === 'read-to-me-promax' || subscriptionTier === 'family-plus' ||
                       subscriptionTier === 'movie-director-premium' || subscriptionTier === 'family';
    
    if (!isPaidTier) {
      return [
        {
          id: 'bright-cartoon',
          label: 'Cartoon Fun (Free)',
          icon: '🎨',
          description: 'Colorful & playful',
          prompt: 'bright cartoon style, child-friendly, vibrant colors',
          ageRange: [3, 16]
        }
      ];
    }
    
    // Paid tiers get styles based on reading level
    // Get available styles for the current age group
    const availableStyles = getAvailableStylesForAge(readingLevel) || [];
    const recommendedStyle = getOptimalImageStyle(readingLevel, selectedThemes);
    
    // Build the style options list
    const styleOptions = [];
    
    // Add smart choice if we have a recommendation
    if (recommendedStyle && recommendedStyle.style) {
      styleOptions.push({
        id: 'age-appropriate',
        label: `Smart Choice (${recommendedStyle.style.name})`,
        icon: '✨',
        description: recommendedStyle.explanation,
        prompt: recommendedStyle.style.prompt
      });
    } else {
      // Fallback if no recommendation available
      styleOptions.push({
        id: 'age-appropriate',
        label: 'Smart Choice',
        icon: '✨',
        description: 'Best for your age',
        prompt: ''
      });
    }
    
    // Add available enhanced styles for this age group
    availableStyles.forEach(style => {
      // Don't duplicate the recommended style if it exists
      if (!recommendedStyle || !recommendedStyle.style || style.id !== recommendedStyle.style.id) {
        styleOptions.push({
          id: style.id,
          label: style.name,
          icon: '🎨',
          description: style.description,
          prompt: style.prompt
        });
      }
    });
    
    return styleOptions;
  };

  const handleLogout = async () => {
    localStorage.removeItem('mockUser');
    await supabase.auth.signOut();
    // The useEnhancedAuth hook will handle user state update
    setSubscriptionTier('free');
    setStoriesRemaining(1);
    setSelectedChildProfile(null);
  };

  const handleGenerateStory = async (e) => {
    e.preventDefault();
    
    if (!readingLevel) {
      alert('Please select a reading level');
      return;
    }

    // Enhanced tier enforcement using usage tracker
    if (user) {
      const canGenerate = await usageTracker.canPerformAction(user.id, subscriptionTier, 'generate_story');
      if (!canGenerate) {
        const message = usageTracker.getUpgradeMessage(subscriptionTier, 'story', 'story generation');
        alert(message);
        return;
      }
    } else {
      // For anonymous users, use simple local storage check
      const tierLimits = getTierLimits(subscriptionTier, user);
      if (!canGenerateStory(subscriptionTier, tierLimits.dailyStories - storiesRemaining, monthlyStoriesUsed, user)) {
        alert(getUpgradeMessage(user ? subscriptionTier : 'try-now', 'stories'));
        return;
      }
    }

    setIsGenerating(true);

    try {
      // Check if we should use mock generator for local testing
      if (shouldUseMockGenerator()) {
        logger.info('Using mock story generator for local testing');
        const mockData = await generateMockStoryWithDelay({
          childName: childName || 'Child',
          themes: selectedThemes,
          gender: genderSelection.boy && genderSelection.girl ? 'both' : genderSelection.boy ? 'boy' : genderSelection.girl ? 'girl' : 'neutral',
          readingLevel,
          storyLength
        });
        
        // Format mock data to match expected structure
        const storyData = {
          id: crypto.randomUUID(),
          title: mockData.story.title,
          content: mockData.story.content,
          themes: selectedThemes,
          child_name: childName,
          childName: childName, // Add both formats
          reading_level: readingLevel,
          readingLevel: readingLevel, // Add both formats
          image_url: mockData.imageUrl,
          imageUrl: mockData.imageUrl, // Add both formats for compatibility
          images: mockData.images || [mockData.imageUrl], // Include multiple images
          image_prompt: mockData.imagePrompt,
          created_at: new Date().toISOString(),
          is_demo: true
        };
        
        setCurrentStory(storyData);
        setShowStory(true);
        
        // Save mock story to library
        saveStoryToLibrary(storyData);
        
        // Award stars for mock story
        const newStarPoints = starPoints + 1;
        setStarPoints(newStarPoints);
        if (selectedChildProfile) {
          localStorage.setItem(`stars_${selectedChildProfile.id}`, newStarPoints.toString());
        }
        
        // Update usage for mock
        setStoriesRemaining(prev => Math.max(0, prev - 1));
        setMonthlyStoriesUsed(prev => prev + 1);
        
        // Trigger celebrations
        setTimeout(() => triggerCelebration('story'), 500);
        setTimeout(() => triggerCelebration('stars', `+1 Star!`), 2000);
        
        logger.info('Mock story generated successfully');
        return;
      }
      
      // Check if V2 generation is enabled
      const useV2 = import.meta.env.VITE_STORYGEN_V2_ENABLED === 'true' || 
                    import.meta.env.VITE_STORYGEN_V2_ENABLED === 'TRUE';
      
      // Call the story generation API (v2 if enabled, v1 otherwise)
      const endpoint = useV2 ? 'generate-story-v2-fast' : 'generate-story';
      const apiUrl = window.location.hostname === 'localhost' 
        ? `http://localhost:8888/.netlify/functions/${endpoint}`
        : `/.netlify/functions/${endpoint}`;
      
      logger.info(`Using story generation ${useV2 ? 'V2' : 'V1'} at ${apiUrl}`);
      
      // Get the appropriate image style prompt using enhanced system
      const recommendedStyleConfig = getOptimalImageStyle(readingLevel, selectedThemes);
      const effectiveStyle = imageStyle === 'age-appropriate' && recommendedStyleConfig?.style 
        ? recommendedStyleConfig.style.id 
        : imageStyle;
      
      // Get the image prompt from the enhanced style or fallback to existing styles
      let imagePrompt = '';
      if (imageStyle === 'age-appropriate' && recommendedStyleConfig?.style) {
        imagePrompt = recommendedStyleConfig.style.prompt;
      } else {
        const selectedStyle = getImageStyles().find(s => s.id === effectiveStyle);
        imagePrompt = selectedStyle?.prompt || '';
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: childName || 'Child',
          childAge: readingLevel,
          storyLength: storyLength,
          theme: selectedThemes[0] || '',
          themes: selectedThemes,
          interests: selectedThemes.join(' and '), // V2 uses 'interests' field
          gender: genderSelection.boy && genderSelection.girl ? 'both' : genderSelection.boy ? 'boy' : genderSelection.girl ? 'girl' : '',
          customPrompt,
          storyContext,
          includeNameInStory,
          subscriptionTier,
          imageStyle: imageStyle,
          imagePrompt: imagePrompt,
          useV2: useV2, // Tell the backend which version we want
          // Enhanced parameters
          enhancedPrompt: generateEnhancedPrompt({
            childName,
            genderSelection,
            includeNameInStory,
            readingLevel,
            selectedThemes,
            storyLength,
            customPrompt
          }),
          wordTarget: WORD_COUNT_TARGETS[storyLength],
          contentGuidelines: CONTENT_GUIDELINES[readingLevel]
        })
      });

      const data = await response.json();
      
      // Handle both v1 and v2 response formats
      const storyContent = data.story?.content || data.story || '';
      const storyTitle = data.story?.title || data.title || `${childName}'s Story`;
      
      logger.debug('Story generation response:', {
        hasTitle: !!storyTitle,
        title: storyTitle,
        hasContent: !!storyContent,
        responseStructure: {
          hasStoryObject: !!data.story,
          hasStoryTitle: !!data.story?.title,
          hasDataTitle: !!data.title
        }
      });
      
      if (storyContent) {
        // Check if we have v2 metadata (includes v2, v2-fast, v2-simple, etc)
        if (data.metadata?.version && data.metadata.version.startsWith('v2')) {
          logger.info('V2 Story Generated:', {
            version: data.metadata.version,
            quality: data.metadata.qualityScore || data.metadata.qualityGrade,
            accuracy: data.metadata.accuracy,
            words: data.metadata.actualWords,
            target: data.metadata.targetWords,
            ageBand: data.metadata.ageBand,
            model: data.metadata.model
          });
        }
        
        // Validate story quality (for v1 or additional v2 validation)
        const validation = validateStoryOutput(storyContent, storyLength, readingLevel);
        const qualityScore = data.metadata?.qualityScore ? 
          { 
            score: data.metadata.qualityScore, 
            grade: data.metadata.qualityScore >= 95 ? 'A+' : 
                   data.metadata.qualityScore >= 90 ? 'A' :
                   data.metadata.qualityScore >= 80 ? 'B' :
                   data.metadata.qualityScore >= 70 ? 'C' : 'D',
            issues: []
          } :
          scoreStoryQuality(storyContent, {
            childName,
            includeNameInStory,
            readingLevel,
            selectedThemes,
            storyLength
          });
        
        // Log quality metrics
        logger.debug('Story Quality Metrics:', {
          wordCount: data.metadata?.actualWords || validation.wordCount,
          targetWords: data.metadata?.targetWords || WORD_COUNT_TARGETS[storyLength].target,
          qualityGrade: qualityScore.grade,
          version: data.metadata?.version || 'v1',
          issues: [...validation.issues, ...qualityScore.issues]
        });
        
        // Calculate accurate reading time
        const readingTime = calculateReadingTime(
          data.metadata?.actualWords || validation.wordCount, 
          readingLevel
        );
        
        // Set the current story and show the story display immediately
        const storyId = crypto.randomUUID();
        const storyData = {
          id: storyId,
          title: storyTitle,
          content: storyContent,
          imageUrl: null,
          image_url: null, // Include both formats
          childName: childName,
          child_name: childName, // Include both formats
          themes: selectedThemes,
          readingLevel: readingLevel,
          reading_level: readingLevel, // Include both formats
          metadata: {
            ...data.story.metadata,
            wordCount: validation.wordCount,
            readingTime: readingTime.displayText,
            qualityScore: qualityScore.score,
            qualityGrade: qualityScore.grade
          }
        };
        
        setCurrentStory({ ...storyData, savedId: storyId });
        setShowStory(true);
        
        // Award stars for completing a story
        if (selectedChildProfile?.id) {
          const newTotal = addStarsToChild(selectedChildProfile.id, 10, 'Completed a story');
          logger.info(`Awarded 10 stars! New total: ${newTotal}`);
          
          // Trigger celebration animation
          triggerCelebration('stars', 'You earned 10 stars!');
          
          // Check for milestones
          if (newTotal >= 100 && newTotal < 110) {
            setTimeout(() => triggerCelebration('achievement', '100 Stars Milestone!'), 3500);
          }
        }
        
        // Auto-save story to library (for both logged in and test users)
        saveStoryToLibrary(storyData);
        
        // Save to localStorage for achievement tracking
        const existingStories = JSON.parse(localStorage.getItem('stories') || '[]');
        const newStoryEntry = {
          id: crypto.randomUUID(),
          title: data.story.title,
          content: data.story.content,
          child_name: childName,
          theme: selectedThemes[0] || '',
          themes: selectedThemes,
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          reading_level: readingLevel,
          readingLevel: readingLevel
        };
        existingStories.push(newStoryEntry);
        localStorage.setItem('stories', JSON.stringify(existingStories));
        
        // Also save per child for dashboard tracking
        if (selectedChildProfile?.id) {
          const childStories = JSON.parse(localStorage.getItem(`stories_${selectedChildProfile.id}`) || '[]');
          childStories.push(newStoryEntry);
          localStorage.setItem(`stories_${selectedChildProfile.id}`, JSON.stringify(childStories));
        }
        
        // Update star points and save to profile
        const newStarPoints = starPoints + 1;
        setStarPoints(newStarPoints);
        if (selectedChildProfile) {
          localStorage.setItem(`stars_${selectedChildProfile.id}`, newStarPoints.toString());
          
          // Update reading streak
          if (window.updateReadingStreak) {
            window.updateReadingStreak();
          }
        }
        
        // Generate image based on tier limits
        // ALWAYS generate AI images for all tiers - just use different models
        // Free tier gets dall-e-2 (256x256), paid tiers get dall-e-3 (1024x1024)
        const alwaysGenerateAI = true; // Force AI generation for ALL tiers
        
        logger.debug('AI Image Generation:', {
          subscriptionTier,
          aiIllustrationsUsed,
          hasUser: !!user,
          willGenerate: alwaysGenerateAI
        });
        
        if (alwaysGenerateAI) {
          logger.debug('Generating AI illustration for tier:', subscriptionTier);
          // Only count against limit for non-free tiers
          if (subscriptionTier !== 'reader-free' && subscriptionTier !== 'free' && subscriptionTier !== 'try-now') {
            setAiIllustrationsUsed(prev => prev + 1);
          }
          
          const imageApiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8888/.netlify/functions/generate-image'
            : '/.netlify/functions/generate-image';
          
          const selectedThemeLabels = selectedThemes
            .map(id => getAvailableThemes().find(t => t.id === id)?.label)
            .filter(Boolean)
            .join(', ');
          
          // Use the image prompt that was already determined based on the selected style
          const storyImagePrompt = imagePrompt ? 
            `${data.story.title}. ${imagePrompt}. ${selectedThemeLabels} theme` :
            `${data.story.title}. Child-friendly, colorful illustration. ${selectedThemeLabels} theme`;
          
          // Pass actual subscription tier to API for proper tier-based generation
          const apiTier = subscriptionTier || 'free';
          
          logger.debug('Sending to API with tier:', apiTier, 'from subscription tier:', subscriptionTier);
          
          // Fire off image generation without awaiting
          fetch(imageApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: storyImagePrompt,
              style: effectiveStyle || imageStyle || 'cartoon',  // Use the computed effective style
              mood: 'cheerful',
              tier: apiTier
            })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            console.error('Image generation failed with status:', response.status);
            return response.text().then(text => {
              console.error('Error response:', text);
              throw new Error(`Image generation failed: ${response.status}`);
            });
          })
          .then(imageData => {
            logger.debug('Image generation response:', imageData);
            // Check for URL in response (handle both direct URL and success object)
            const imageUrl = imageData.url || (imageData.success && imageData.url);
            
            if (imageUrl) {
              console.log('Setting image URL:', imageUrl);
              // Update the story with the image URL
              setCurrentStory(prev => {
                if (!prev) {
                  console.error('No previous story state!');
                  return prev;
                }
                const updatedStory = {
                  ...prev,
                  imageUrl: imageUrl,
                  image_url: imageUrl // Update both formats
                };
                console.log('Updated story with image:', updatedStory);
                // Update saved story with image URL (for both real and test users)
                if (prev.savedId || prev.id) {
                  updateSavedStoryImage(prev.savedId || prev.id, imageUrl);
                }
                return updatedStory;
              });
              
              // Also try a direct update as a backup
              setTimeout(() => {
                setCurrentStory(prev => ({
                  ...prev,
                  imageUrl: imageUrl,
                  image_url: imageUrl // Update both formats
                }));
                console.log('Backup image URL set');
              }, 100);
            } else {
              console.warn('No URL in image response:', imageData);
            }
          })
          .catch(error => {
            console.error('Image generation failed:', error);
            // Fallback to a stock image on error
            const fallbackSeed = Math.floor(Math.random() * 1000);
            const fallbackImageUrl = `https://picsum.photos/seed/${fallbackSeed}/1024/1024`;
            console.log('Using fallback image:', fallbackImageUrl);
            setCurrentStory(prev => {
              const updated = {
                ...prev,
                imageUrl: fallbackImageUrl,
                image_url: fallbackImageUrl // Update both formats
              };
              // Update saved story with fallback image
              if (prev?.savedId || prev?.id) {
                updateSavedStoryImage(prev.savedId || prev.id, fallbackImageUrl);
              }
              return updated;
            });
          });
        } else {
          // For free tier users, add a stock image
          console.log('Free tier user, adding stock image');
          const stockSeed = storyTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const stockImageUrl = `https://picsum.photos/seed/${stockSeed}/1024/1024`;
          setCurrentStory(prev => {
            const updated = {
              ...prev,
              imageUrl: stockImageUrl,
              image_url: stockImageUrl // Update both formats
            };
            // Update saved story with stock image
            if (prev?.savedId || prev?.id) {
              updateSavedStoryImage(prev.savedId || prev.id, stockImageUrl);
            }
            return updated;
          });
        }
        
        // Update usage counters and track in database
        setStoriesRemaining(prev => Math.max(0, prev - 1));
        const newMonthlyUsed = monthlyStoriesUsed + 1;
        setMonthlyStoriesUsed(newMonthlyUsed);
        
        // Track usage in database for logged-in users
        if (user) {
          await usageTracker.incrementUsage(user.id, 'story', 1);
          
          // Also track AI illustration usage if generated
          if (alwaysGenerateAI && (subscriptionTier !== 'reader-free' && subscriptionTier !== 'free' && subscriptionTier !== 'try-now')) {
            await usageTracker.incrementUsage(user.id, 'ai_illustration', 1);
          }
        }
        
        // Award star points
        setStarPoints(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      if (error.message?.includes('VITE_OPENAI_API_KEY')) {
        alert('Story generation requires API configuration. Using mock generator for testing.');
        // Fallback to mock generator
        try {
          const mockData = await generateMockStoryWithDelay({
            childName: childName || 'Child',
            themes: selectedThemes,
            gender: genderSelection.boy && genderSelection.girl ? 'both' : genderSelection.boy ? 'boy' : genderSelection.girl ? 'girl' : 'neutral',
            readingLevel,
            storyLength
          });
          
          const storyData = {
            id: crypto.randomUUID(),
            title: mockData.story.title,
            content: mockData.story.content,
            themes: selectedThemes,
            child_name: childName,
            childName: childName, // Add both formats
            reading_level: readingLevel,
            readingLevel: readingLevel, // Add both formats
            image_url: mockData.imageUrl,
            imageUrl: mockData.imageUrl, // Add both formats for compatibility
            images: mockData.images || [mockData.imageUrl], // Include multiple images
            created_at: new Date().toISOString(),
            is_demo: true
          };
          
          setCurrentStory(storyData);
          setShowStory(true);
          
          // Save fallback mock story to library
          saveStoryToLibrary(storyData);
          
          setStarPoints(prev => prev + 1);
        } catch (mockError) {
          alert('Failed to generate story. Please try again.');
        }
      } else {
        alert('Failed to generate story. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Create audio blob
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          
          // Convert to text (you would normally send this to a speech-to-text API)
          // For now, just alert the user
          console.log('Recording complete', audioBlob);
          alert('Voice recording complete. Speech-to-text integration coming soon!');
        };
        
        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        
        // Store recorder reference
        window.currentRecorder = mediaRecorder;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Please allow microphone access to use voice recording');
      }
    } else {
      // Stop recording
      if (window.currentRecorder && window.currentRecorder.state === 'recording') {
        window.currentRecorder.stop();
        setIsRecording(false);
      }
    }
  };

  const saveStoryToLibrary = async (storyData) => {
    try {
      // For test users or local dev, save to localStorage
      const isTestUser = user?.id?.startsWith('test-') || 
                        !import.meta.env.VITE_SUPABASE_URL || 
                        import.meta.env.VITE_SUPABASE_URL.includes('dummy');
      
      const imageUrl = storyData.imageUrl || storyData.image_url;
      const saveData = {
        id: storyData.id || crypto.randomUUID(),
        title: storyData.title,
        content: storyData.content,
        child_name: storyData.childName || storyData.child_name,
        theme: Array.isArray(storyData.themes) ? storyData.themes.join(', ') : (storyData.theme || ''),
        themes: storyData.themes || [],
        image_url: imageUrl,  // Save as snake_case
        imageUrl: imageUrl,   // Also save as camelCase for compatibility
        images: storyData.images || [],
        user_id: user?.id || 'guest',
        reading_level: storyData.readingLevel || storyData.reading_level,
        metadata: storyData.metadata || {},
        created_at: storyData.created_at || new Date().toISOString(),
        is_demo: storyData.is_demo || false
      };
      
      console.log('Saving story to library with data:', {
        id: saveData.id,
        title: saveData.title,
        hasContent: !!saveData.content,
        hasImageUrl: !!saveData.image_url,
        imageUrl: saveData.image_url,
        allImages: saveData.images,
        isTestUser
      });

      if (isTestUser) {
        // Save to localStorage for test users
        const libraryStories = JSON.parse(localStorage.getItem('libraryStories') || '[]');
        libraryStories.unshift(saveData); // Add to beginning
        localStorage.setItem('libraryStories', JSON.stringify(libraryStories));
        console.log('Story saved to localStorage library');
        
        // Store the saved story ID for later image update
        setCurrentStory(prev => ({
          ...prev,
          savedId: saveData.id
        }));
        return;
      }

      // For real users, save to Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) return;

      const { data, error } = await supabase
        .from('stories')
        .insert({ ...saveData, user_id: supabaseUser.id })
        .select()
        .single();

      if (error) {
        console.error('Error auto-saving story:', error);
      } else {
        console.log('Story auto-saved to library');
        // Store the saved story ID for later image update
        setCurrentStory(prev => ({
          ...prev,
          savedId: data.id
        }));
      }
    } catch (error) {
      console.error('Error in auto-save:', error);
    }
  };

  const updateSavedStoryImage = async (storyId, imageUrl) => {
    console.log('updateSavedStoryImage called:', { storyId, imageUrl });
    try {
      // Check if this is a test user or local dev
      const isTestUser = user?.id?.startsWith('test-') || 
                        !import.meta.env.VITE_SUPABASE_URL || 
                        import.meta.env.VITE_SUPABASE_URL.includes('dummy');
      
      if (isTestUser || !user) {
        // Update localStorage story
        const libraryStories = JSON.parse(localStorage.getItem('libraryStories') || '[]');
        console.log('Current library stories:', libraryStories.length);
        const storyIndex = libraryStories.findIndex(s => s.id === storyId);
        console.log('Found story at index:', storyIndex);
        
        if (storyIndex !== -1) {
          libraryStories[storyIndex].image_url = imageUrl;
          libraryStories[storyIndex].imageUrl = imageUrl; // Store both formats
          localStorage.setItem('libraryStories', JSON.stringify(libraryStories));
          console.log('Story image updated in localStorage library:', {
            storyId,
            imageUrl,
            updatedStory: libraryStories[storyIndex]
          });
        } else {
          console.warn('Story not found in library for image update:', storyId);
        }
        return;
      }
      
      // For real users, update in Supabase
      const { error } = await supabase
        .from('stories')
        .update({ image_url: imageUrl })
        .eq('id', storyId);

      if (error) {
        console.error('Error updating story image:', error);
      } else {
        console.log('Story image updated in library');
      }
    } catch (error) {
      console.error('Error updating image:', error);
    }
  };

  // Show story library if requested
  if (showLibrary) {
    return (
      <StoryLibrary
        user={user}
        subscriptionTier={subscriptionTier}
        onBack={() => setShowLibrary(false)}
      />
    );
  }

  // If showing story, display the story component
  if (showStory && currentStory) {
    return (
      <StoryDisplay 
        story={currentStory}
        user={user}
        subscriptionTier={subscriptionTier}
        starPoints={starPoints}
        childProfile={selectedChildProfile}
        onShowAchievements={() => setShowAchievements(true)}
        onShowRewards={() => setShowRewards(true)}
        onShowDashboard={() => setShowDashboard(true)}
        onShowProfileManager={() => setShowProfileManager(true)}
        bedtimeModeActive={bedtimeModeActive}
        onToggleBedtime={setBedtimeModeActive}
        onStarsUpdate={(newTotal) => {
          logger.debug('App.complete - onStarsUpdate called with:', newTotal);
          setStarPoints(newTotal);
          // Also update localStorage for the current profile
          const profileId = selectedChildProfile?.id || 'guest';
          localStorage.setItem(`stars_${profileId}`, newTotal.toString());
          logger.debug('Updated stars for profile:', profileId, 'to:', newTotal);
        }}
        onBack={() => {
          setShowStory(false);
          setCurrentStory(null);
          // Reset form
          setChildName('');
          setGenderSelection({ boy: false, girl: false });
          setSelectedThemes([]);
          setCustomPrompt('');
          setStoryContext('');
        }}
        onShowLibrary={() => {
          logger.debug('Library button clicked - navigating to library');
          setShowStory(false);
          setShowLibrary(true);
        }}
        onShowAuth={() => {
          openAuthModal();
        }}
        onSave={() => {
          logger.debug('Story saved');
          // No extra stars for saving - stars are only awarded when generating stories
        }}
      />
    );
  }

  return (
    <div className="app app-container">
      {/* Mock Mode Indicator for Local Development */}
      {shouldUseMockGenerator() && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          🧪 Mock Mode - Stories generated locally for testing
        </div>
      )}
      
      {/* Onboarding Tooltips for First-Time Users */}
      {!user && <OnboardingTooltips onComplete={() => logger.info('Onboarding completed')} />}
      
      <div className="container">
        {/* Header */}
        <header className="header-container">
          <div className="header-content">
            <div className="header-left" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
              <div className="logo-icon">
                <span>📚</span>
              </div>
              <div className="logo-text">
                KidsStoryTime<span className="logo-domain">.ai</span>
              </div>
            </div>
            {/* Show login button if no user, otherwise show user menu */}
            {!user ? (
              <button 
                className="header-btn login-btn"
                onClick={openAuthModal}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Sign In
              </button>
            ) : (
              <div className="header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Bedtime Mode Toggle */}
                <button
                  className="header-btn bedtime-toggle"
                  onClick={() => setBedtimeModeActive(!bedtimeModeActive)}
                  title={bedtimeModeActive ? "Bedtime mode active" : "Activate bedtime mode"}
                  style={{
                    background: bedtimeModeActive ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'rgba(255, 255, 255, 0.9)',
                    border: bedtimeModeActive ? '2px solid #fbbf24' : '2px solid #9ca3af',
                    color: bedtimeModeActive ? '#fbbf24' : '#475569',
                    padding: '6px 10px',
                    fontSize: '16px',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  {bedtimeModeActive ? '🌙' : '☾'}
                </button>
                
                {/* User Profile Dropdown */}
                <div className="user-menu-container" style={{ position: 'relative' }}>
                  <button 
                    className="header-btn user-profile-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                      console.log('Profile clicked, showUserMenu:', !showUserMenu);
                    }}
                    title="Account menu"
                    style={{
                      background: showUserMenu 
                        ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                      color: 'white',
                      border: showUserMenu ? '2px solid #9333ea' : 'none',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      transform: showUserMenu ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: showUserMenu ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
                    }}
                  >
                    👤
                  </button>
                  {showUserMenu && (
                    <div className="dropdown-menu" style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      minWidth: '220px',
                      zIndex: 10000,
                      overflow: 'hidden',
                      animation: 'slideDown 0.2s ease-out'
                    }}>
                      <button 
                        onClick={() => { setShowDashboard(true); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>📊</span> Parent Dashboard
                      </button>
                      <button 
                        onClick={() => { setShowProfileManager(true); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>👥</span> Manage Profiles
                      </button>
                      <button 
                        onClick={() => { window.open('/pricing-new.html', '_blank'); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>💳</span> Manage Subscription
                      </button>
                      <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }}></div>
                      <button 
                        onClick={() => { setShowCommunityAchievements(true); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>🏆</span> Community Achievements
                      </button>
                      <button 
                        onClick={() => { setShowReferralProgram(true); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>🎁</span> Referral Program
                      </button>
                      <button 
                        onClick={() => { setShowUserContent(true); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>💬</span> Community Reviews
                      </button>
                      <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }}></div>
                      <button 
                        onClick={() => { alert('Account settings coming soon!'); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>⚙️</span> Account Settings
                      </button>
                      <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }}></div>
                      <button 
                        onClick={() => { handleLogout(); setShowUserMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          textAlign: 'left',
                          color: '#ef4444'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="tagline">Join thousands of families creating magical bedtime moments</div>
          
          {/* Beta Banner */}
          <div className="beta-banner">
            <div className="beta-title">🎉 LAUNCH SPECIAL - First Month FREE on All Plans!</div>
            {/* Launch special subtitle removed for mobile clarity */}
          </div>
          
          {/* Quick Actions Bar */}
          <div className="quick-actions-bar" style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
              borderRadius: '12px',
              marginTop: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              flexWrap: 'wrap'
            }}>
              {/* Star Bank - Currency System */}
              <button 
                className="action-btn"
                onClick={() => setShowRewards(true)}
                title="Star Shop - Spend your stars!"
                aria-label={`Star shop with ${starPoints} stars`}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 2px 4px rgba(251,191,36,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{fontSize: '18px'}}>⭐</span>
                <span>{starPoints} Stars</span>
              </button>
              
              {/* Trophy Room - Achievement System */}
              <button 
                className="action-btn"
                onClick={() => setShowAchievements(true)}
                title="Badge Collection - View your achievements!"
                aria-label={`View ${achievementCount || 0} achievements`}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 2px 4px rgba(139,92,246,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{fontSize: '18px'}}>🏆</span>
                <span>{achievementCount || 0}/20 Badges</span>
              </button>
              
              {/* Library */}
              <button 
                className="action-btn"
                onClick={() => setShowLibrary(true)}
                title="My Story Library"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 2px 4px rgba(16,185,129,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{fontSize: '18px'}}>📚</span>
                <span>Library</span>
              </button>
              
              {/* Upgrade prompt if needed */}
              {(subscriptionTier === 'reader-free' || subscriptionTier === 'story-maker-basic' || subscriptionTier === 'story-pro') && storiesRemaining <= 1 && (
                <button 
                  className="action-btn upgrade-btn"
                  onClick={() => openAuthModal()}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    boxShadow: '0 2px 4px rgba(236,72,153,0.3)',
                    animation: 'pulse 2s infinite'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{fontSize: '18px'}}>✨</span>
                  <span>Upgrade to {getNextUpgradeTier(subscriptionTier)?.name || 'Premium'}</span>
                </button>
              )}
            </div>
        </header>

        {/* Account Section - Hidden during beta period */}
        {!user && false && ( // Disabled - Beta banner serves this purpose
          <div className="account-section">
            <h2>Create Your Free Account</h2>
            <p>Join thousands of parents creating magical stories for their children!</p>
            <div className="account-buttons">
              <button 
                className="account-btn signup-btn"
                onClick={() => openAuthModal()}
              >
                Create Free Account
              </button>
              <button 
                className="account-btn login-btn"
                onClick={() => openAuthModal()}
              >
                Login
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="main-content" style={{
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Reading Streak Display - TEMPORARILY HIDDEN */}
          {/* {selectedChildProfile && (
            <>
              <ReadingStreak childProfile={selectedChildProfile} />
            </>
          )} */}
          
          {/* Prompt to create profile if none selected */}
          {!selectedChildProfile && user && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              border: '2px dashed #667eea',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                💡 Create a child profile to unlock achievements, track reading streaks, and save preferences!
              </p>
              <button
                type="button"
                onClick={() => {
                  setProfileManagerCreateMode(true);
                  setShowProfileManager(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Profile
              </button>
            </div>
          )}
          
          {/* Step Indicators - Responsive */}
          <div className="step-indicators" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: window.innerWidth <= 480 ? '20px' : '40px',
            marginBottom: '20px',
            padding: window.innerWidth <= 480 ? '12px' : '20px',
            background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
            borderRadius: '12px',
            flexWrap: window.innerWidth <= 480 ? 'nowrap' : 'nowrap'
          }}>
            {[
              { num: '1', label: 'Who?', icon: '👤' },
              { num: '2', label: 'What?', icon: '✨' },
              { num: '3', label: 'Style', icon: '🎨' }
            ].map((step, index) => (
              <div key={step.num} style={{
                display: 'flex',
                alignItems: 'center',
                gap: window.innerWidth <= 480 ? '8px' : '12px',
                flex: window.innerWidth <= 480 ? '1' : 'initial'
              }}>
                <div style={{
                  width: window.innerWidth <= 480 ? '32px' : '40px',
                  height: window.innerWidth <= 480 ? '32px' : '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: window.innerWidth <= 480 ? '16px' : '20px',
                  flexShrink: 0
                }}>
                  {step.icon}
                </div>
                <div style={{
                  display: window.innerWidth <= 480 ? 'none' : 'block'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>Step {step.num}</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333'
                  }}>{step.label}</div>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleGenerateStory}>
            {/* STEP 1: Who is this story for? */}
            <div className="story-step" id="step1" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ padding: window.innerWidth <= 480 ? '16px' : '20px' }}>
                <header className="step-header" style={{marginBottom: '12px'}}>
                  <span style={{fontSize: '24px'}}>👤</span>
                  <h3 className="step-title">
                    <span className="eyebrow">Step 1</span>
                    Who is this for?
                  </h3>
                </header>
              
              {/* Child's Name and Gender */}
              <div className="form-group">
                <label htmlFor="childName">
                  Child's name (or character story is about)
                  {selectedChildProfile && (
                    <span 
                      onClick={() => setShowProfileManager(true)}
                      style={{ 
                        marginLeft: '10px', 
                        fontSize: '13px', 
                        fontWeight: 'normal',
                        color: '#667eea',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      (Profile: {selectedChildProfile.name})
                    </span>
                  )}
                </label>
                <div className="name-gender-row">
                  <input
                    type="text"
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter name (optional)"
                    className="name-input"
                    style={{
                      flex: '1',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <div className="gender-buttons" style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      className={`gender-btn ${genderSelection.boy ? 'active' : ''}`}
                      onClick={() => setGenderSelection(prev => ({ ...prev, boy: !prev.boy }))}
                      title="Boy"
                      style={{
                        padding: '10px 16px',
                        border: genderSelection.boy ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: genderSelection.boy ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                        color: genderSelection.boy ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span className="gender-icon">👦</span>
                      <span className="gender-text" style={{marginLeft: '4px'}}>Boy</span>
                    </button>
                    <button
                      type="button"
                      className={`gender-btn ${genderSelection.girl ? 'active' : ''}`}
                      onClick={() => setGenderSelection(prev => ({ ...prev, girl: !prev.girl }))}
                      title="Girl"
                      style={{
                        padding: '10px 16px',
                        border: genderSelection.girl ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: genderSelection.girl ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'white',
                        color: genderSelection.girl ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span className="gender-icon">👧</span>
                      <span className="gender-text" style={{marginLeft: '4px'}}>Girl</span>
                    </button>
                  </div>
                </div>
                
                <label style={{
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '12px',
                  color: '#333',
                  background: 'rgba(255,255,255,0.8)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  <input
                    type="checkbox"
                    id="includeNameInStory"
                    name="includeNameInStory"
                    checked={includeNameInStory}
                    onChange={(e) => setIncludeNameInStory(e.target.checked)}
                    style={{
                      margin: 0, 
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                      accentColor: '#667eea',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      backgroundColor: includeNameInStory ? '#667eea' : 'white',
                      border: '2px solid #667eea',
                      borderRadius: '4px',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  />
                  Include name as main character
                </label>
              </div>
              
              {/* Reading Level */}
              <div className="form-group" style={{marginBottom: 0}}>
                <label htmlFor="readingLevel">Reading Level</label>
                <select
                  id="readingLevel"
                  className="form-select"
                  value={readingLevel}
                  onChange={(e) => setReadingLevel(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="pre-reader">Pre-Reader (ages 3–6)</option>
                  <option value="early-phonics">Early Phonics Reader (ages 4–7)</option>
                  <option value="beginning-reader">Beginning Reader (ages 5–8)</option>
                  <option value="developing-reader">Developing Reader (ages 6–10)</option>
                  <option value="fluent-reader">Fluent Reader (ages 8–13)</option>
                  <option value="insightful-reader">Insightful Reader (ages 10–16+)</option>
                </select>
              </div>
              </div>
            </div>

            {/* STEP 2: What's the story about? */}
            <div className="story-step" id="step2" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ padding: window.innerWidth <= 480 ? '16px' : '20px' }}>
                <header className="step-header" style={{marginBottom: '12px'}}>
                  <span style={{fontSize: '24px'}}>✨</span>
                  <h3 className="step-title">
                    <span className="eyebrow">Step 2</span>
                    Story idea
                  </h3>
                </header>
              
              {/* Story Prompt */}
              <div className="form-group">
                <label htmlFor="customPrompt">
                  Tell me your story idea
                </label>
                <div className="prompt-container" style={{position: 'relative'}}>
                  <textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows="4"
                    placeholder="E.g., A brave princess who discovers a friendly dragon in her garden..."
                    className="prompt-textarea"
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: '50px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="button"
                    className={`voice-btn ${isRecording ? 'recording' : ''}`}
                    onClick={handleVoiceRecord}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      padding: '8px',
                      background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {isRecording ? '🔴' : '🎤'}
                  </button>
                </div>
                <button 
                  type="button" 
                  className="info-btn tips-btn" 
                  onClick={() => alert('Story Tips:\n\n• Be specific about the setting\n• Include your child\'s interests\n• Add a lesson or moral\n• Mention favorite characters\n• The more detail, the better!')}
                  style={{
                    marginTop: '8px',
                    marginLeft: '0',
                    padding: '0',
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'left'
                  }}
                >
                  💡 Tips for great stories
                </button>
              </div>
              
              {/* Theme Selection with Labels */}
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Choose themes (optional)</label>
                <p className="help" id="theme-help" style={{
                  fontSize: '13px',
                  opacity: 0.7,
                  margin: '8px 0 4px'
                }}>Choose up to 3 themes for your story</p>
                <div className="theme-grid" role="group" aria-labelledby="theme-help">
                  {getAvailableThemes().slice(0, 12).map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-chip ${selectedThemes.includes(theme.id) ? 'selected' : ''}`}
                      aria-pressed={selectedThemes.includes(theme.id)}
                      data-theme={theme.id}
                      onClick={() => toggleTheme(theme.id)}
                    >
                      <span style={{fontSize: '18px'}}>{theme.emoji}</span>
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>

            {/* STEP 3: Choose your style */}
            <div className="story-step" id="step3" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ padding: window.innerWidth <= 480 ? '16px' : '20px' }}>
                <header className="step-header" style={{marginBottom: '12px'}}>
                  <span style={{fontSize: '24px'}}>🎨</span>
                  <h3 className="step-title">
                    <span className="eyebrow">Step 3</span>
                    Style options
                  </h3>
                </header>
              
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                gap: '16px',
                alignItems: 'flex-start'
              }}>
                {/* Story Length */}
                <div className="form-group" style={{marginBottom: 0, display: 'flex', flexDirection: 'column', flex: '1 1 0', minWidth: 0}}>
                  <label htmlFor="storyLength" style={{marginBottom: '8px', display: 'block'}}>
                    <span style={{fontSize: '20px', marginRight: '8px'}}>⏱️</span>
                    Story Length
                  </label>
                  <select
                    id="storyLength"
                    className="form-select"
                    value={storyLength}
                    onChange={(e) => setStoryLength(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      height: '42px'
                    }}
                  >
                    {STORY_LENGTHS.map(length => (
                      <option key={length.id} value={length.id}>
                        {length.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Illustration Style */}
                <div className="form-group" style={{marginBottom: 0, display: 'flex', flexDirection: 'column', flex: '1 1 0', minWidth: 0}}>
                  <label htmlFor="imageStyle" style={{marginBottom: '8px', display: 'block'}}>
                    <span style={{fontSize: '20px', marginRight: '8px'}}>🎭</span>
                    Illustration Style
                  </label>
                  <select
                    id="imageStyle"
                    className="form-select"
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      height: '42px'
                    }}
                  >
                    {getImageStyles().map(style => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              </div>
            </div>

            {/* Generate Button */}
            <button 
              type="submit" 
              className={`generate-btn ${isGenerating ? 'generating' : ''}`}
              disabled={isGenerating || (!user && storiesRemaining <= 0)}
            >
              {isGenerating ? 'Creating your magical story...' : 
               !user ? '✨ Create Story! ✨' : '✨ Generate Story! ✨'}
            </button>
            
            {/* Enhanced Plan Status with Usage Tracking */}
            {user && (
              <UsageDisplay 
                user={user}
                subscriptionTier={subscriptionTier}
                storiesRemaining={storiesRemaining}
                monthlyStoriesUsed={monthlyStoriesUsed}
                aiIllustrationsUsed={aiIllustrationsUsed}
                narrationsUsed={narrationsUsed}
              />
            )}

          </form>
        </div>

        {/* Upgrade Section - Separate Box */}
        {/* Show upgrade section only if there's a next tier available */}
        {(() => {
          const nextTier = getNextUpgradeTier(subscriptionTier);
          return (!user || nextTier) && (
          <div className="main-content" style={{
            marginTop: '20px',
            padding: window.innerWidth <= 480 ? '16px' : window.innerWidth <= 768 ? '20px' : '24px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            borderRadius: '12px',
            border: '2px solid #667eea',
            boxSizing: 'border-box',
            maxWidth: '100%',
            width: '100%',
            margin: '20px auto 0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#333'
              }}>
                {!user ? '🎉 Create Your Free Account' : `🌟 Upgrade to ${nextTier?.name || 'Premium'}`}
              </h3>
              
              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '20px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Sign Up Free - No Credit Card
                  </button>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <p style={{ fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                      Free Reader account includes:
                    </p>
                    <ul style={{ margin: '0 auto', paddingLeft: '20px', lineHeight: '1.8', maxWidth: '500px', textAlign: 'left' }}>
                      <li>✅ 3 stories per day</li>
                      <li>✅ Save stories to your library</li>
                      <li>✅ Create child profiles</li>
                      <li>✅ Basic themes and story options</li>
                      <li>✅ Placeholder images</li>
                    </ul>
                  </div>
                </>
              ) : nextTier ? (
                <>
                  <p style={{ 
                    fontSize: '14px', 
                    fontStyle: 'italic',
                    color: '#667eea',
                    fontWeight: '600',
                    marginBottom: '15px'
                  }}>
                    🎁 {nextTier.price} - Next level benefits
                  </p>
                  
                  <ul style={{ 
                    textAlign: 'center', 
                    listStyle: 'none', 
                    padding: 0,
                    fontSize: '14px',
                    lineHeight: '2',
                    marginBottom: '20px'
                  }}>
                    {nextTier.features.map((feature, index) => (
                      <li key={index}>
                        {nextTier.highlight?.includes(feature) ? (
                          <span style={{ 
                            backgroundColor: '#fef3c7', 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {feature}
                          </span>
                        ) : (
                          feature
                        )}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    type="button"
                    onClick={() => handleStripeUpgrade(nextTier.name)}
                    style={{
                      padding: '14px 40px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '15px',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    Upgrade to {nextTier.name}
                  </button>
                  
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#999',
                    marginTop: '10px'
                  }}>
                    <a 
                      href="/pricing-new.html" 
                      style={{ color: '#667eea', textDecoration: 'none' }}
                    >
                      View plans and pricing →
                    </a>
                  </p>
                </>
              ) : (
                /* User is at highest tier - show achievement message */
                <div style={{ textAlign: 'center' }}>
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#48bb78',
                    fontWeight: '600',
                    marginBottom: '10px'
                  }}>
                    🏆 You have the ultimate plan!
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666'
                  }}>
                    Enjoy unlimited stories and all premium features with Family Plus
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        })()}

        {/* Footer */}
        <footer className="footer" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          marginTop: '40px'
        }}>
          <p style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            <a href="/pricing-new.html" target="_blank" style={{ color: 'white', textDecoration: 'underline', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Pricing</a> | 
            <a href="/terms.html" target="_blank" style={{ color: 'white', textDecoration: 'underline', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Terms of Service</a> | 
            <a href="/privacy.html" target="_blank" style={{ color: 'white', textDecoration: 'underline', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Privacy Policy</a> | 
            <a href="mailto:support@kidsstorytime.ai" style={{ color: 'white', textDecoration: 'underline', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Contact Us</a>
          </p>
          <p style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>&copy; 2025 Kids Story Time.</p>
          <p style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>All rights reserved.</p>
        </footer>
      </div>

      {/* Bedtime Mode Modal */}
      <BedtimeModeModal
        isActive={bedtimeModeActive}
        onClose={() => setBedtimeModeActive(false)}
        onActivate={() => setBedtimeModeActive(true)}
        onDeactivate={() => setBedtimeModeActive(false)}
      />

      {/* Authentication Manager - New Enhanced Auth System */}
      {authModal && (
        <AuthenticationManager 
          onAuthSuccess={(user) => {
            handleAuthSuccess(user);
            checkUser();
          }}
          onClose={closeAuthModal}
        />
      )}

      {/* Profile Manager Modal */}
      {showProfileManager && (
        <ProfileManager
          startInCreateMode={profileManagerCreateMode}
          onClose={() => {
            setShowProfileManager(false);
            setProfileManagerCreateMode(false);
          }}
          onProfileSelect={(profile) => {
            setSelectedChildProfile(profile);
            // Auto-populate form with profile data
            setChildName(profile.name || '');
            setGenderSelection({
        boy: profile.gender === 'male',
        girl: profile.gender === 'female'
      });
            setIncludeNameInStory(profile.include_name_in_stories !== false);
            setReadingLevel(profile.reading_level || 'developing-reader');
            setSelectedThemes(profile.favorite_themes || []);
            
            // Add favorite items to the story prompt
            if (profile.favorite_items && profile.favorite_items.length > 0) {
              const favoriteItemsText = `Include these favorite things: ${profile.favorite_items.join(', ')}`;
              // Clear any previous "favorite things" and add the new ones
              setCustomPrompt(prevPrompt => {
                // Remove any existing "Include these favorite things:" line
                const cleanedPrompt = prevPrompt ? 
                  prevPrompt.replace(/Include these favorite things:.*$/gm, '').trim() : '';
                
                // Add the new favorite items
                if (cleanedPrompt) {
                  return `${cleanedPrompt}\n\n${favoriteItemsText}`;
                }
                return favoriteItemsText;
              });
            } else {
              // Clear favorite items from prompt if none exist
              setCustomPrompt(prevPrompt => {
                return prevPrompt ? 
                  prevPrompt.replace(/Include these favorite things:.*$/gm, '').trim() : '';
              });
            }
            
            // Load star points for this profile
            const savedStars = localStorage.getItem(`stars_${profile.id}`);
            if (savedStars) {
              setStarPoints(parseInt(savedStars) || 0);
            } else {
              setStarPoints(0);
            }
            
            // Load achievement count for selected profile
            const savedAchievements = localStorage.getItem(`achievements_${profile.id}`);
            if (savedAchievements) {
              try {
                const achievementList = JSON.parse(savedAchievements);
                setAchievementCount(achievementList.length);
              } catch (e) {
                setAchievementCount(0);
              }
            } else {
              setAchievementCount(0);
            }
            
            setShowProfileManager(false);
          }}
          user={user}
        />
      )}

      {/* Achievement System Modal */}
      {showAchievements && (
        <AchievementSystem
          childProfile={selectedChildProfile || { id: 'guest', name: 'Guest' }}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Star Rewards System Modal */}
      {showRewards && (
        <StarRewardsSystem
          childProfile={selectedChildProfile || { id: 'guest', name: 'Guest' }}
          stars={starPoints}
          setStars={setStarPoints}
          onClose={() => setShowRewards(false)}
        />
      )}

      {/* Parent Dashboard Modal */}
      {showDashboard && (
        <ParentDashboard
          onClose={() => setShowDashboard(false)}
        />
      )}
      
      {/* Community Achievements Modal */}
      {showCommunityAchievements && (
        <CommunityAchievements
          childProfile={selectedChildProfile}
          onClose={() => setShowCommunityAchievements(false)}
          onStarsEarned={(stars) => {
            setStarPoints(prev => prev + stars);
            localStorage.setItem(`stars_${selectedChildProfile?.id}`, starPoints + stars);
            triggerCelebration('achievement');
          }}
        />
      )}
      
      {/* Referral Program Modal */}
      {showReferralProgram && (
        <ReferralProgram
          userId={user?.id || 'guest'}
          onStarsEarned={(stars) => {
            setStarPoints(prev => prev + stars);
            if (selectedChildProfile) {
              localStorage.setItem(`stars_${selectedChildProfile.id}`, starPoints + stars);
            }
            triggerCelebration('referral');
          }}
          onClose={() => setShowReferralProgram(false)}
        />
      )}
      
      {/* User Generated Content Modal */}
      {showUserContent && (
        <UserGeneratedContent
          storyId={currentStory?.id}
          userId={user?.id || 'guest'}
          onStarsEarned={(stars) => {
            setStarPoints(prev => prev + stars);
            if (selectedChildProfile) {
              localStorage.setItem(`stars_${selectedChildProfile.id}`, starPoints + stars);
            }
            triggerCelebration('review');
          }}
          onClose={() => setShowUserContent(false)}
        />
      )}
      
      {/* Celebration Animations */}
      {CelebrationComponent}
      
      {/* Tier Testing Modal (Development Only) */}
      {showTierTester && (
        <>
          {/* Background Overlay */}
          <div 
            onClick={() => setShowTierTester(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99999
            }}
          />
          
          {/* Modal */}
          <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 100000,
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
              💎 Test Subscription Tiers
            </h2>
            <button
              onClick={() => setShowTierTester(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Click a tier to instantly switch (dev mode only)
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: 'try-now', name: 'Try Now (Guest)', color: '#9ca3af', desc: '1 story trial, no account needed' },
              { id: 'reader-free', name: 'Infrequent Reader', color: '#10b981', desc: 'FREE - 3 stories/day, 10/month' },
              { id: 'story-pro', name: 'Story Pro', color: '#3b82f6', desc: '$4.99 - 10 stories/day + 30 AI images' },
              { id: 'read-to-me-promax', name: 'Read to Me ProMax', color: '#a855f7', desc: '$6.99 - 20 stories/day + narration' },
              { id: 'family-plus', name: 'Family Plus', color: '#f59e0b', desc: '$7.99 - Unlimited + 4 profiles' }
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  setSubscriptionTier(tier.id);
                  localStorage.setItem('subscriptionTier', tier.id);
                  
                  // Create mock user for this tier
                  const mockUser = {
                    id: `test-${tier.id}`,
                    email: `${tier.id}@test.com`,
                    tier: tier.id
                  };
                  localStorage.setItem('mockUser', JSON.stringify(mockUser));
                  
                  logger.info(`Switched to tier: ${tier.name}`);
                  setShowTierTester(false);
                  
                  // Reset usage counters for testing
                  const limits = getTierLimits(tier.id, mockUser);
                  setStoriesRemaining(limits.dailyStories);
                  setMonthlyStoriesUsed(0);
                  setAiIllustrationsUsed(0);
                  setNarrationsUsed(0);
                }}
                style={{
                  padding: '12px',
                  background: subscriptionTier === tier.id 
                    ? `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)`
                    : 'white',
                  color: subscriptionTier === tier.id ? 'white' : '#333',
                  border: `2px solid ${tier.color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (subscriptionTier !== tier.id) {
                    e.target.style.background = `${tier.color}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (subscriptionTier !== tier.id) {
                    e.target.style.background = 'white';
                  }
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {tier.name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {tier.desc}
                </div>
              </button>
            ))}
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            ⚠️ Dev Mode Only - Changes are temporary
          </div>
        </div>
        </>
      )}
      
      {/* Stripe Test Component (Development Only) */}
      {showStripeTest && (
        <div id="stripe-test-component">
          <StripeTestComponent />
        </div>
      )}
      
      {/* Test Button (Development Only) */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setShowStripeTest(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          🧪 Test Stripe
        </button>
      )}
      
      {/* Tier Testing Button - Development only */}
      {import.meta.env.DEV && (
        <button
          onClick={() => {
            logger.debug('Tier testing button clicked!');
            setShowTierTester(true);
          }}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#8b5cf6',
            color: 'white',
            border: '3px solid #fff',
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.6)',
            cursor: 'pointer',
            zIndex: 99999,
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title="Test Subscription Tiers"
        >
          💎
        </button>
      )}
    </div>
  );
}

// Bedtime Mode Modal Component
function BedtimeModeModal({ isActive, onClose, onActivate, onDeactivate }) {
  const [timer, setTimer] = useState(30); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (isActive && timer > 0) {
      setTimeRemaining(timer * 60); // Convert to seconds
      
      const id = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(id);
            onDeactivate();
            alert('Bedtime! Sweet dreams! 🌙');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setIntervalId(id);
      
      return () => {
        if (id) clearInterval(id);
      };
    }
  }, [isActive, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      zIndex: 999,
      minWidth: '280px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>🌙 Bedtime Mode Active</h3>
        <button 
          onClick={onDeactivate}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0
          }}
        >×</button>
      </div>
      
      {timeRemaining !== null && (
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#fbbf24',
          marginBottom: '16px'
        }}>
          {formatTime(timeRemaining)}
        </div>
      )}
      
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="bedtimeTimer" style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Set Timer (minutes):
        </label>
        <select
          id="bedtimeTimer"
          name="bedtimeTimer"
          value={timer}
          onChange={(e) => setTimer(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #475569',
            background: '#334155',
            color: 'white',
            fontSize: '14px'
          }}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
        </select>
      </div>
      
      <div style={{
        padding: '12px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: '1.5'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>✨ Bedtime features:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Calming stories only</li>
          <li>Soft voice narration</li>
          <li>Auto-shutdown timer</li>
          <li>Dimmed interface</li>
        </ul>
      </div>
      
      {/* Developer Test Panel - Only shows in development */}
      <DevTestPanel 
        currentTier={subscriptionTier}
        onTierChange={(tier) => setSubscriptionTier(tier)}
      />
    </div>
  );
}

// Usage Display Component
function UsageDisplay({ user, subscriptionTier, storiesRemaining, monthlyStoriesUsed, aiIllustrationsUsed, narrationsUsed }) {
  const [usageSummary, setUsageSummary] = useState(null);
  
  useEffect(() => {
    if (user || subscriptionTier === 'try-now') {
      loadUsageSummary();
    }
  }, [user, subscriptionTier, storiesRemaining, monthlyStoriesUsed, aiIllustrationsUsed, narrationsUsed]);
  
  const loadUsageSummary = async () => {
    try {
      // For test users, use the passed props directly
      const isTestUser = user?.id?.startsWith('test-') || 
                        !import.meta.env.VITE_SUPABASE_URL || 
                        import.meta.env.VITE_SUPABASE_URL.includes('dummy');
      
      if (isTestUser) {
        // Calculate usage from props for test users
        const limits = getTierLimits(subscriptionTier, user);
        const dailyUsed = limits.dailyStories - storiesRemaining;
        
        setUsageSummary({
          dailyStories: { 
            used: dailyUsed, 
            limit: limits.dailyStories,
            remaining: storiesRemaining
          },
          monthlyStories: { 
            used: monthlyStoriesUsed, 
            limit: limits.monthlyStories,
            remaining: limits.monthlyStories === 'unlimited' ? 'unlimited' : 
                      Math.max(0, limits.monthlyStories - monthlyStoriesUsed)
          },
          aiIllustrations: { 
            used: aiIllustrationsUsed, 
            limit: limits.aiIllustrations,
            remaining: limits.aiIllustrations === 'unlimited' ? 'unlimited' : 
                      Math.max(0, limits.aiIllustrations - aiIllustrationsUsed)
          },
          narrations: { 
            used: narrationsUsed, 
            limit: limits.narrations,
            remaining: limits.narrations === 'unlimited' ? 'unlimited' : 
                      Math.max(0, limits.narrations - narrationsUsed)
          }
        });
        return;
      }
      
      // For real users, load from database
      const summary = await usageTracker.getUsageSummary(user.id, subscriptionTier);
      setUsageSummary(summary);
    } catch (error) {
      console.error('Error loading usage summary:', error);
    }
  };
  
  if (!usageSummary) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '14px',
        color: '#666'
      }}>
        {subscriptionTier === 'try-now' ? 
          <>Try Now: {storiesRemaining} story remaining today</> :
         subscriptionTier === 'reader-free' ? 
          <>Reader Plan: {storiesRemaining} stories remaining today</> :
         subscriptionTier === 'family-plus' ?
          <>Family Plan: {storiesRemaining} stories remaining today</> :
          <>Premium Plan: Unlimited stories</>
        }
      </div>
    );
  }
  
  const { 
    dailyStories = { remaining: 0, used: 0, limit: 0 }, 
    monthlyStories = { remaining: 0, used: 0, limit: null }, 
    aiIllustrations = { remaining: 0, used: 0, limit: null }, 
    narrations = { remaining: 0, used: 0, limit: null }
  } = usageSummary;
  
  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#333'
      }}>
        📈 Your Plan Usage
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Daily Stories */}
        <div style={{
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Stories Today
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {dailyStories.remaining === 'unlimited' ? '∞' : `${dailyStories.remaining} left`}
          </div>
          {dailyStories.limit !== 'unlimited' && (
            <div style={{ fontSize: '11px', color: '#999' }}>
              {dailyStories.used}/{dailyStories.limit} used
            </div>
          )}
        </div>
        
        {/* Monthly Stories */}
        {monthlyStories.limit !== null && (
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Stories This Month
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {monthlyStories.remaining === 'unlimited' ? '∞' : `${monthlyStories.remaining} left`}
            </div>
            {monthlyStories.limit !== 'unlimited' && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                {monthlyStories.used}/{monthlyStories.limit} used
              </div>
            )}
          </div>
        )}
        
        {/* AI Illustrations */}
        {aiIllustrations.limit > 0 && (
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              AI Images
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {aiIllustrations.remaining === 'unlimited' ? '∞' : `${aiIllustrations.remaining || 0} left`}
            </div>
            {aiIllustrations.limit !== 'unlimited' && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                {aiIllustrations.used || 0}/{aiIllustrations.limit} this month
              </div>
            )}
          </div>
        )}
        
        {/* Narrations */}
        {narrations.limit > 0 && (
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Voice Narrations
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {narrations.remaining === 'unlimited' ? '∞' : `${narrations.remaining || 0} left`}
            </div>
            {narrations.limit !== 'unlimited' && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                {narrations.used || 0}/{narrations.limit} this month
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Plan Name */}
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '13px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        {subscriptionTier === 'try-now' ? 'Try Now (Free)' :
         subscriptionTier === 'reader-free' ? 'Reader (Free) Plan' :
         subscriptionTier === 'reader' ? 'Reader Plan' :
         subscriptionTier === 'story-pro' ? 'Story Pro Plan' :
         subscriptionTier === 'story-maker-basic' ? 'Story Maker Basic' :
         subscriptionTier === 'read-to-me-promax' ? 'Read to Me Pro-Max Plan' :
         subscriptionTier === 'movie-director-premium' ? 'Movie Director Premium' :
         subscriptionTier === 'family' ? 'Family Plan' :
         subscriptionTier === 'family-plus' ? 'Family Plus Plan' :
         'Current Plan'}
      </div>
    </div>
  );
}

// Old AuthModal component removed - now using AuthenticationManager

export default App;