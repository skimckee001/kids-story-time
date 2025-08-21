import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import AdSense from './AdSense';
import './StoryDisplay.css';
import '../App.original.css';

function StoryDisplay({ story, onBack, onSave, onShowLibrary, user, subscriptionTier, starPoints }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState(null);
  const [readingSpeed, setReadingSpeed] = useState(0.9);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showReadAloudPanel, setShowReadAloudPanel] = useState(false);
  const [voiceLoadError, setVoiceLoadError] = useState(false);

  useEffect(() => {
    // Check if story is already saved (or auto-saved)
    if (story?.savedId) {
      setIsSaved(true);
    } else {
      checkIfSaved();
    }
    
    // Load available voices
    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        setAvailableVoices(englishVoices);
        
        // Prioritize child-friendly voices
        const priorityVoices = [
          'Google US English Female',
          'Google UK English Female', 
          'Microsoft Zira',
          'Samantha',
          'Victoria',
          'Karen',
          'Female'
        ];
        
        const preferredVoice = englishVoices.find(voice => 
          priorityVoices.some(name => voice.name.includes(name))
        ) || englishVoices[0];
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
          setVoiceLoadError(false);
        } else if (englishVoices.length === 0) {
          setVoiceLoadError(true);
        }
      } catch (error) {
        console.error('Error loading voices:', error);
        setVoiceLoadError(true);
      }
    };
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
    
    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [story]);

  const checkIfSaved = async () => {
    if (!story?.id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('stories')
      .select('id')
      .eq('id', story.id)
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setIsSaved(true);
    }
  };

  const handleSaveStory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to save stories');
      return;
    }

    setIsSaving(true);
    try {
      const storyData = {
        title: story.title,
        content: story.content,
        child_name: story.childName,
        theme: story.theme,
        image_url: story.imageUrl,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stories')
        .insert(storyData);

      if (error) throw error;
      
      setIsSaved(true);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to save story');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleReadAloud = () => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in your browser. Please try a different browser like Chrome, Safari, or Edge.');
      return;
    }
    
    if (voiceLoadError) {
      alert('Voice synthesis is not available. Please check your browser settings or try a different browser.');
      return;
    }
    
    setShowReadAloudPanel(!showReadAloudPanel);
    
    // If turning off the panel while reading, stop
    if (showReadAloudPanel && isReading) {
      handleStopReading();
    }
  };
  
  const handleStartReading = () => {
    try {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const textToRead = `${story.title}. ${story.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Configure voice settings
      utterance.rate = readingSpeed;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      // Set selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        setIsReading(true);
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        setIsReading(false);
        setIsPaused(false);
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          setIsReading(false);
          setIsPaused(false);
          console.error('Speech error:', event);
          // Fallback: try with default voice
          if (selectedVoice && event.error === 'voice-unavailable') {
            setSelectedVoice(null);
            handleStartReading();
          }
        }
      };
      
      utterance.onpause = () => {
        setIsPaused(true);
      };
      
      utterance.onresume = () => {
        setIsPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setSpeechUtterance(utterance);
    } catch (error) {
      console.error('Error starting speech:', error);
      alert('Unable to start reading. Please try again.');
    }
  };
  
  const handlePauseResume = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };
  
  const handleStopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setSpeechUtterance(null);
  };
  
  const handleVoiceChange = (voiceIndex) => {
    const newVoice = availableVoices[voiceIndex];
    setSelectedVoice(newVoice);
    
    // If currently reading, restart with new voice
    if (isReading) {
      handleStopReading();
      setTimeout(() => handleStartReading(), 100);
    }
  };
  
  const handleSpeedChange = (newSpeed) => {
    setReadingSpeed(newSpeed);
    // If currently reading, restart with new speed
    if (isReading) {
      handleStopReading();
      setTimeout(() => handleStartReading(), 100);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this amazing story: ${story.title}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(story.title)}&body=${encodeURIComponent(text + '\n\n' + url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
    setShowShareMenu(false);
  };

  const handleRating = (stars) => {
    setRating(stars);
    // Save rating to database
    saveRating(stars);
  };

  const saveRating = async (stars) => {
    if (!story?.id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('story_ratings')
        .upsert({
          story_id: story.id,
          user_id: user.id,
          rating: stars,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  if (!story) {
    return (
      <div className="story-display-container">
        <div className="no-story">
          <h2>No story to display</h2>
          <button onClick={onBack} className="back-btn">
            ← Create New Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="story-display-page">
      <div className="story-page-wrapper">
        {/* Main Header */}
        <Header 
          user={user}
          subscriptionTier={subscriptionTier}
          starPoints={starPoints}
          onShowLibrary={onBack}
          onShowAuth={() => {}}
        />
        
        <div className="story-display-container">
        <div className="story-wrapper">
          {/* Story Actions Bar */}
          <div className="story-header">
          <button onClick={onBack} className="back-btn">
            ← New Story
          </button>
          <div className="story-actions">
            <button 
              onClick={handleToggleReadAloud} 
              className={`read-aloud-btn ${showReadAloudPanel ? 'active' : ''}`}
              title="Read story aloud"
            >
              🔊 Read Aloud
            </button>
            <button onClick={handlePrint} className="print-btn">
              🖨️ Print
            </button>
            <div className="share-dropdown">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)} 
                className="share-btn"
              >
                📤 Share
              </button>
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={() => handleShare('facebook')}>Facebook</button>
                  <button onClick={() => handleShare('twitter')}>Twitter</button>
                  <button onClick={() => handleShare('whatsapp')}>WhatsApp</button>
                  <button onClick={() => handleShare('email')}>Email</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Read Aloud Control Panel */}
        {showReadAloudPanel && (
          <div className="read-aloud-panel">
            <div className="read-panel-content">
              {/* Voice Selection */}
              <div className="voice-control-group">
                <label>Voice:</label>
                <select 
                  value={availableVoices.indexOf(selectedVoice)}
                  onChange={(e) => handleVoiceChange(parseInt(e.target.value))}
                  className="voice-select"
                  disabled={isReading}
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((voice, index) => (
                      <option key={index} value={index}>
                        {voice.name.replace(/Microsoft|Google|Apple|/, '').trim()}
                      </option>
                    ))
                  ) : (
                    <option value="">Loading voices...</option>
                  )}
                </select>
              </div>

              {/* Speed Controls */}
              <div className="speed-control-group">
                <label>Speed:</label>
                <div className="speed-buttons">
                  <button 
                    onClick={() => handleSpeedChange(0.7)} 
                    className={`speed-btn ${readingSpeed === 0.7 ? 'active' : ''}`}
                    disabled={isReading}
                  >
                    Slow
                  </button>
                  <button 
                    onClick={() => handleSpeedChange(0.9)} 
                    className={`speed-btn ${readingSpeed === 0.9 ? 'active' : ''}`}
                    disabled={isReading}
                  >
                    Normal
                  </button>
                  <button 
                    onClick={() => handleSpeedChange(1.2)} 
                    className={`speed-btn ${readingSpeed === 1.2 ? 'active' : ''}`}
                    disabled={isReading}
                  >
                    Fast
                  </button>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="playback-controls">
                {!isReading ? (
                  <button onClick={handleStartReading} className="play-btn">
                    ▶️ Play
                  </button>
                ) : (
                  <>
                    <button onClick={handlePauseResume} className="pause-btn">
                      {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                    <button onClick={handleStopReading} className="stop-btn">
                      ⏹️ Stop
                    </button>
                  </>
                )}
              </div>

              {/* Status Indicator */}
              {isReading && (
                <div className="reading-status">
                  <span className="status-dot"></span>
                  {isPaused ? 'Paused' : 'Reading...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Story Content */}
        <div className="story-content-wrapper">
          <div className="story-card">
            {/* Title */}
            <h1 className="story-title">{story.title}</h1>
            
            {/* Story Text with Image */}
            <div className="story-text">
              {story.content.split('\n\n').map((paragraph, index, array) => {
                const midpoint = Math.floor(array.length / 2);
                return (
                  <div key={index}>
                    <p className="story-paragraph">
                      {paragraph}
                    </p>
                    {/* Show image or upgrade button after first paragraph */}
                    {index === 0 && (
                      <div className="story-image-float">
                        {(subscriptionTier === 'premium' || subscriptionTier === 'family') ? (
                          <div className="story-image-wrapper">
                            {story.imageUrl ? (
                              <img 
                                src={story.imageUrl} 
                                alt={story.title}
                                className="story-main-image"
                                onError={(e) => {
                                  e.target.parentElement.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="story-image-placeholder">
                                <div className="image-loading">
                                  <div className="loading-spinner"></div>
                                  <p>Generating illustration...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="upgrade-image-container">
                            <button className="generate-image-btn">
                              🎨 Register (free forever) to add an image
                              <div className="upgrade-tooltip">
                                <div className="tooltip-content">
                                  <h4>Create Your Free Account</h4>
                                  <p>Register for free to unlock images and save your stories!</p>
                                  <div className="tier-info">
                                    <div className="tier-option">
                                      <strong>Free Account</strong>
                                      <span>Forever Free</span>
                                    </div>
                                    <div className="tier-option">
                                      <strong>Premium</strong>
                                      <span>$9.99/month</span>
                                    </div>
                                    <div className="tier-option">
                                      <strong>Family</strong>
                                      <span>$19.99/month</span>
                                    </div>
                                  </div>
                                  <a href="#" className="upgrade-link">Create Free Account →</a>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Show ad at midpoint (only for non-premium users) */}
                    {index === midpoint - 1 && subscriptionTier === 'free' && (
                      <div className="ad-container story-inline-ad">
                        <div className="ad-label">Advertisement</div>
                        <AdSense 
                          adClient="ca-pub-XXXXXXXXXXXXXXXX"
                          adSlot="XXXXXXXXXX"
                          adFormat="auto"
                          style={{ minHeight: '90px', maxHeight: '250px' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>


          {/* Rating */}
          <div className="story-rating">
            <p>How did you like this story?</p>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${rating >= star ? 'active' : ''}`}
                  onClick={() => handleRating(star)}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="story-footer">
            <button onClick={onBack} className="new-story-btn">
              ✨ Create Another Story
            </button>
            <button 
              onClick={onShowLibrary || onBack} 
              className="library-btn"
            >
              📚 My Library
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player (if available) */}
      {story.audioUrl && (
        <div className="audio-player">
          <audio controls>
            <source src={story.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      </div>
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
    </div>
  );
}

export default StoryDisplay;