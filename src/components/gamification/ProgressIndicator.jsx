import { useState, useEffect } from 'react';
import { Star, Trophy, TrendingUp } from 'lucide-react';
import gamification from '../../lib/gamification';

export function ProgressIndicator({ compact = true, position = 'top-right' }) {
  const [userStatus, setUserStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadStatus();
    
    // Listen for gamification events
    const handleReward = () => loadStatus();
    window.addEventListener('gamification:reward', handleReward);
    window.addEventListener('gamification:levelup', handleReward);
    window.addEventListener('gamification:badge', handleReward);
    
    return () => {
      window.removeEventListener('gamification:reward', handleReward);
      window.removeEventListener('gamification:levelup', handleReward);
      window.removeEventListener('gamification:badge', handleReward);
    };
  }, []);

  const loadStatus = async () => {
    const status = gamification.getUserStatus();
    setUserStatus(status);
  };

  if (!userStatus) return null;

  const positionClasses = {
    'top-right': 'fixed top-20 right-4',
    'top-left': 'fixed top-20 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'header': 'relative'
  };

  const getLevelColor = () => {
    const level = userStatus.level;
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 25) return 'from-blue-500 to-indigo-500';
    if (level >= 10) return 'from-green-500 to-emerald-500';
    return 'from-gray-500 to-gray-600';
  };

  if (compact) {
    return (
      <div 
        className={`${positionClasses[position]} z-40 transition-all duration-300 ${
          position !== 'header' ? 'hover:scale-105' : ''
        }`}
      >
        <div 
          className="bg-white rounded-full shadow-lg p-2 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-3 px-2">
            {/* Level Badge */}
            <div className={`bg-gradient-to-r ${getLevelColor()} text-white rounded-full px-3 py-1 text-sm font-bold`}>
              Lv {userStatus.level}
            </div>
            
            {/* Stars */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-700">{userStatus.stars}</span>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-24 bg-gray-200 rounded-full h-2 relative">
              <div 
                className={`bg-gradient-to-r ${getLevelColor()} h-full rounded-full transition-all duration-500`}
                style={{ width: `${userStatus.levelProgress || 0}%` }}
              />
            </div>
            
            {/* Streak */}
            {userStatus.streaks?.daily > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">{userStatus.streaks.daily}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl p-4 w-64 animate-fadeIn">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Level Progress</span>
                <span className="text-sm font-semibold">{userStatus.xpToNextLevel} XP to next</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Badges Earned</span>
                <span className="text-sm font-semibold">{userStatus.badges?.length || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stories Read</span>
                <span className="text-sm font-semibold">{userStatus.statistics?.storiesCompleted || 0}</span>
              </div>
              
              <div className="pt-2 border-t">
                <button 
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  onClick={() => window.location.href = '#badges'}
                >
                  View All Achievements →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full display version
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${getLevelColor()} text-white rounded-full px-4 py-2 font-bold`}>
            Level {userStatus.level}
          </div>
          <div className="text-sm text-gray-600">
            {userStatus.xp} / {userStatus.xp + userStatus.xpToNextLevel} XP
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-lg">{userStatus.stars}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            <span className="font-bold text-lg">{userStatus.badges?.length || 0}</span>
          </div>
          
          {userStatus.streaks?.daily > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="font-bold text-lg">{userStatus.streaks.daily} day</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`bg-gradient-to-r ${getLevelColor()} h-full rounded-full transition-all duration-500`}
          style={{ width: `${userStatus.levelProgress || 0}%` }}
        />
      </div>
    </div>
  );
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { 
      opacity: 0;
      transform: translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;
if (!document.getElementById('progress-indicator-styles')) {
  style.id = 'progress-indicator-styles';
  document.head.appendChild(style);
}