import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import AdSense from './AdSense';
import './StoryDisplay.css';
import '../App.original.css';

function StoryDisplay({ story, onBack, onSave, onShowLibrary, onShowAuth, user, subscriptionTier, starPoints, childProfile }) {
  console.log('StoryDisplay received:', { story, subscriptionTier, hasImageUrl: !!story?.imageUrl });
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
  const [achievementCount, setAchievementCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [storyStartTime, setStoryStartTime] = useState(null);

  useEffect(() => {
    // Track story start time
    const startTime = Date.now();
    setStoryStartTime(startTime);
    
    // Check if story is already saved (or auto-saved)
    if (story?.savedId) {
      setIsSaved(true);
    } else {
      checkIfSaved();
    }
    
    // Load achievement and streak data
    if (childProfile?.id) {
      // Load achievements
      const achievements = localStorage.getItem(`achievements_${childProfile.id}`);
      if (achievements) {
        setAchievementCount(JSON.parse(achievements).length);
      }
      
      // Load streak data
      const streakData = localStorage.getItem(`readingStreak_${childProfile.id}`);
      if (streakData) {
        const streak = JSON.parse(streakData);
        setCurrentStreak(streak.current || 0);
      }
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
      
      // Save reading time when leaving the story
      if (storyStartTime && childProfile?.id) {
        const endTime = Date.now();
        const readingDuration = Math.floor((endTime - storyStartTime) / 1000 / 60); // Convert to minutes
        
        if (readingDuration > 0) { // Only track if at least 1 minute
          const timeData = JSON.parse(localStorage.getItem(`readingTime_${childProfile.id}`) || '{"total": 0, "sessions": 0, "history": []}');
          timeData.total = (timeData.total || 0) + readingDuration;
          timeData.sessions = (timeData.sessions || 0) + 1;
          timeData.history = timeData.history || [];
          timeData.history.push({
            date: new Date().toISOString(),
            duration: readingDuration,
            storyTitle: story?.title
          });
          // Keep only last 30 sessions
          if (timeData.history.length > 30) {
            timeData.history = timeData.history.slice(-30);
          }
          localStorage.setItem(`readingTime_${childProfile.id}`, JSON.stringify(timeData));
        }
      }
    };
  }, [story, childProfile, storyStartTime]);

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
    // Gather child profile data if available
    const childProfiles = localStorage.getItem('childProfiles');
    let childAchievements = 0;
    let childStars = starPoints || 0;
    
    if (childProfiles && story.childName) {
      const profiles = JSON.parse(childProfiles);
      const currentProfile = profiles.find(p => p.name === story.childName);
      if (currentProfile) {
        const achievements = localStorage.getItem(`achievements_${currentProfile.id}`);
        if (achievements) {
          childAchievements = JSON.parse(achievements).length;
        }
        const stars = localStorage.getItem(`stars_${currentProfile.id}`);
        if (stars) {
          childStars = parseInt(stars) || childStars;
        }
      }
    }
    
    const storyData = {
      title: story.title,
      content: story.content,
      metadata: {
        childName: story.childName || 'Young Reader',
        stars: childStars,
        achievements: childAchievements,
        isPremium: subscriptionTier === 'premium' || subscriptionTier === 'family',
        date: new Date().toLocaleDateString()
      }
    };

    const pdfContent = generateCompactPDF(storyData, story.imageUrl ? [{url: story.imageUrl}] : []);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const generateCompactPDF = (story, images) => {
    const { title, content, metadata } = story;
    const date = metadata.date || new Date().toLocaleDateString();
    const childName = metadata?.childName || 'Young Reader';
    const stars = metadata?.stars || 0;
    const achievements = metadata?.achievements || 0;
    const isPremium = metadata?.isPremium || false;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: letter;
            margin: 0.75in;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.75;
            color: #333;
            max-width: 7in;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 2px solid #667eea;
            margin-bottom: 20px;
          }
          
          .header-left {
            flex: 1;
          }
          
          h1 {
            color: #667eea;
            font-size: 20pt;
            margin: 0 0 4px 0;
            font-weight: bold;
          }
          
          .site-name {
            font-size: 14pt;
            font-weight: bold;
            background: linear-gradient(135deg, #FF6B9D, #4ECDC4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 4px 0 8px 0;
          }
          
          .story-for {
            font-size: 11pt;
            color: #666;
            font-style: italic;
          }
          
          .header-stats {
            display: flex;
            gap: 20px;
            font-size: 10pt;
            color: #666;
          }
          
          .stat {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .content {
            font-size: 11.5pt;
            text-align: justify;
            margin-top: 20px;
          }
          
          .content p {
            margin-bottom: 0.9em;
            text-indent: 0;
            text-align: left;
          }
          
          .image-container {
            float: right;
            margin: 0 0 1em 1em;
            page-break-inside: avoid;
            width: 45%;
          }
          
          .image-container img {
            width: 100%;
            max-height: 3.5in;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .footer {
            margin-top: 2em;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 9pt;
            color: #999;
          }
          
          .footer-left {
            font-size: 8pt;
          }
          
          .footer-upgrade {
            background: linear-gradient(90deg, #667eea, #764ba2);
            color: white;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 8pt;
            text-decoration: none;
          }
          
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>${title}</h1>
            <div class="site-name">KidsStoryTime.org</div>
            <div class="story-for">Story for ${childName}</div>
          </div>
          <div class="header-stats">
            <div class="stat">
              <span>⭐</span>
              <span>${stars} stars</span>
            </div>
            <div class="stat">
              <span>🏆</span>
              <span>${achievements} achievements</span>
            </div>
          </div>
        </div>
        
        <div class="content">
          ${(() => {
            const paragraphs = content.split('\n').filter(p => p.trim());
            let html = '';
            
            // Add first paragraph
            if (paragraphs.length > 0) {
              html += `<p>${paragraphs[0]}</p>`;
            }
            
            // Add image after first paragraph if available
            if (images.length > 0) {
              html += `
                <div class="image-container">
                  <img src="${images[0].url}" alt="Story illustration">
                </div>
              `;
            }
            
            // Add remaining paragraphs
            if (paragraphs.length > 1) {
              html += paragraphs.slice(1).map(p => `<p>${p}</p>`).join('');
            }
            
            return html;
          })()}
        </div>
        
        <div class="footer">
          <div class="footer-left">
            KidsStoryTime.org • ${date}
          </div>
          ${!isPremium ? `
            <span class="footer-upgrade">
              📄 Upgrade for unlimited PDF exports & illustrations
            </span>
          ` : ''}
        </div>
      </body>
      </html>
    `;
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
          onShowAuth={onShowAuth}
          onShowAchievements={null}
          onLogoClick={onBack}
        />
        
        <div className="story-display-container">
        
        {/* Gamification Stats Section - Pink section like home page */}
        {childProfile && (
          <div className="story-gamification-section">
            <div className="gamification-stats">
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <span className="stat-value">{achievementCount}</span>
                <span className="stat-label">Achievements</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{starPoints || 0}</span>
                <span className="stat-label">Stars</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="story-wrapper">
          {/* Story Actions Bar - Original layout */}
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
                        {(subscriptionTier === 'plus' || subscriptionTier === 'premium' || subscriptionTier === 'family' || subscriptionTier === 'basic') ? (
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
                            {!user ? (
                              // For non-logged-in users, show register button
                              <button 
                                className="generate-image-btn"
                                onClick={() => onShowAuth && onShowAuth()}
                              >
                                🎨 Register (free forever) to add an image
                              </button>
                            ) : (
                              // For logged-in free users, show upgrade button with tooltip
                              <button className="generate-image-btn">
                                🎨 Upgrade to add AI images
                                <div className="upgrade-tooltip tooltip-left">
                                  <div className="tooltip-content">
                                    <h4>Upgrade to Premium</h4>
                                    <p>Get beautiful AI-generated illustrations for every story!</p>
                                    <div className="tier-info">
                                      <div className="tier-option">
                                        <strong>Premium</strong>
                                        <span>$9.99/month</span>
                                      </div>
                                      <div className="tier-option">
                                        <strong>Family</strong>
                                        <span>$19.99/month</span>
                                      </div>
                                    </div>
                                    <a href="#" className="upgrade-link">Start Free Trial →</a>
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Show ad at midpoint (only for free tier users and non-logged-in users) */}
                    {index === midpoint - 1 && (subscriptionTier === 'try-now' || subscriptionTier === 'reader' || !user) && (
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