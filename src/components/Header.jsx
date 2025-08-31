import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Header({ user, subscriptionTier, starPoints, onShowLibrary, onShowAuth, onLogout, onShowAchievements, onLogoClick, onShowRewards }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <span>📚</span>
          </div>
          <div className="logo-text">
            KidsStoryTime<span className="logo-domain">.ai</span>
          </div>
        </div>
        <div className="header-right">
          {user ? (
            <>
              {/* Star Display - Always visible for motivation */}
              <button 
                className="star-display clickable"
                onClick={onShowRewards || (() => {})}
                title="Click to open rewards shop"
              >
                <span className="star-icon">⭐</span>
                <span className="star-count">{starPoints || 0}</span>
              </button>
              
              {/* Primary Gamification Actions */}
              <button 
                className="header-btn"
                onClick={onShowAchievements || (() => {})}
                title="View achievements"
                style={{background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: 'white', border: 'none', flex: '0 0 auto'}}
              >
                🏆 Achievements
              </button>
              
              <button 
                className="header-btn"
                onClick={onShowLibrary}
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
                    <button onClick={() => { window.open('/pricing-new.html', '_blank'); setShowMoreMenu(false); }}>
                      💰 View Plans
                    </button>
                    {onLogout && (
                      <button onClick={() => { onLogout(); setShowMoreMenu(false); }}>
                        🚪 Logout
                      </button>
                    )}
                  </div>
                )}
              </div>
              {(subscriptionTier === 'reader-free' || subscriptionTier === 'story-maker-basic' || subscriptionTier === 'reader' || subscriptionTier === 'basic') && (
                <button className="header-btn trial-btn" onClick={onShowAuth}>
                  ⭐ Upgrade {subscriptionTier === 'reader-free' || subscriptionTier === 'reader' ? 'to Story Maker' : 'to Family'}
                  <div className="trial-tooltip">
                    {subscriptionTier === 'reader-free' || subscriptionTier === 'reader' ? 
                      '10 stories/day + AI images • $4.99/month' : 
                      '20 stories/day + Unlimited AI • $7.99/month'}
                  </div>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="star-display" title="Create an account to start earning stars!" style={{ cursor: 'help' }}>
                <span className="star-icon">⭐</span>
                <span className="star-count">0</span>
              </div>
              <button 
                className="header-btn"
                onClick={onShowAuth}
                title="Sign up to unlock achievements"
                style={{background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: 'white', border: 'none', flex: '0 0 auto'}}
              >
                🏆 Achievements
              </button>
              <button 
                className="header-btn"
                onClick={onShowAuth}
                style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', flex: '0 0 auto'}}
              >
                📖 My Library
              </button>
              <button className="header-btn trial-btn" onClick={onShowAuth}>
                🎉 Start Free Trial
                <div className="trial-tooltip">
                  Free for first month! All premium features unlocked
                </div>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="tagline">Magical Personalized Stories for Your Child</div>
      
      {/* Beta Banner */}
      <div className="beta-banner">
        <div className="beta-title">🎉 FREE BETA - All Premium Features Unlocked!</div>
        <div className="beta-subtitle">Create unlimited stories, export to PDF, and enjoy all features completely free during our launch period</div>
      </div>
    </header>
  );
}

export default Header;