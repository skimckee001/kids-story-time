import { useEffect, useState } from 'react';
import './CelebrationAnimation.css';

function CelebrationAnimation({ type, message, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, type === 'confetti' ? 5000 : 3000);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (!isVisible) return null;

  // Different celebration types
  if (type === 'confetti') {
    return (
      <div className="celebration-overlay confetti-celebration">
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#FF6B9D', '#4ECDC4', '#FFD700', '#667eea', '#764ba2'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
        <div className="celebration-message">
          <div className="message-content">
            <span className="celebration-icon">🎉</span>
            <h2>{message || 'Congratulations!'}</h2>
            <div className="sparkles">✨ ⭐ ✨</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'stars') {
    return (
      <div className="celebration-overlay stars-celebration">
        <div className="stars-container">
          {[...Array(20)].map((_, i) => (
            <span 
              key={i} 
              className="floating-star"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ⭐
            </span>
          ))}
        </div>
        <div className="celebration-message">
          <div className="message-content star-message">
            <span className="celebration-icon">⭐</span>
            <h2>{message || 'You earned stars!'}</h2>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'achievement') {
    return (
      <div className="celebration-overlay achievement-celebration">
        <div className="achievement-badge-large">
          <div className="badge-glow"></div>
          <span className="badge-icon">🏆</span>
        </div>
        <div className="celebration-message">
          <h2>Achievement Unlocked!</h2>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'streak') {
    return (
      <div className="celebration-overlay streak-celebration">
        <div className="streak-fire">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="fire-emoji" style={{ animationDelay: `${i * 0.2}s` }}>
              🔥
            </span>
          ))}
        </div>
        <div className="celebration-message">
          <h2>{message || 'Streak Achievement!'}</h2>
          <p>Keep up the amazing work!</p>
        </div>
      </div>
    );
  }

  if (type === 'level-up') {
    return (
      <div className="celebration-overlay level-up-celebration">
        <div className="level-up-animation">
          <div className="level-circle">
            <span className="level-text">LEVEL UP!</span>
          </div>
          <div className="level-rays">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="ray" style={{ transform: `rotate(${i * 45}deg)` }} />
            ))}
          </div>
        </div>
        <div className="celebration-message">
          <h2>{message || 'Reading Level Increased!'}</h2>
        </div>
      </div>
    );
  }

  // Default celebration
  return (
    <div className="celebration-overlay default-celebration">
      <div className="celebration-message">
        <span className="celebration-icon">🎊</span>
        <h2>{message || 'Well done!'}</h2>
      </div>
    </div>
  );
}

// Hook to trigger celebrations
export const useCelebration = () => {
  const [celebration, setCelebration] = useState(null);

  const triggerCelebration = (type, message) => {
    setCelebration({ type, message });
  };

  const CelebrationComponent = celebration ? (
    <CelebrationAnimation
      type={celebration.type}
      message={celebration.message}
      onComplete={() => setCelebration(null)}
    />
  ) : null;

  return { triggerCelebration, CelebrationComponent };
};

export default CelebrationAnimation;