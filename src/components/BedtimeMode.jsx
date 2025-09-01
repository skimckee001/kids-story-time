import { useState, useEffect } from 'react';
import './BedtimeMode.css';

function BedtimeMode({ isActive, onToggle, onTimeout }) {
  const [timer, setTimer] = useState(30); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  
  // Check for existing bedtime mode on mount
  useEffect(() => {
    const savedBedtime = localStorage.getItem('bedtimeMode');
    if (savedBedtime) {
      const bedtimeData = JSON.parse(savedBedtime);
      const now = Date.now();
      const endTime = bedtimeData.endTime;
      
      if (endTime > now) {
        // Bedtime mode is still active
        const remainingSeconds = Math.ceil((endTime - now) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        
        setSecondsRemaining(remainingSeconds);
        setTimeRemaining(remainingMinutes);
        onToggle(true);
        document.body.classList.add('bedtime-mode');
        
        console.log(`Restored bedtime mode with ${remainingMinutes} minutes remaining`);
      } else {
        // Bedtime mode expired while away
        localStorage.removeItem('bedtimeMode');
        document.body.classList.remove('bedtime-mode');
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // Timer expired
            handleDeactivate();
            if (onTimeout) onTimeout();
            return 0;
          }
          
          // Update minutes display when crossing minute boundary
          const newSeconds = prev - 1;
          const newMinutes = Math.ceil(newSeconds / 60);
          const oldMinutes = Math.ceil(prev / 60);
          if (newMinutes !== oldMinutes) {
            setTimeRemaining(newMinutes);
          }
          
          return newSeconds;
        });
      }, 1000); // Update every second for better UX
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, onTimeout]);

  const handleActivate = () => {
    const totalSeconds = timer * 60;
    setTimeRemaining(timer);
    setSecondsRemaining(totalSeconds);
    onToggle(true);
    setShowSettings(false);
    
    // Add bedtime class to body for global theme change
    document.body.classList.add('bedtime-mode');
    
    // Store bedtime mode state
    localStorage.setItem('bedtimeMode', JSON.stringify({
      active: true,
      startTime: Date.now(),
      duration: timer,
      endTime: Date.now() + (totalSeconds * 1000)
    }));
    
    // Show confirmation
    console.log(`Bedtime mode activated for ${timer} minutes`);
  };

  const handleDeactivate = () => {
    setTimeRemaining(null);
    setSecondsRemaining(null);
    onToggle(false);
    
    // Remove bedtime class from body
    document.body.classList.remove('bedtime-mode');
    
    // Clear bedtime mode state
    localStorage.removeItem('bedtimeMode');
    
    console.log('Bedtime mode deactivated');
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    
    // If we're showing minutes (for display)
    if (seconds > 60) {
      const minutes = Math.ceil(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    }
    
    // Show seconds for last minute
    return `${seconds} sec${seconds !== 1 ? 's' : ''}`;
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
          {secondsRemaining > 0 && (
            <span className="time-remaining">
              {formatTime(secondsRemaining)} remaining
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