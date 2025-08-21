import { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import StoryDisplay from './components/StoryDisplay';
import StoryLibrary from './components/StoryLibrary';
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
  const [currentStory, setCurrentStory] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [storiesRemaining, setStoriesRemaining] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [starPoints, setStarPoints] = useState(0);

  useEffect(() => {
    checkUser();
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
        
        // Auto-save story for logged-in users
        if (user) {
          saveStoryToLibrary(storyData);
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
                    className="header-btn library-btn"
                    onClick={() => setShowLibrary(true)}
                  >
                    📖 My Library
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

        {/* User Navigation */}
        {user ? (
          <div className="user-nav">
            <div className="welcome-section">
              <h3>Welcome back!</h3>
              <p className="plan-status">
                {subscriptionTier === 'free' ? (
                  <>Free Plan: <strong>{storiesRemaining}</strong> story remaining today</>
                ) : subscriptionTier === 'premium' ? (
                  <>Premium Plan: <strong>{storiesRemaining}</strong> stories remaining today</>
                ) : (
                  <>Family Plan: Unlimited stories</>
                )}
              </p>
            </div>
            <div className="nav-buttons">
              <button 
                className="nav-btn library-btn"
                onClick={() => setShowLibrary(true)}
              >
                📚 My Library
              </button>
              {subscriptionTier === 'free' && (
                <button className="nav-btn upgrade-btn">
                  🎉 Start Free Trial
                </button>
              )}
              <button 
                className="nav-btn logout-btn"
                onClick={async () => {
                  localStorage.removeItem('mockUser');
                  await supabase.auth.signOut();
                  setUser(null);
                  setSubscriptionTier('free');
                  setStoriesRemaining(1);
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
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
          <form onSubmit={handleGenerateStory}>
            {/* Child's Name and Gender */}
            <div className="form-group">
              <label htmlFor="childName">Child's Name</label>
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
          </form>

        </div>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2025 Kids Story Time. All rights reserved.</p>
          <p>
            <a href="/terms.html" target="_blank">Terms of Service</a> | 
            <a href="/privacy.html" target="_blank">Privacy Policy</a> | 
            <a href="mailto:support@kidsstorytime.org">Contact Us</a>
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