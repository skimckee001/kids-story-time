import { useState, useEffect } from 'react';
import { supabase, auth } from './lib/supabase';
import StoryDisplay from './components/StoryDisplay';
import './App.css';

// Theme options matching the original
const THEMES = [
  { id: 'adventure', label: 'Adventure 🗺️', emoji: '🗺️' },
  { id: 'fairytale', label: 'Fairy Tale 🏰', emoji: '🏰' },
  { id: 'educational', label: 'Educational 📚', emoji: '📚' },
  { id: 'bedtime', label: 'Bedtime 🌙', emoji: '🌙' },
  { id: 'friendship', label: 'Friendship 🤝', emoji: '🤝' },
  { id: 'animals', label: 'Animals 🦁', emoji: '🦁' },
  { id: 'space', label: 'Space 🚀', emoji: '🚀' },
  { id: 'underwater', label: 'Underwater 🐠', emoji: '🐠' },
  { id: 'fantasy', label: 'Fantasy 🧙‍♂️', emoji: '🧙‍♂️' },
  { id: 'mystery', label: 'Mystery 🔍', emoji: '🔍' }
];

const STORY_LENGTHS = [
  { id: 'short', label: 'Short (2-3 min)', minutes: 2 },
  { id: 'medium', label: 'Medium (5-7 min)', minutes: 5 },
  { id: 'long', label: 'Long (10+ min)', minutes: 10 }
];

