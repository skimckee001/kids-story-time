import { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import StoryDisplay from './components/StoryDisplay';
import StoryLibrary from './components/StoryLibrary';
import ProfileManager from './components/ProfileManager';
import AchievementSystem from './components/AchievementSystem';
import ReadingStreak from './components/ReadingStreak';
import StarRewardsSystem, { addStarsToChild } from './components/StarRewardsSystem';
import ParentDashboard from './components/ParentDashboard';
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
  const [gender, setGender] = useState('');
  const [includeNameInStory, setIncludeNameInStory] = useState(true);
  const [readingLevel, setReadingLevel] = useState('developing-reader');
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [storyLength, setStoryLength] = useState('extended');
  const [customPrompt, setCustomPrompt] = useState('');
  const [storyContext, setStoryContext] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [storiesRemaining, setStoriesRemaining] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [starPoints, setStarPoints] = useState(0);
  const [selectedChildProfile, setSelectedChildProfile] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    checkUser();
    // Load saved profile if exists
    const savedProfile = localStorage.getItem('selectedChildProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setSelectedChildProfile(profile);
      // Auto-populate form with profile data
      setChildName(profile.name || '');
      setGender(profile.gender === 'male' ? 'boy' : profile.gender === 'female' ? 'girl' : '');
      setIncludeNameInStory(profile.include_name_in_stories !== false);
      setReadingLevel(profile.reading_level || 'developing-reader');
      setSelectedThemes(profile.favorite_themes || []);
      
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
    }
  }, []);

  const checkUser = async () => {
    try {
      // Check for mock user in localStorage (for testing)
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        const userData = JSON.parse(mockUser);
        setUser(userData);
        setSubscriptionTier(userData.tier || 'free');
        const limit = userData.tier === 'free' ? 1 : 
                     userData.tier === 'premium' ? 10 : 1000;
        setStoriesRemaining(limit);
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
          setSubscriptionTier(profile.subscription_tier || 'free');
          const limit = profile.subscription_tier === 'free' ? 1 : 
                       profile.subscription_tier === 'premium' ? 10 : 1000;
          setStoriesRemaining(limit - (profile.daily_stories_count || 0));
        }
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

  const handleGenerateStory = async (e) => {
    e.preventDefault();
    
    if (!childName || !readingLevel) {
      alert('Please enter child\'s name and select reading level');
      return;
    }

    if (storiesRemaining <= 0 && subscriptionTier === 'free') {
      alert('You\'ve reached your daily limit. Upgrade to Premium for more stories!');
      return;
    }

    setIsGenerating(true);

    try {
      // Call the story generation API
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:9000/.netlify/functions/generate-story'
        : '/.netlify/functions/generate-story';
      
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
          gender,
          customPrompt,
          storyContext,
          includeNameInStory,
          subscriptionTier
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
        
        // Generate image asynchronously for premium and family tiers
        if (subscriptionTier === 'premium' || subscriptionTier === 'family') {
          console.log('Generating image for tier:', subscriptionTier);
          
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
              tier: subscriptionTier === 'family' ? 'pro' : 'premium'
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
              // Update the story with the image URL
              setCurrentStory(prev => {
                const updatedStory = {
                  ...prev,
                  imageUrl: imageUrl
                };
                // Update saved story with image URL
                if (user && prev.savedId) {
                  updateSavedStoryImage(prev.savedId, imageUrl);
                }
                return updatedStory;
              });
            }
          })
          .catch(error => {
            console.error('Image generation failed:', error);
          });
        }
        
        // Update stories remaining
        if (subscriptionTier === 'free') {
          setStoriesRemaining(prev => Math.max(0, prev - 1));
        }
        
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
          setGender('');
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
      <div className="container">
        {/* Header */}
        <header className="header-container">
          <div className="header-content">
            <div className="header-left">
              <div className="logo-icon">
                <span>📚</span>
              </div>
              <div className="logo-text">
                KidsStoryTime<span className="logo-domain">.org</span>
              </div>
            </div>
            <div className="header-right">
              {user ? (
                <>
                  <div className="star-display">
                    <span className="star-icon">⭐</span>
                    <span className="star-count">{starPoints}</span>
                  </div>
                  <button 
                    className="header-btn"
                    onClick={() => setShowProfileManager(true)}
                    title="Manage child profiles"
                  >
                    👤 Profiles
                  </button>
                  <button 
                    className="header-btn"
                    onClick={() => setShowAchievements(true)}
                    title="View achievements"
                  >
                    🏆 Achievements
                  </button>
                  <button 
                    className="header-btn"
                    onClick={() => setShowRewards(true)}
                    title="Star rewards shop"
                  >
                    ⭐ Rewards
                  </button>
                  <button 
                    className="header-btn library-btn"
                    onClick={() => setShowLibrary(true)}
                  >
                    📖 My Library
                  </button>
                  <button 
                    className="header-btn"
                    onClick={() => setShowDashboard(true)}
                    title="Parent dashboard"
                  >
                    📊 Dashboard
                  </button>
                  {subscriptionTier === 'free' && (
                    <button className="header-btn trial-btn">
                      🎉 Start Free Trial
                      <div className="trial-tooltip">
                        Free for first month! All premium features unlocked
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    className="header-btn library-btn"
                    onClick={() => setShowAuth(true)}
                  >
                    📖 My Library
                  </button>
                  <button className="header-btn trial-btn" onClick={() => setShowAuth(true)}>
                    🎉 Start Free Trial
                    <div className="trial-tooltip">
                      Free for first month! All premium features unlocked
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="tagline">Personalized stories and illustrations for your child</div>
          
          {/* Beta Banner */}
          <div className="beta-banner">
            <div className="beta-title">🎉 FREE BETA - All Premium Features Unlocked!</div>
            <div className="beta-subtitle">Create unlimited stories, export to PDF, and enjoy all features completely free during our launch period</div>
          </div>
        </header>

        {/* Account Section for non-logged in users */}
        {!user && (
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
            <ReadingStreak childProfile={selectedChildProfile} />
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
                  placeholder="Enter your child's name"
                  required
                  className="name-input"
                />
                <div className="gender-buttons">
                  <button
                    type="button"
                    className={`gender-btn ${gender === 'boy' ? 'active' : ''}`}
                    onClick={() => setGender('boy')}
                  >
                    🧑 Boy
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${gender === 'girl' ? 'active' : ''}`}
                    onClick={() => setGender('girl')}
                  >
                    👩 Girl
                  </button>
                </div>
              </div>
              <label className="include-name-label">
                <input
                  type="checkbox"
                  checked={includeNameInStory}
                  onChange={(e) => setIncludeNameInStory(e.target.checked)}
                />
                <span style={{fontWeight: 'normal'}}>Include child's name as main character in story</span>
              </label>
            </div>

            {/* Story Prompt */}
            <div className="form-group">
              <label htmlFor="customPrompt">
                What would you like this story to be about?
                <button type="button" className="info-btn" title="Click for examples">ℹ️</button>
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

            {/* Theme Selection */}
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

            {/* Reading Level */}
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
              {isGenerating ? 'Creating your magical story...' : 'Generate My Story! ✨'}
            </button>
            
            {/* Plan Status */}
            {user && (
              <div style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '14px',
                color: '#666'
              }}>
                {subscriptionTier === 'free' ? 
                  <>Free Plan: {storiesRemaining} story remaining today</> :
                 subscriptionTier === 'premium' ? 
                  <>Premium Plan: {storiesRemaining} stories remaining today</> :
                  <>Family Plan: Unlimited stories</>
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
                  onClick={() => !user ? setShowAuth(true) : window.location.href = '/pricing'}
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
                    <>🎉 Start Free - Create Your Account</>
                  ) : subscriptionTier === 'free' ? (
                    <>⭐ Upgrade to Premium - 30 Day Free Trial</>
                  ) : (
                    <>👨‍👩‍👧‍👦 Upgrade to Family Plan - Unlimited Everything</>
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
                  ) : subscriptionTier === 'free' ? (
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
                        30-day free trial • Cancel anytime • $9.99/month after trial
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
                        Best value • $19.99/month • Perfect for multiple children
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
            <a href="mailto:support@kidsstorytime.org">Contact Us</a>
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
            setGender(profile.gender === 'male' ? 'boy' : profile.gender === 'female' ? 'girl' : '');
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
              onRewardUnlocked={(reward) => {
                console.log('Reward unlocked:', reward);
              }}
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
                email: 'test-free@kidsstorytime.org',
                tier: 'free'
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
                email: 'test-premium@kidsstorytime.org',
                tier: 'premium'
              };
              localStorage.setItem('mockUser', JSON.stringify(mockUser));
              onSuccess(mockUser);
            }}
            disabled={loading}
          >
            Test Premium
          </button>
          <button 
            className="test-login-btn test-family"
            onClick={() => {
              const mockUser = {
                id: 'test-family',
                email: 'test-family@kidsstorytime.org',
                tier: 'family'
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