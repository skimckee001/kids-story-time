import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import './StoryDisplay.css';
import '../App.original.css';

function StoryDisplay({ story, onBack, onSave, user, subscriptionTier, starPoints }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    // Check if story is already saved (or auto-saved)
    if (story?.savedId) {
      setIsSaved(true);
    } else {
      checkIfSaved();
    }
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
          {!isSaved ? (
            <button 
              onClick={handleSaveStory} 
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '💾 Save Story'}
            </button>
          ) : (
            <span className="saved-badge">✓ Saved</span>
          )}
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
                    {/* Show image placeholder after first paragraph */}
                    {index === 0 && (subscriptionTier === 'premium' || subscriptionTier === 'family') && (
                      <div className="story-image-float">
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
                      </div>
                    )}
                    {/* Show ad at midpoint (only for non-premium users) */}
                    {index === midpoint - 1 && subscriptionTier === 'free' && (
                      <div className="ad-container">
                        <div className="ad-label">Advertisement</div>
                        <div className="ad-placeholder">
                          <ins className="adsbygoogle"
                               style={{ display: 'block' }}
                               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                               data-ad-slot="XXXXXXXXXX"
                               data-ad-format="auto"
                               data-full-width-responsive="true"></ins>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          {/* The End */}
          <div className="story-end">
            <span className="the-end">The End</span>
            <div className="end-decoration">✨ 🌟 ✨</div>
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
              onClick={() => window.location.href = '/story-library.html'} 
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