function App() {
  // Form state
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [storyLength, setStoryLength] = useState('medium');
  const [moralLesson, setMoralLesson] = useState('');
  const [favoriteThings, setFavoriteThings] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [showStory, setShowStory] = useState(false);
  
  useEffect(() => {
    // Check for user session
    checkUser();
    
    // Check if first visit
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // Check subscription
      const { data } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setSubscriptionTier(data.tier);
      }
    }
  };

  const handleGenerateStory = async (e) => {
    e.preventDefault();
    
    if (!childName || !childAge || !selectedTheme) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);

    try {
      // Call the story generation API (use port 9000 for local dev)
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:9000/.netlify/functions/generate-story'
        : '/.netlify/functions/generate-story';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName,
          childAge,
          theme: selectedTheme,
          length: storyLength,
          moralLesson,
          favoriteThings,
          subscriptionTier
        })
      });

      const data = await response.json();
      
      if (data.story) {
        // Set the current story and show the story display
        setCurrentStory({
          ...data.story,
          childName,
          theme: selectedTheme
        });
        setShowStory(true);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      alert('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // If showing story, display the story component
  if (showStory && currentStory) {
    return (
      <StoryDisplay 
        story={currentStory}
        onBack={() => {
          setShowStory(false);
          setCurrentStory(null);
          // Reset form
          setChildName('');
          setChildAge('');
          setSelectedTheme('');
          setMoralLesson('');
          setFavoriteThings('');
        }}
        onSave={() => {
          // Story saved successfully
          console.log('Story saved');
        }}
      />
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="container">
        <div className="header">
          <div className="logo">📚 Kids Story Time</div>
          <div className="tagline">Create magical stories for your children</div>
        </div>

        {/* Account Section */}
        {!user && (
          <div className="account-section">
            <h3>🎉 Create Your Free Account</h3>
            <p>Save your stories and unlock premium features!</p>
            <div className="account-buttons">
              <button 
                className="account-btn signup-btn"
                onClick={() => setShowAuth(true)}
              >
                Sign Up Free
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
          <h2>Create Your Story ✨</h2>
          
          <form onSubmit={handleGenerateStory}>
            {/* Child's Name */}
            <div className="form-group">
              <label htmlFor="childName">Child's Name *</label>
              <input
                type="text"
                id="childName"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Enter your child's name"
                required
              />
            </div>

            {/* Child's Age */}
            <div className="form-group">
              <label htmlFor="childAge">Child's Age *</label>
              <input
                type="number"
                id="childAge"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                min="1"
                max="14"
                placeholder="Age"
                required
              />
            </div>

            {/* Theme Selection */}
            <div className="form-group">
              <label>Choose a Theme *</label>
              <div className="theme-grid">
                {THEMES.map(theme => (
                  <div
                    key={theme.id}
                    className={`theme-option ${selectedTheme === theme.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <span className="theme-emoji">{theme.emoji}</span>
                    <span className="theme-label">{theme.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Story Length */}
            <div className="form-group">
              <label>Story Length</label>
              <div className="length-options">
                {STORY_LENGTHS.map(length => (
                  <button
                    key={length.id}
                    type="button"
                    className={`length-option ${storyLength === length.id ? 'selected' : ''}`}
                    onClick={() => setStoryLength(length.id)}
                  >
                    {length.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Moral Lesson */}
            <div className="form-group">
              <label htmlFor="moralLesson">Moral Lesson (Optional)</label>
              <input
                type="text"
                id="moralLesson"
                value={moralLesson}
                onChange={(e) => setMoralLesson(e.target.value)}
                placeholder="e.g., Sharing is caring, Be kind to others"
              />
            </div>

            {/* Favorite Things */}
            <div className="form-group">
              <label htmlFor="favoriteThings">Child's Favorite Things (Optional)</label>
              <textarea
                id="favoriteThings"
                value={favoriteThings}
                onChange={(e) => setFavoriteThings(e.target.value)}
                placeholder="e.g., dinosaurs, rainbows, trucks, princesses"
                rows="3"
              />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              className={`generate-btn ${isGenerating ? 'generating' : ''}`}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Creating Your Story...
                </>
              ) : (
                '✨ Create Story'
              )}
            </button>
          </form>

          {/* Navigation */}
          <div className="nav-buttons">
            <button 
              className="nav-btn"
              onClick={() => window.location.href = '/story-library.html'}
            >
              📚 My Library
            </button>
            <button 
              className="nav-btn"
              onClick={() => window.location.href = '/profile.html'}
            >
              👤 Profile
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2024 Kids Story Time. Made with ❤️ for families everywhere.</p>
          <div className="footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="mailto:support@kidsstorytime.org">Contact</a>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={checkUser} />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

// Auth Modal Component
function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        alert('Check your email to confirm your account!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test account login
  const loginTestAccount = async (tier) => {
    const accounts = {
      free: { email: 'test-free@kidsstorytime.org', password: 'testpass123' },
      premium: { email: 'test-premium@kidsstorytime.org', password: 'testpass123' },
      family: { email: 'test-family@kidsstorytime.org', password: 'testpass123' }
    };

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(accounts[tier]);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      alert('Test account not available. Please create a new account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>

        {isLogin && (
          <div className="test-accounts">
            <p>Quick Test Login:</p>
            <div className="test-buttons">
              <button onClick={() => loginTestAccount('free')}>Free</button>
              <button onClick={() => loginTestAccount('premium')}>Premium</button>
              <button onClick={() => loginTestAccount('family')}>Family</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Onboarding Modal Component
function OnboardingModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h1>Welcome to Kids Story Time! 🎉</h1>
        
        <div className="feature-grid">
          <div className="feature">
            <span className="feature-icon">✨</span>
            <h3>AI-Powered Stories</h3>
            <p>Unique stories created just for your child</p>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🎨</span>
            <h3>Beautiful Images</h3>
            <p>Every story comes with magical illustrations</p>
          </div>
          
          <div className="feature">
            <span className="feature-icon">📚</span>
            <h3>Save & Share</h3>
            <p>Build your library and share with family</p>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <h3>Age Appropriate</h3>
            <p>Content tailored to your child's age</p>
          </div>
        </div>
        
        <button className="get-started-btn" onClick={onClose}>
          Get Started!
        </button>
      </div>
    </div>
  );
}

export default App;