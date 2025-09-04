import { useState } from 'react';

function Header({ user, subscriptionTier, starPoints, onShowLibrary, onShowAuth, onShowAchievements, onLogoClick, onShowRewards, isLibraryPage = false }) {
  return (
    <>
      {/* Main header container - matches homepage */}
      <header className="header-container">
        <div className="header-content">
          <div className="header-left" style={{ cursor: 'pointer' }} onClick={onLogoClick}>
            <div className="logo-icon">
              <span>📚</span>
            </div>
            <div className="logo-text">
              KidsStoryTime<span className="logo-domain">.ai</span>
            </div>
          </div>
          {/* Show login button if no user */}
          {!user ? (
            <button 
              className="header-btn login-btn"
              onClick={onShowAuth}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Sign In
            </button>
          ) : (
            <button 
              className="header-btn login-btn"
              onClick={onShowAuth}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Tagline */}
      <div className="tagline" style={{textAlign: 'center', marginBottom: '20px'}}>
        Join thousands of families creating magical bedtime moments
      </div>

      {/* Launch Special Banner */}
      <div className="beta-banner" style={{marginBottom: '20px'}}>
        <div className="beta-title">🎉 LAUNCH SPECIAL - First Month FREE on All Plans!</div>
      </div>

      {/* Navigation buttons */}
      <div className="header-navigation" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Stars button */}
        <button 
          className="nav-pill"
          onClick={onShowRewards}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #ffa500, #ffb347)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(255, 165, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(255, 165, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 165, 0, 0.3)';
          }}
        >
          ⭐ {starPoints || 0} Stars
        </button>

        {/* Badges/Achievements button */}
        <button 
          className="nav-pill"
          onClick={onShowAchievements}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
        >
          🏆 1/48 Badges
        </button>

        {/* Library/Plans button */}
        <button 
          className="nav-pill"
          onClick={isLibraryPage ? () => window.open('/pricing-new.html', '_blank') : onShowLibrary}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
          }}
        >
          {isLibraryPage ? '💳 Plans' : '📚 Library'}
        </button>
      </div>
    </>
  );
}

export default Header;