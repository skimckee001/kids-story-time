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
import { getTierLimits, canGenerateStory, canUseAIIllustration, getUpgradeMessage } from './utils/subscriptionTiers';
import AuthenticationManager from './components/AuthenticationManager';
import { useEnhancedAuth } from './hooks/useEnhancedAuth';
import './App.original.css';

// Story length options matching the current HTML
const STORY_LENGTHS = [
  { id: 'short', label: 'Short (2-3 minutes)' },
  { id: 'medium', label: 'Medium (5-7 minutes)' },
  { id: 'long', label: 'Long (10-15 minutes)' },
  { id: 'extended', label: 'Extended (20 minutes)' },
  { id: 'long-extended', label: 'Long Extended (30 minutes)' },
  { id: 'extra-long', label: 'Extra Long (45 minutes)' }
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
  const [showStripeTest, setShowStripeTest] = useState(false);
  const [showCommunityAchievements, setShowCommunityAchievements] = useState(false);
  const [showReferralProgram, setShowReferralProgram] = useState(false);
  const [showUserContent, setShowUserContent] = useState(false);
  const { triggerCelebration, CelebrationComponent } = useCelebration();

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
        name: 'Read to Me ProMax', price: '$6.99/month',
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
      'family': null
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
    // Determine age-appropriate styles based on reading level
    const isYounger = ['pre-reader', 'early-phonics', 'beginning-reader'].includes(readingLevel);
    const isOlder = ['fluent-reader', 'insightful-reader'].includes(readingLevel);
    
    const allStyles = [
      {
        id: 'age-appropriate',
        label: 'Smart Choice',
        icon: '✨',
        description: '',
        prompt: '' // Will be determined based on age
      },
      {
        id: 'cartoon',
        label: 'Cartoon Fun',
        icon: '🎨',
        description: 'Colorful & playful',
        prompt: 'bright cartoon style, child-friendly, vibrant colors',
        ageRange: [3, 10]
      },
      {
        id: 'watercolor',
        label: 'Watercolor',
        icon: '🖌️',
        description: 'Soft & dreamy',
        prompt: 'watercolor painting style, soft edges, pastel colors',
        ageRange: [4, 12]
      },
      {
        id: 'storybook',
        label: 'Classic Book',
        icon: '📖',
        description: 'Traditional illustrations',
        prompt: 'classic children\'s book illustration, detailed, warm',
        ageRange: [5, 14]
      },
      {
        id: 'realistic',
        label: 'Realistic',
        icon: '📸',
        description: 'Photo-like quality',
        prompt: 'photorealistic style, highly detailed, natural lighting, realistic proportions, life-like, photography style',
        ageRange: [8, 16]
      },
      {
        id: 'anime',
        label: 'Anime/Manga',
        icon: '🎌',
        description: 'Japanese style art',
        prompt: 'anime style illustration, manga art, expressive',
        ageRange: [10, 16]
      },
      {
        id: 'comic',
        label: 'Comic Book',
        icon: '💥',
        description: 'Action-packed style',
        prompt: 'comic book style, dynamic poses, bold colors',
        ageRange: [8, 16]
      },
      {
        id: 'fantasy',
        label: 'Fantasy Art',
        icon: '🐉',
        description: 'Epic & magical',
        prompt: 'fantasy art style, magical, detailed, atmospheric',
        ageRange: [10, 16]
      }
    ];
    
    // Filter styles based on age appropriateness
    if (isYounger) {
      return allStyles.filter(s => 
        s.id === 'age-appropriate' || 
        !s.ageRange || 
        s.ageRange[0] <= 8
      ).slice(0, 5); // Limit choices for younger kids
    } else if (isOlder) {
      return allStyles.filter(s => 
        s.id === 'age-appropriate' || 
        !s.ageRange || 
        s.ageRange[1] >= 10
      );
    }
    
    // Default: show age-appropriate selection
    return allStyles.slice(0, 6);
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

    // Check story generation limits
    const tierLimits = getTierLimits(subscriptionTier, user);
    if (!canGenerateStory(subscriptionTier, tierLimits.dailyStories - storiesRemaining, monthlyStoriesUsed, user)) {
      alert(getUpgradeMessage(user ? subscriptionTier : 'try-now', 'stories'));
      return;
    }

    setIsGenerating(true);

    try {
      // Call the story generation API
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:9000/.netlify/functions/generate-story'
        : '/.netlify/functions/generate-story';
      
      // Get the appropriate image style prompt
      const selectedStyle = getImageStyles().find(s => s.id === imageStyle);
      let imagePrompt = selectedStyle?.prompt || '';
      
      // If "age-appropriate" is selected, determine the best style based on age
      if (imageStyle === 'age-appropriate') {
        const isYounger = ['pre-reader', 'early-phonics', 'beginning-reader'].includes(readingLevel);
        const isOlder = ['fluent-reader', 'insightful-reader'].includes(readingLevel);
        
        if (isYounger) {
          imagePrompt = 'bright cartoon style, child-friendly, vibrant colors, simple shapes';
        } else if (isOlder) {
          imagePrompt = 'detailed illustration, semi-realistic, dynamic composition';
        } else {
          imagePrompt = 'classic children\'s book illustration, warm and inviting';
        }
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
          gender: genderSelection.boy && genderSelection.girl ? 'both' : genderSelection.boy ? 'boy' : genderSelection.girl ? 'girl' : '',
          customPrompt,
          storyContext,
          includeNameInStory,
          subscriptionTier,
          imageStyle: imageStyle,
          imagePrompt: imagePrompt
        })
      });

      const data = await response.json();
      
      if (data.story) {
        // Set the current story and show the story display immediately
        const storyData = {
          title: data.story.title,
          content: data.story.content,
          imageUrl: null,
          childName: childName,
          themes: selectedThemes,
          readingLevel: readingLevel,
          metadata: data.story.metadata
        };
        
        setCurrentStory(storyData);
        setShowStory(true);
        
        // Award stars for completing a story
        if (selectedChildProfile?.id) {
          const newTotal = addStarsToChild(selectedChildProfile.id, 10, 'Completed a story');
          console.log(`Awarded 10 stars! New total: ${newTotal}`);
          
          // Trigger celebration animation
          triggerCelebration('stars', 'You earned 10 stars!');
          
          // Check for milestones
          if (newTotal >= 100 && newTotal < 110) {
            setTimeout(() => triggerCelebration('achievement', '100 Stars Milestone!'), 3500);
          }
        }
        
        // Auto-save story for logged-in users
        if (user) {
          saveStoryToLibrary(storyData);
        }
        
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
        const canGenerateAI = canUseAIIllustration(subscriptionTier, aiIllustrationsUsed, user);
        if (canGenerateAI) {
          console.log('Generating AI illustration for tier:', subscriptionTier);
          setAiIllustrationsUsed(prev => prev + 1);
          
          const imageApiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:9000/.netlify/functions/generate-image'
            : '/.netlify/functions/generate-image';
          
          const selectedThemeLabels = selectedThemes
            .map(id => getAvailableThemes().find(t => t.id === id)?.label)
            .filter(Boolean)
            .join(', ');
          
          // Use the image prompt that was already determined based on the selected style
          const storyImagePrompt = imagePrompt ? 
            `${data.story.title}. ${imagePrompt}. ${selectedThemeLabels} theme` :
            `${data.story.title}. Child-friendly, colorful illustration. ${selectedThemeLabels} theme`;
          
          // Determine API tier - include old tier names for compatibility
          const apiTier = (subscriptionTier === 'family-plus' || 
                          subscriptionTier === 'story-maker-basic' || 
                          subscriptionTier === 'movie-director-premium' ||
                          subscriptionTier === 'premium' ||  // Old premium tier
                          subscriptionTier === 'plus' ||     // Old plus tier
                          subscriptionTier === 'basic' ||    // Old basic tier
                          subscriptionTier === 'family') ? 'ai-enabled' : 'standard';
          
          console.log('Sending to API with tier:', apiTier, 'from subscription tier:', subscriptionTier);
          
          // Fire off image generation without awaiting
          fetch(imageApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: storyImagePrompt,
              style: imageStyle === 'realistic' ? 'photorealistic' : 'illustration',
              mood: imageStyle === 'realistic' ? 'natural' : 'cheerful',
              tier: apiTier
            })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Image generation failed');
          })
          .then(imageData => {
            console.log('Image generation response:', imageData);
            if (imageData.url || (imageData.success && imageData.url)) {
              const imageUrl = imageData.url;
              console.log('Setting image URL:', imageUrl);
              // Update the story with the image URL
              setCurrentStory(prev => {
                const updatedStory = {
                  ...prev,
                  imageUrl: imageUrl
                };
                console.log('Updated story with image:', updatedStory);
                // Update saved story with image URL
                if (user && prev.savedId) {
                  updateSavedStoryImage(prev.savedId, imageUrl);
                }
                return updatedStory;
              });
            } else {
              console.warn('No URL in image response:', imageData);
            }
          })
          .catch(error => {
            console.error('Image generation failed:', error);
          });
        }
        
        // Update usage counters
        setStoriesRemaining(prev => Math.max(0, prev - 1));
        setMonthlyStoriesUsed(prev => prev + 1);
        
        // Award star points
        setStarPoints(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      alert('Failed to generate story. Please try again.');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const saveData = {
        title: storyData.title,
        content: storyData.content,
        child_name: storyData.childName,
        theme: storyData.themes?.join(', ') || '',
        image_url: storyData.imageUrl,
        user_id: user.id,
        reading_level: storyData.readingLevel,
        metadata: storyData.metadata || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(saveData)
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
    try {
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
          setShowStory(false);
          setShowLibrary(true);
        }}
        onShowAuth={() => {
          openAuthModal();
        }}
        onSave={() => {
          console.log('Story saved');
          // Award extra star for saving
          setStarPoints(prev => prev + 1);
        }}
      />
    );
  }

  return (
    <div className="app">
      {/* Onboarding Tooltips for First-Time Users */}
      {!user && <OnboardingTooltips onComplete={() => console.log('Onboarding completed')} />}
      
      <div className="container">
        {/* Header */}
        <header className="header-container">
          <div className="header-content">
            <div className="header-left">
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
          
          {/* Navigation Bar */}
          <div className="header-content" style={{marginTop: '1rem'}}>
            <div className="header-right" style={{width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', minHeight: 'auto'}}>
              {user ? (
                <>
                  {/* Star Bank - Currency System */}
                  <button 
                    className="header-btn"
                    onClick={() => setShowRewards(true)}
                    title="Star Shop - Spend your stars!"
                    aria-label="Star shop with {starPoints} stars"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>⭐</span>
                    <span>{starPoints}</span>
                  </button>
                  
                  {/* Trophy Room - Achievement System */}
                  <button 
                    className="header-btn"
                    onClick={() => setShowAchievements(true)}
                    title="Badge Collection - View your achievements!"
                    aria-label="View {achievementCount || 0} achievements"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>🎖️</span>
                    <span>{achievementCount || 0}/48</span>
                  </button>
                  
                  {/* Library button removed for mobile simplicity */}
                  {(subscriptionTier === 'reader-free' || subscriptionTier === 'story-maker-basic') && storiesRemaining <= 1 && (
                    <button 
                      className="header-btn trial-btn"
                      onClick={() => openAuthModal()}
                    >
                      ⭐ Upgrade to Story Maker
                      <div className="trial-tooltip">
                        10 stories/day + AI images • $4.99/month
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Show gamification elements for non-logged-in users (at 0) */}
                  <button 
                    className="header-btn"
                    onClick={() => openAuthModal()}
                    title="Create an account to start earning stars!"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600', opacity: 0.7}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>⭐</span>
                    <span>0</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={() => openAuthModal()}
                    title="Sign up to unlock badges!"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600', opacity: 0.7}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>🎖️</span>
                    <span>0/48</span>
                  </button>
                  
                  {/* Library, Plans and Create buttons removed for mobile simplicity */}
                </>
              )}
            </div>
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
        <div className="main-content">
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
                onClick={() => setShowProfileManager(true)}
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
          
          <form onSubmit={handleGenerateStory}>
            {/* Child's Name and Gender */}
            <div className="form-group">
              <label htmlFor="childName">
                Child's Name
                {selectedChildProfile && (
                  <span style={{ 
                    marginLeft: '10px', 
                    fontSize: '13px', 
                    fontWeight: 'normal',
                    color: '#667eea'
                  }}>
                    (Using profile: {selectedChildProfile.name})
                  </span>
                )}
              </label>
              <div className="name-gender-row">
                <input
                  type="text"
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Enter your child's name (optional)"
                  className="name-input"
                />
                <div className="gender-buttons">
                  <button
                    type="button"
                    className={`gender-btn ${genderSelection.boy ? 'active' : ''}`}
                    onClick={() => setGenderSelection(prev => ({ ...prev, boy: !prev.boy }))}
                    title="Boy"
                  >
                    <span className="gender-icon">👦</span>
                    <span className="gender-text">Boy</span>
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${genderSelection.girl ? 'active' : ''}`}
                    onClick={() => setGenderSelection(prev => ({ ...prev, girl: !prev.girl }))}
                    title="Girl"
                  >
                    <span className="gender-icon">👧</span>
                    <span className="gender-text">Girl</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Include Name Checkbox - Outside form-group for proper alignment */}
            <div style={{
              marginTop: '-15px',
              marginBottom: '20px',
              paddingLeft: '0px'
            }}>
              <label style={{
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'normal',
                color: '#333'
              }}>
                <input
                  type="checkbox"
                  checked={includeNameInStory}
                  onChange={(e) => setIncludeNameInStory(e.target.checked)}
                  style={{margin: 0, cursor: 'pointer', width: 'auto'}}
                />
                Include name as main character
              </label>
            </div>

            {/* Story Prompt */}
            <div className="form-group">
              <label htmlFor="customPrompt">
                What would you like this story to be about?
              </label>
              <div className="prompt-container">
                <textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows="3"
                  placeholder="The more elaborate the better..."
                  className="prompt-textarea"
                />
                <button 
                  type="button" 
                  className="info-btn tips-btn" 
                  onClick={() => alert('Tips:\n• Be specific about the setting (e.g., "underwater kingdom", "space station")\n• Include your child\'s interests (e.g., "dinosaurs who love pizza")\n• Add a lesson or moral (e.g., "about sharing", "being brave")\n• Mention favorite characters or themes\n• The more detail, the better the story!')}
                  title="Click for story tips"
                  style={{marginTop: '8px', background: 'none', border: 'none', color: '#667eea', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}
                >
                  💡 Tips
                </button>
                <button
                  type="button"
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleVoiceRecord}
                  title={isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {isRecording ? (
                    <>
                      <div className="voice-wave">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="rec-label">REC</span>
                    </>
                  ) : (
                    <span className="mic-icon">🎤</span>
                  )}
                </button>
              </div>
            </div>

            {/* Reading Level - MOVED UP */}
            <div className="form-group">
              <label htmlFor="readingLevel">Reading Level *</label>
              <select
                id="readingLevel"
                className="form-select"
                value={readingLevel}
                onChange={(e) => setReadingLevel(e.target.value)}
                required
              >
                <option value="pre-reader">Pre-Reader (ages 3–6)</option>
                <option value="early-phonics">Early Phonics Reader (ages 4–7)</option>
                <option value="beginning-reader">Beginning Reader (ages 5–8)</option>
                <option value="developing-reader">Developing Reader (ages 6–10)</option>
                <option value="fluent-reader">Fluent Reader (ages 8–13)</option>
                <option value="insightful-reader">Insightful Reader (ages 10–16+)</option>
              </select>
            </div>

            {/* Theme Selection - MOVED DOWN */}
            <div className="form-group">
              <label>Add a theme or topic</label>
              <div className="theme-grid">
                {getAvailableThemes().map(theme => (
                  <div
                    key={theme.id}
                    className={`theme-option ${selectedThemes.includes(theme.id) ? 'selected' : ''}`}
                    onClick={() => toggleTheme(theme.id)}
                  >
                    <span className="theme-emoji">{theme.emoji}</span>
                    <span className="theme-label">{theme.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration Style - CONVERTED TO DROPDOWN */}
            <div className="form-group">
              <label htmlFor="imageStyle">
                Illustration Style 🎨
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="imageStyle"
                  className="form-select"
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                >
                  {getImageStyles().map(style => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  pointerEvents: 'none'
                }}>
                  {getImageStyles().find(s => s.id === imageStyle)?.icon || '✨'}
                </span>
              </div>
            </div>

            {/* Story Length */}
            <div className="form-group">
              <label htmlFor="storyLength">Story Length *</label>
              <select
                id="storyLength"
                className="form-select"
                value={storyLength}
                onChange={(e) => setStoryLength(e.target.value)}
                required
              >
                {STORY_LENGTHS.map(length => (
                  <option key={length.id} value={length.id}>
                    {length.label}
                  </option>
                ))}
              </select>
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
            
            {/* Plan Status */}
            {user && (
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
            maxWidth: '900px',
            margin: '20px auto 0',
            width: '100%'
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
                    onClick={() => window.location.href = '/pricing-new.html'}
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
        <footer className="footer">
          <p>
            <a href="/pricing-new.html" target="_blank">Pricing</a> | 
            <a href="/terms.html" target="_blank">Terms of Service</a> | 
            <a href="/privacy.html" target="_blank">Privacy Policy</a> | 
            <a href="mailto:support@kidsstorytime.ai">Contact Us</a>
          </p>
          <p>&copy; 2025 Kids Story Time.</p>
          <p>All rights reserved.</p>
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
          onClose={() => setShowProfileManager(false)}
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
          childProfile={selectedChildProfile}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Star Rewards System Modal */}
      {showRewards && (
        <div className="auth-modal">
          <div className="auth-content" style={{ maxWidth: '900px' }}>
            <button 
              className="auth-close" 
              onClick={() => setShowRewards(false)}
            >
              ×
            </button>
            <StarRewardsSystem
              childProfile={selectedChildProfile}
              stars={starPoints}
              setStars={setStarPoints}
              onClose={() => setShowRewards(false)}
            />
          </div>
        </div>
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
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Set Timer (minutes):
        </label>
        <select
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
    </div>
  );
}

// Old AuthModal component removed - now using AuthenticationManager

export default App;