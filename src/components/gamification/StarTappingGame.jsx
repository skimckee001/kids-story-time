import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import gamification from '../../lib/gamification';

export function StarTappingGame({ 
  storyImage, 
  onComplete, 
  readingLevel = 'preReader',
  childName = 'Friend' 
}) {
  const [stars, setStars] = useState([]);
  const [collectedStars, setCollectedStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animatingStars, setAnimatingStars] = useState({});
  const canvasRef = useRef(null);
  const totalStars = readingLevel === 'preReader' ? 5 : 3;

  useEffect(() => {
    generateStars();
  }, [storyImage]);

  const generateStars = () => {
    // Generate random star positions on the image
    const newStars = [];
    for (let i = 0; i < totalStars; i++) {
      newStars.push({
        id: i,
        x: 10 + Math.random() * 80, // 10-90% of width
        y: 10 + Math.random() * 80, // 10-90% of height
        collected: false,
        size: 30 + Math.random() * 20 // 30-50px
      });
    }
    setStars(newStars);
    setCollectedStars(0);
  };

  const handleStarTap = async (starId) => {
    // Prevent double-tapping
    if (animatingStars[starId]) return;

    // Start animation
    setAnimatingStars(prev => ({ ...prev, [starId]: true }));

    // Play sound effect (if available)
    playStarSound();

    // Update star as collected
    setStars(prev => prev.map(star => 
      star.id === starId ? { ...star, collected: true } : star
    ));

    // Increment collected count
    const newCount = collectedStars + 1;
    setCollectedStars(newCount);

    // Award points
    await gamification.addStars(1, 'star_tap');
    await gamification.addXP(2, 'star_tap');

    // Check if all stars collected
    if (newCount === totalStars) {
      setTimeout(() => handleCompletion(), 500);
    }

    // Remove animation flag after animation completes
    setTimeout(() => {
      setAnimatingStars(prev => {
        const newState = { ...prev };
        delete newState[starId];
        return newState;
      });
    }, 1000);
  };

  const handleCompletion = async () => {
    setShowCelebration(true);
    
    // Award completion bonus
    await gamification.addStars(5, 'star_tap_complete');
    await gamification.addXP(10, 'star_tap_complete');
    
    // Update achievement progress
    await gamification.updateAchievementProgress('preReader', 'picture_tapper', totalStars);
    
    // Play celebration sound
    playCelebrationSound();
    
    // Notify parent component
    if (onComplete) {
      onComplete({
        starsCollected: totalStars,
        bonusEarned: 5
      });
    }

    // Reset after celebration
    setTimeout(() => {
      setShowCelebration(false);
      generateStars(); // Generate new stars for next round
    }, 3000);
  };

  const playStarSound = () => {
    // Create a simple sound effect
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  };

  const playCelebrationSound = () => {
    // Play a series of ascending notes
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047]; // C, E, G, High C
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 150);
      });
    } catch (e) {
      console.log('Could not play celebration sound:', e);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Instructions */}
        <div className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3">
          <h3 className="font-semibold text-purple-800 mb-1">
            🌟 Find the Hidden Stars!
          </h3>
          <p className="text-sm text-purple-700">
            Hi {childName}! Tap all the twinkling stars in the picture to earn rewards!
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {Array.from({ length: totalStars }).map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-300 ${
                  i < collectedStars ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <Star className="h-6 w-6 fill-current" />
              </div>
            ))}
          </div>
          <Badge variant="secondary">
            {collectedStars} / {totalStars} Stars
          </Badge>
        </div>

        {/* Game Area */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {storyImage && (
            <img 
              src={storyImage} 
              alt="Story scene" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Render stars */}
          {stars.map(star => (
            <button
              key={star.id}
              onClick={() => handleStarTap(star.id)}
              disabled={star.collected}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                star.collected ? 'scale-0 opacity-0' : 'hover:scale-110'
              } ${animatingStars[star.id] ? 'animate-ping' : ''}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`
              }}
            >
              <div className={`w-full h-full ${star.collected ? '' : 'animate-pulse'}`}>
                <Star 
                  className="w-full h-full text-yellow-400 fill-yellow-400 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))'
                  }}
                />
              </div>
            </button>
          ))}

          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center animate-bounce">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Amazing Job, {childName}!
                </h2>
                <p className="text-xl text-white mb-4">
                  You found all the stars!
                </p>
                <Badge className="bg-yellow-400 text-yellow-900 text-lg px-4 py-2">
                  +5 Bonus Stars Earned!
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Rewards Display */}
        <div className="mt-4 flex justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {collectedStars}
            </div>
            <div className="text-xs text-gray-600">Stars Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {collectedStars * 2}
            </div>
            <div className="text-xs text-gray-600">XP Earned</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified Star component for better performance
function Star({ className, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}