import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdSense from './AdSense';
import { addStarsToChild } from './StarRewardsSystem';
import './StoryDisplay.css';
import '../App.original.css';

function StoryDisplay({ story, onBack, onSave, onShowLibrary, onShowAuth, user, subscriptionTier, starPoints, childProfile, onShowAchievements, onShowRewards, onShowDashboard, onShowProfileManager, bedtimeModeActive, onToggleBedtime }) {
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
  const [hasCompletedReading, setHasCompletedReading] = useState(false);
  const [showCompletionReward, setShowCompletionReward] = useState(false);
  const [localStarPoints, setLocalStarPoints] = useState(starPoints);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Click outside handler for dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);
  
  const handleLogout = async () => {
    localStorage.removeItem('mockUser');
    await supabase.auth.signOut();
    window.location.reload();
  };

  useEffect(() => {
    // Track story start time
    const startTime = Date.now();
    setStoryStartTime(startTime);
    
    // Check if this story has already been completed today
    if (childProfile?.id && story?.id) {
      const today = new Date().toDateString();
      const completedKey = `completed_${childProfile.id}_${story.id}_${today}`;
      if (localStorage.getItem(completedKey)) {
        setHasCompletedReading(true);
      }
    }
    
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
            <div class="site-name">KidsStoryTime.ai</div>
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
            KidsStoryTime.ai • ${date}
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
        // Automatically mark as complete when read aloud finishes
        if (!hasCompletedReading) {
          handleMarkAsComplete();
        }
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
  
  const handleMarkAsComplete = () => {
    if (!childProfile?.id || hasCompletedReading) return;
    
    // Award stars for completing the story
    const starsEarned = 5; // 5 stars for reading completion (different from 10 for generation)
    const newTotal = addStarsToChild(childProfile.id, starsEarned, 'Finished reading a story');
    setLocalStarPoints(newTotal);
    
    // Mark as completed for today
    const today = new Date().toDateString();
    const completedKey = `completed_${childProfile.id}_${story?.id || 'unknown'}_${today}`;
    localStorage.setItem(completedKey, 'true');
    setHasCompletedReading(true);
    
    // Show completion reward animation
    setShowCompletionReward(true);
    setTimeout(() => setShowCompletionReward(false), 3000);
    
    // Update reading streak
    const streakData = JSON.parse(localStorage.getItem(`readingStreak_${childProfile.id}`) || '{}');
    const lastRead = streakData.lastRead ? new Date(streakData.lastRead).toDateString() : null;
    const todayStr = new Date().toDateString();
    
    if (lastRead !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastRead === yesterdayStr) {
        // Continue streak
        streakData.current = (streakData.current || 0) + 1;
      } else {
        // Start new streak
        streakData.current = 1;
      }
      
      streakData.lastRead = new Date().toISOString();
      streakData.longest = Math.max(streakData.longest || 0, streakData.current);
      localStorage.setItem(`readingStreak_${childProfile.id}`, JSON.stringify(streakData));
    }
    
    // Track completion for achievements
    const completions = JSON.parse(localStorage.getItem(`storyCompletions_${childProfile.id}`) || '[]');
    completions.push({
      storyId: story?.id,
      title: story?.title,
      completedAt: new Date().toISOString()
    });
    localStorage.setItem(`storyCompletions_${childProfile.id}`, JSON.stringify(completions));
    
    // Check for achievements
    checkReadingAchievements(completions.length);
  };
  
  const checkReadingAchievements = (totalCompletions) => {
    const achievements = JSON.parse(localStorage.getItem(`achievements_${childProfile.id}`) || '[]');
    const newAchievements = [];
    
    // First story achievement
    if (totalCompletions === 1 && !achievements.includes('first_story')) {
      newAchievements.push('first_story');
      addStarsToChild(childProfile.id, 15, 'Achievement: First Story!');
    }
    
    // 5 stories achievement
    if (totalCompletions === 5 && !achievements.includes('bookworm_5')) {
      newAchievements.push('bookworm_5');
      addStarsToChild(childProfile.id, 20, 'Achievement: Read 5 Stories!');
    }
    
    // 10 stories achievement
    if (totalCompletions === 10 && !achievements.includes('bookworm_10')) {
      newAchievements.push('bookworm_10');
      addStarsToChild(childProfile.id, 30, 'Achievement: Read 10 Stories!');
    }
    
    if (newAchievements.length > 0) {
      achievements.push(...newAchievements);
      localStorage.setItem(`achievements_${childProfile.id}`, JSON.stringify(achievements));
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
        <header className="header-container">
          <div className="header-content">
            <div className="header-left" onClick={onBack} style={{ cursor: 'pointer' }}>
              <div className="logo-icon">
                <span>📚</span>
              </div>
              <div className="logo-text">
                KidsStoryTime<span className="logo-domain">.ai</span>
              </div>
            </div>
            {user && (
              <div className="header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Bedtime Mode Toggle */}
                <button
                  className="header-btn bedtime-toggle"
                  onClick={() => onToggleBedtime && onToggleBedtime(!bedtimeModeActive)}
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
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    title="Account menu"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
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
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}>
                      <button 
                        onClick={() => { onShowDashboard && onShowDashboard(); setShowUserMenu(false); }}
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
                        onClick={() => { onShowProfileManager && onShowProfileManager(); setShowUserMenu(false); }}
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
          
          {/* Navigation Bar */}
          <div className="header-content" style={{marginTop: '1rem'}}>
            <div className="header-right" style={{width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', minHeight: 'auto'}}>
              {user ? (
                <>
                  {/* Star Bank - Currency System */}
                  <button 
                    className="header-btn"
                    onClick={() => onShowRewards && onShowRewards()}
                    title="Star Shop - Spend your stars!"
                    aria-label="Star shop with {starPoints} stars"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>💰</span>
                    <span>{localStarPoints} Stars</span>
                  </button>
                  
                  {/* Trophy Room - Achievement System */}
                  <button 
                    className="header-btn"
                    onClick={() => onShowAchievements && onShowAchievements()}
                    title="Badge Collection - View your achievements!"
                    aria-label="View achievements"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>🏆</span>
                    <span>{achievementCount}/48 Badges</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={onBack}
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>📚</span>
                    <span>Library</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="header-btn"
                    onClick={onShowAuth}
                    title="Create an account to start earning stars!"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600', opacity: 0.7}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>💰</span>
                    <span>0 Stars</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={onShowAuth}
                    title="Sign up to unlock badges!"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600', opacity: 0.7}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>🏆</span>
                    <span>0/48 Badges</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={onShowAuth}
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto', padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                  >
                    <span style={{fontSize: '16px', marginRight: '6px'}}>📚</span>
                    <span>Library</span>
                  </button>
                  
                  <button 
                    className="header-btn"
                    onClick={onShowAuth}
                    style={{flex: '0 0 auto'}}
                  >
                    ✨ Sign Up Free
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
        
        <div className="story-display-container">
        
        
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
                        {(subscriptionTier === 'plus' || subscriptionTier === 'premium' || subscriptionTier === 'family' || subscriptionTier === 'basic' ||
                          subscriptionTier === 'family-plus' || subscriptionTier === 'story-maker-basic' || subscriptionTier === 'movie-director-premium') ? (
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
                        ) : subscriptionTier === 'reader-free' || subscriptionTier === 'reader' || subscriptionTier === 'free' ? (
                          // For free tier users, show stock image with AI upgrade button
                          <div className="story-image-wrapper">
                            {story.imageUrl ? (
                              <>
                                <img 
                                  src={story.imageUrl} 
                                  alt={story.title}
                                  className="story-main-image stock-image"
                                  onError={(e) => {
                                    // If image fails to load, try a fallback
                                    if (!e.target.dataset.retried) {
                                      e.target.dataset.retried = 'true';
                                      const seed = Math.floor(Math.random() * 1000);
                                      e.target.src = `https://picsum.photos/seed/${seed}/1024/1024`;
                                    }
                                  }}
                                />
                                <div className="ai-image-upgrade">
                                  {localStorage.getItem('aiImageTried') ? (
                                    <button 
                                      className="ai-upgrade-btn"
                                      onClick={() => window.location.href = '/pricing-new.html'}
                                    >
                                      ✨ Upgrade for AI Images
                                    </button>
                                  ) : (
                                    <button 
                                      className="ai-try-btn"
                                      onClick={() => {
                                        localStorage.setItem('aiImageTried', 'true');
                                        // TODO: Trigger AI image generation for free trial
                                        alert('Free AI trial coming soon! For now, enjoy this stock image.');
                                      }}
                                    >
                                      ✨ Try AI Image (1 Free)
                                    </button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="story-image-placeholder">
                                <div className="image-loading">
                                  <div className="loading-spinner"></div>
                                  <p>Loading image...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // For non-logged-in users
                          <div className="upgrade-image-container">
                            <button 
                              className="generate-image-btn"
                              onClick={() => onShowAuth && onShowAuth()}
                            >
                              🎨 Sign up free to see images
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Show ad at midpoint (only for free tier users and non-logged-in users) */}
                    {index === midpoint - 1 && (subscriptionTier === 'try-now' || subscriptionTier === 'reader-free' || subscriptionTier === 'reader' || subscriptionTier === 'free' || !user) && (
                      <div className="ad-container story-inline-ad">
                        <div className="ad-label">Advertisement</div>
                        <div style={{ 
                          minHeight: '90px', 
                          maxHeight: '250px',
                          background: '#f8f8f8',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '14px',
                          padding: '20px'
                        }}>
                          <AdSense 
                            adClient="ca-pub-1413183979906947"
                            adSlot="1977532623"
                            adFormat="auto"
                            style={{ width: '100%', height: '100%' }}
                          />
                          {/* Fallback text will only show if AdSense doesn't fill the space */}
                          <div style={{ position: 'absolute', zIndex: -1 }}>
                            Ads support our free stories
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>


          {/* Story Completion Button */}
          {childProfile && !hasCompletedReading && (
            <div className="story-completion" style={{
              textAlign: 'center',
              margin: '30px 0',
              padding: '20px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              border: '2px dashed #0ea5e9'
            }}>
              <h3 style={{ color: '#0369a1', marginBottom: '15px' }}>Finished Reading?</h3>
              <button 
                onClick={handleMarkAsComplete}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ⭐ Mark as Complete (+10 Stars)
              </button>
              <p style={{ marginTop: '10px', color: '#7c3aed', fontSize: '14px' }}>
                Complete stories to earn stars and unlock rewards!
              </p>
            </div>
          )}
          
          {/* Completion Reward Animation */}
          {showCompletionReward && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              zIndex: 9999,
              textAlign: 'center',
              animation: 'bounceIn 0.5s ease'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌟</div>
              <h2 style={{ color: '#ffa500', marginBottom: '10px' }}>Great Job!</h2>
              <p style={{ fontSize: '20px', color: '#333' }}>You earned 5 stars!</p>
              <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>Keep reading to earn more rewards!</p>
            </div>
          )}
          
          {/* Show completion status if already completed */}
          {hasCompletedReading && (
            <div style={{
              textAlign: 'center',
              margin: '30px 0',
              padding: '15px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              border: '2px solid #86efac'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>✅</div>
              <p style={{ color: '#16a34a', fontWeight: 'bold' }}>Story Completed!</p>
              <p style={{ color: '#64748b', fontSize: '14px' }}>You've already earned stars for this story today.</p>
            </div>
          )}

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
            <a href="mailto:support@kidsstorytime.ai">Contact Us</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default StoryDisplay;