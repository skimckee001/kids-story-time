import { useState, useEffect } from 'react';
import './BedtimeMode.css';

function BedtimeMode({ isActive, onToggle, onTimeout }) {
  const [timer, setTimer] = useState(30); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer expired
            if (onTimeout) onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, onTimeout]);

  const handleActivate = () => {
    setTimeRemaining(timer);
    onToggle(true);
    setShowSettings(false);
    
    // Add bedtime class to body for global theme change
    document.body.classList.add('bedtime-mode');
    
    // Store bedtime mode state
    localStorage.setItem('bedtimeMode', JSON.stringify({
      active: true,
      startTime: Date.now(),
      duration: timer
    }));
  };

  const handleDeactivate = () => {
    setTimeRemaining(null);
    onToggle(false);
    
    // Remove bedtime class from body
    document.body.classList.remove('bedtime-mode');
    
    // Clear bedtime mode state
    localStorage.removeItem('bedtimeMode');
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins} min`;
  };

  if (!isActive && !showSettings) {
    return (
      <button 
        className="bedtime-toggle-btn"
        onClick={() => setShowSettings(true)}
        title="Activate bedtime mode"
      >
        🌙 Bedtime Mode
      </button>
    );
  }

  if (!isActive && showSettings) {
    return (
      <div className="bedtime-settings-modal">
        <div className="bedtime-settings">
          <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
          
          <div className="bedtime-header">
            <span className="moon-icon">🌙</span>
            <h2>Bedtime Mode</h2>
          </div>
          
          <p className="bedtime-description">
            Create a calming reading environment with:
          </p>
          
          <div className="bedtime-features">
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <span>Soft, calming colors</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⏱️</span>
              <span>Auto-sleep timer</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔇</span>
              <span>Gentle narration voice</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✨</span>
              <span>Soothing animations</span>
            </div>
          </div>
          
          <div className="timer-settings">
            <label>Set sleep timer:</label>
            <div className="timer-options">
              <button 
                className={timer === 15 ? 'active' : ''}
                onClick={() => setTimer(15)}
              >
                15 min
              </button>
              <button 
                className={timer === 30 ? 'active' : ''}
                onClick={() => setTimer(30)}
              >
                30 min
              </button>
              <button 
                className={timer === 45 ? 'active' : ''}
                onClick={() => setTimer(45)}
              >
                45 min
              </button>
              <button 
                className={timer === 60 ? 'active' : ''}
                onClick={() => setTimer(60)}
              >
                1 hour
              </button>
            </div>
          </div>
          
          <button className="activate-btn" onClick={handleActivate}>
            🌙 Start Bedtime Mode
          </button>
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="bedtime-active-display">
        <div className="bedtime-status">
          <span className="moon-animated">🌙</span>
          <span className="status-text">Bedtime Mode Active</span>
          {timeRemaining > 0 && (
            <span className="time-remaining">
              {formatTime(timeRemaining)} remaining
            </span>
          )}
          <button 
            className="end-bedtime-btn"
            onClick={handleDeactivate}
            title="End bedtime mode"
          >
            End
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default BedtimeMode;