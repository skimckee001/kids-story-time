import { supabase } from '../lib/supabase';

function Header({ user, subscriptionTier, starPoints, onShowLibrary, onShowAuth, onLogout, onShowAchievements, onLogoClick }) {
  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
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
              {starPoints !== undefined && (
                <div className="star-display">
                  <span className="star-icon">⭐</span>
                  <span className="star-count">{starPoints}</span>
                </div>
              )}
              {onShowAchievements && (
                <button 
                  className="header-btn achievement-btn"
                  onClick={onShowAchievements}
                  title="View achievements"
                >
                  🏆 Achievements
                </button>
              )}
              <button 
                className="header-btn library-btn"
                onClick={onShowLibrary}
              >
                📖 My Library
              </button>
              {subscriptionTier === 'free' && (
                <button className="header-btn trial-btn" onClick={onShowAuth}>
                  🎉 Start Free Trial
                  <div className="trial-tooltip">
                    Free for first month! All premium features unlocked
                  </div>
                </button>
              )}
              {onLogout && (
                <button 
                  className="header-btn logout-btn"
                  onClick={onLogout}
                >
                  Logout
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
                className="header-btn achievement-btn"
                onClick={onShowAuth}
                title="Sign up to unlock achievements"
              >
                🏆 Achievements
              </button>
              <button 
                className="header-btn library-btn"
                onClick={onShowAuth}
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