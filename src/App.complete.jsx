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
import { getTierLimits, canGenerateStory, canUseAIIllustration, getUpgradeMessage } from './utils/subscriptionTiers';
import './App.original.css';
import './styles/ageThemes.css';

// Story length options matching the current HTML
const STORY_LENGTHS = [
  { id: 'short', label: 'Short (2-3 minutes)' },
  { id: 'medium', label: 'Medium (5-7 minutes)' },
  { id: 'long', label: 'Long (10-15 minutes)' },
  { id: 'extended', label: 'Extended (20 minutes)' },
  { id: 'long-extended', label: 'Long Extended (30 minutes)' },
  { id: 'extra-long', label: 'Extra Long (45 minutes)' }
];

// Dynamic themes based on reading level
const THEMES_BY_LEVEL = {
  'pre-reader': [
    { id: 'animals', label: 'Animals', emoji: '🐻' },
    { id: 'colors', label: 'Colors', emoji: '🌈' },
    { id: 'shapes', label: 'Shapes', emoji: '⭐' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { id: 'nature', label: 'Nature', emoji: '🌳' },
    { id: 'vehicles', label: 'Vehicles', emoji: '🚗' }
  ],
  'early-phonics': [
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
    { id: 'animals', label: 'Animals', emoji: '🦁' },
    { id: 'friendship', label: 'Friendship', emoji: '🤝' },
    { id: 'fairytale', label: 'Fairy Tale', emoji: '🏰' },
    { id: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
    { id: 'ocean', label: 'Ocean', emoji: '🌊' }
  ],
  'beginning-reader': [
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery', emoji: '🔍' },
    { id: 'space', label: 'Space', emoji: '🚀' },
    { id: 'superheroes', label: 'Superheroes', emoji: '🦸' },
    { id: 'magic', label: 'Magic', emoji: '✨' },
    { id: 'sports', label: 'Sports', emoji: '⚽' }
  ],
  'developing-reader': [
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery', emoji: '🔍' },
    { id: 'fantasy', label: 'Fantasy', emoji: '🧙‍♂️' },
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'friendship', label: 'Friendship', emoji: '🤝' },
    { id: 'history', label: 'History', emoji: '📜' }
  ],
  'fluent-reader': [
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
    { id: 'mystery', label: 'Mystery', emoji: '🔍' },
    { id: 'fantasy', label: 'Fantasy', emoji: '🧙‍♂️' },
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'mythology', label: 'Mythology', emoji: '⚡' },
    { id: 'time-travel', label: 'Time Travel', emoji: '⏰' }
  ],
  'insightful-reader': [
    { id: 'dystopian', label: 'Dystopian', emoji: '🌆' },
    { id: 'philosophy', label: 'Philosophy', emoji: '💭' },
    { id: 'mystery', label: 'Mystery', emoji: '🔍' },
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'historical', label: 'Historical', emoji: '📜' },
    { id: 'psychological', label: 'Psychological', emoji: '🧠' }
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
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
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
  const [achievementCount, setAchievementCount] = useState(0);
  const [showStripeTest, setShowStripeTest] = useState(false);
  const { triggerCelebration, CelebrationComponent } = useCelebration();

  useEffect(() => {
    // Click outside handler for dropdown menu
    const handleClickOutside = (event) => {
      if (!event.target.closest('.more-menu-container')) {
        setShowMoreMenu(false);
      }
    };
    
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreMenu]);
  
  // Apply age-based theme based on reading level
  useEffect(() => {
    const applyTheme = () => {
      const appElement = document.querySelector('.app');
      if (!appElement) return;
      
      // Remove existing theme classes
      appElement.classList.remove('theme-young', 'theme-middle', 'theme-older');
      
      // Add appropriate theme class based on reading level
      let themeClass = 'theme-middle'; // default
      
      if (['pre-reader', 'early-phonics'].includes(readingLevel)) {
        themeClass = 'theme-young';
      } else if (['beginning-reader', 'developing-reader'].includes(readingLevel)) {
        themeClass = 'theme-middle';
      } else if (['fluent-reader', 'insightful-reader'].includes(readingLevel)) {
        themeClass = 'theme-older';
      }
      
      appElement.classList.add(themeClass);
      appElement.classList.add('theme-transition');
      
      // Save theme preference
      localStorage.setItem('preferredTheme', themeClass);
    };
    
    applyTheme();
  }, [readingLevel]);
  
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
  }, []);

  const checkUser = async () => {
    try {
      // Check for mock user in localStorage (for testing)
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
        
        setUser(userData);
        const tier = userData.tier || 'reader-free';
        setSubscriptionTier(tier);
        const limits = getTierLimits(tier, userData);
        setStoriesRemaining(limits.dailyStories);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Check subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, daily_stories_count')
          .eq('id', user.id)
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
        description: 'Auto-selects best style',
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
        prompt: 'photorealistic, detailed, natural lighting',
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
          
          const imagePrompt = data.story.title ? 
            `${data.story.title}. Child-friendly, colorful illustration. ${selectedThemeLabels} theme` :
            `A magical story illustration for children. ${selectedThemeLabels} theme`;
          
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
              prompt: imagePrompt,
              style: 'illustration',
              mood: 'cheerful',
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
          setShowAuth(true);
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
          </div>
          <div className="tagline">Join thousands of families creating magical bedtime moments</div>
          
          {/* Beta Banner */}
          <div className="beta-banner">
            <div className="beta-title">🎉 LAUNCH SPECIAL - First Month FREE on All Plans!</div>
            <div className="beta-subtitle">Try our Story Maker or Family plans risk-free for 30 days</div>
          </div>
          
          {/* Navigation Bar */}
          <div className="header-content" style={{marginTop: '1rem'}}>
            <div className="header-right" style={{width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', minHeight: 'auto'}}>
              {user ? (
                <>
                  {/* Star Bank - Currency System */}
                  <button 
                    className="star-bank"
                    onClick={() => setShowRewards(true)}
                    title="Star Shop - Spend your stars!"
                    aria-label="Star shop with {starPoints} stars"
                  >
                    <span className="currency-icon">💰</span>
                    <span className="currency-value">{starPoints}</span>
                    <span className="currency-label">Stars</span>
                  </button>
                  
                  {/* Trophy Room - Achievement System */}
                  <button 
                    className="trophy-room"
                    onClick={() => setShowAchievements(true)}
                    title="Badge Collection - View your achievements!"
                    aria-label="View {achievementCount || 0} achievements"
                  >
                    <span className="trophy-icon">🏆</span>
                    <span className="trophy-count">{achievementCount || 0}/48</span>
                    <span className="trophy-label">Badges</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={() => setShowLibrary(true)}
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto'}}
                  >
                    📚 Library
                  </button>
                  
                  {/* More Menu Dropdown */}
                  <div className="more-menu-container">
                    <button 
                      className="header-btn more-btn"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                      ⋯ More
                    </button>
                    {showMoreMenu && (
                      <div className="dropdown-menu">
                        <button onClick={() => { setShowProfileManager(true); setShowMoreMenu(false); }}>
                          👤 Manage Profiles
                        </button>
                        <button onClick={() => { setShowDashboard(true); setShowMoreMenu(false); }}>
                          📈 Parent Dashboard
                        </button>
                        <button onClick={() => { window.open('/pricing-new.html', '_blank'); setShowMoreMenu(false); }}>
                          💰 View Plans
                        </button>
                        <div className="dropdown-divider"></div>
                        <BedtimeMode 
                          isActive={bedtimeModeActive}
                          onToggle={(active) => {
                            setBedtimeModeActive(active);
                            setShowMoreMenu(false);
                          }}
                          onTimeout={() => {
                            setBedtimeModeActive(false);
                            alert('Bedtime! Sweet dreams! 🌙');
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {(subscriptionTier === 'reader-free' || subscriptionTier === 'story-maker-basic') && storiesRemaining <= 1 && (
                    <button 
                      className="header-btn trial-btn"
                      onClick={() => setShowAuth(true)}
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
                  <div 
                    className="star-bank"
                    title="Create an account to start earning stars!"
                    style={{ cursor: 'help', opacity: 0.7 }}
                  >
                    <span className="currency-icon">💰</span>
                    <span className="currency-value">0</span>
                    <span className="currency-label">Stars</span>
                  </div>
                  
                  <button 
                    className="trophy-room"
                    onClick={() => setShowAuth(true)}
                    title="Sign up to unlock badges!"
                    style={{ opacity: 0.7 }}
                  >
                    <span className="trophy-icon">🏆</span>
                    <span className="trophy-count">0/48</span>
                    <span className="trophy-label">Badges</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={() => setShowAuth(true)}
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto'}}
                  >
                    📚 Library
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={() => window.open('/pricing-new.html', '_blank')}
                    style={{flex: '0 0 auto'}}
                  >
                    💰 Plans
                  </button>
                  
                  <button 
                    className="header-btn trial-btn" 
                    onClick={() => {
                      // Scroll to the story generation form
                      const formElement = document.querySelector('.main-content');
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    ✨ Create Your First Story
                    <div className="trial-tooltip">
                      Try it free! No signup required
                    </div>
                  </button>
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
                onClick={() => setShowAuth(true)}
              >
                Create Free Account
              </button>
              <button 
                className="account-btn login-btn"
                onClick={() => setShowAuth(true)}
              >
                Login
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="main-content">
          {/* Reading Streak Display - only show if profile selected */}
          {selectedChildProfile && (
            <>
              <ReadingStreak childProfile={selectedChildProfile} />
            </>
          )}
          
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
                <button 
                  type="button" 
                  className="info-btn" 
                  onClick={() => alert('Tips:\n• Be specific about the setting (e.g., "underwater kingdom", "space station")\n• Include your child\'s interests (e.g., "dinosaurs who love pizza")\n• Add a lesson or moral (e.g., "about sharing", "being brave")\n• Mention favorite characters or themes\n• The more detail, the better the story!')}
                  title="Click for story tips"
                  style={{color: '#667eea', fontWeight: '600', cursor: 'pointer'}}
                >
                  💡 Tips
                </button>
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
              <label>Would you like to add a theme for this story?</label>
              <p className="theme-subtitle">Pick one or more themes to make it extra special - Optional</p>
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
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                  (Smart Choice auto-selects based on age)
                </span>
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
                      {style.label} - {style.description}
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
               !user ? 'Create Your First Story! ✨' : 'Generate My Story! ✨'}
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
                 subscriptionTier === 'story-maker-basic' ?
                  <>Story Maker: {storiesRemaining} stories remaining today</> :
                 subscriptionTier === 'family-plus' ?
                  <>Family Plan: {storiesRemaining} stories remaining today</> :
                  <>Premium Plan: Unlimited stories</>
                }
              </div>
            )}

            {/* Upgrade Section */}
            {(!user || subscriptionTier !== 'family') && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => !user ? setShowAuth(true) : window.location.href = '/pricing-new.html'}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {!user ? (
                    <>🎉 Save Your Story - Create Free Account</>
                  ) : (subscriptionTier === 'reader-free' || subscriptionTier === 'story-maker-basic') && storiesRemaining <= 1 ? (
                    <>⭐ Upgrade to {subscriptionTier === 'reader-free' ? 'Story Maker' : 'Family'} - First Month Free</>
                  ) : (subscriptionTier === 'story-maker-basic' || subscriptionTier === 'family-plus') ? (
                    <>👨‍👩‍👧‍👦 Upgrade to Family Plan - Unlimited Everything</>
                  ) : (
                    <>✨ Explore Premium Features</>
                  )}
                </button>

                <div style={{ fontSize: '14px', color: '#666' }}>
                  {!user ? (
                    <>
                      <p style={{ fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                        Register for free and unlock:
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>✅ Save all your stories in your personal library</li>
                        <li>✅ Create multiple child profiles</li>
                        <li>✅ Track reading streaks and achievements</li>
                        <li>✅ 1 free story per day</li>
                        <li>✅ Access to all story themes and lengths</li>
                      </ul>
                    </>
                  ) : subscriptionTier === 'reader-free' ? (
                    <>
                      <p style={{ fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                        Premium features include:
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>🎨 Beautiful AI-generated illustrations for every story</li>
                        <li>📚 10 stories per day (vs. 1 on free plan)</li>
                        <li>📄 Export stories as PDF to keep forever</li>
                        <li>🎧 Audio narration (coming soon)</li>
                        <li>⚡ Priority story generation</li>
                        <li>💾 Unlimited story storage</li>
                      </ul>
                      <p style={{ 
                        marginTop: '10px', 
                        fontSize: '13px', 
                        fontStyle: 'italic',
                        textAlign: 'center' 
                      }}>
                        Story Maker: $4.99/month • 10 stories/day • 30 AI images • Cancel anytime
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                        Family Plan extras:
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>♾️ Unlimited stories every day</li>
                        <li>👨‍👩‍👧‍👦 Up to 6 child profiles</li>
                        <li>🎨 Premium HD illustrations</li>
                        <li>📊 Advanced parent dashboard & analytics</li>
                        <li>🎯 Personalized learning paths</li>
                        <li>🌟 Early access to new features</li>
                      </ul>
                      <p style={{ 
                        marginTop: '10px', 
                        fontSize: '13px', 
                        fontStyle: 'italic',
                        textAlign: 'center' 
                      }}>
                        Family Plan: $7.99/month • 20 stories/day • Unlimited AI • Perfect for families
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </form>

        </div>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 Kids Story Time. All rights reserved.</p>
          <p>
            <a href="/terms.html" target="_blank">Terms of Service</a> | 
            <a href="/privacy.html" target="_blank">Privacy Policy</a> | 
            <a href="mailto:support@kidsstorytime.ai">Contact Us</a>
            {user && (
              <>
                {' | '}
                <a 
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    localStorage.removeItem('mockUser');
                    await supabase.auth.signOut();
                    setUser(null);
                    setSubscriptionTier('free');
                    setStoriesRemaining(1);
                    setSelectedChildProfile(null);
                  }}
                  style={{ color: '#999' }}
                >
                  Logout
                </a>
              </>
            )}
          </p>
        </footer>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)}
          onSuccess={(user) => {
            setUser(user);
            setShowAuth(false);
            checkUser();
          }}
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
      
      {/* Celebration Animations */}
      {CelebrationComponent}
      
      {/* Age Theme Indicator */}
      <div 
        className="age-indicator"
        onClick={() => {
          // Cycle through themes for testing
          const levels = ['pre-reader', 'early-phonics', 'beginning-reader', 'developing-reader', 'fluent-reader', 'insightful-reader'];
          const currentIndex = levels.indexOf(readingLevel);
          const nextIndex = (currentIndex + 1) % levels.length;
          setReadingLevel(levels[nextIndex]);
        }}
        title="Click to switch theme"
      >
        {readingLevel === 'pre-reader' || readingLevel === 'early-phonics' ? '🧸 Young Reader' :
         readingLevel === 'beginning-reader' || readingLevel === 'developing-reader' ? '📖 Growing Reader' :
         '🎓 Advanced Reader'}
      </div>
      
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

// Auth Modal Component
function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              child_name: childName,
            }
          }
        });
        if (error) throw error;
        onSuccess(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>×</button>
        <h2 className="auth-title">{isLogin ? 'Welcome Back!' : 'Create Your Free Account'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
            className="auth-input"
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Child's name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
              className="auth-input"
            />
          )}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>

        {/* Quick Test Logins */}
        <div className="auth-divider">or</div>
        <div className="test-logins">
          <button 
            className="test-login-btn test-free"
            onClick={() => {
              const mockUser = {
                id: 'test-free',
                email: 'test-free@kidsstorytime.ai',
                tier: 'reader-free'
              };
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
              onSuccess(mockUser);
            }}
            disabled={loading}
          >
            Test Free
          </button>
          <button 
            className="test-login-btn test-premium"
            onClick={() => {
              const mockUser = {
                id: 'test-premium',
                email: 'test-premium@kidsstorytime.ai',
                tier: 'story-maker-basic'  // Story Maker Basic tier with AI images
              };
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
              onSuccess(mockUser);
            }}
            disabled={loading}
          >
            Test Premium (Story Maker)
          </button>
          <button 
            className="test-login-btn test-family"
            onClick={() => {
              const mockUser = {
                id: 'test-family',
                email: 'test-family@kidsstorytime.ai',
                tier: 'family-plus'
              };
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
              onSuccess(mockUser);
            }}
            disabled={loading}
          >
            Test Family
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;