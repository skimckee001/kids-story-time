import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Star, TrendingUp, Award, Zap } from 'lucide-react';
import gamification from '../../lib/gamification';

export function LevelProgress({ compact = false, showDetails = true }) {
  const [userStatus, setUserStatus] = useState(null);
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    loadUserStatus();
    
    // Listen for level up events
    const handleLevelUp = (event) => {
      loadUserStatus();
      showLevelUpAnimation(event.detail);
    };
    
    window.addEventListener('gamification:levelup', handleLevelUp);
    return () => window.removeEventListener('gamification:levelup', handleLevelUp);
  }, []);

  const loadUserStatus = async () => {
    const status = gamification.getUserStatus();
    setUserStatus(status);
    
    // Trigger animation on load
    setTimeout(() => setAnimateProgress(true), 100);
  };

  const showLevelUpAnimation = (details) => {
    // This would trigger a celebration animation
    console.log('Level up!', details);
  };

  if (!userStatus) {
    return <div>Loading level...</div>;
  }

  const getLevelTitle = (level) => {
    const titles = {
      1: 'Beginner Reader',
      5: 'Story Explorer',
      10: 'Word Wizard',
      15: 'Tale Spinner',
      20: 'Narrative Knight',
      25: 'Story Master',
      30: 'Reading Champion',
      40: 'Literary Legend',
      50: 'Story Sage',
      75: 'Reading Royalty',
      100: 'Ultimate Storyteller'
    };
    
    // Find the highest title the user has achieved
    const achievedTitles = Object.entries(titles)
      .filter(([reqLevel]) => level >= parseInt(reqLevel))
      .sort(([a], [b]) => parseInt(b) - parseInt(a));
    
    return achievedTitles[0]?.[1] || 'Beginner Reader';
  };

  const getLevelColor = (level) => {
    if (level >= 75) return 'from-purple-500 to-pink-500';
    if (level >= 50) return 'from-yellow-500 to-orange-500';
    if (level >= 25) return 'from-blue-500 to-indigo-500';
    if (level >= 10) return 'from-green-500 to-emerald-500';
    return 'from-gray-500 to-gray-600';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
        <div className={`p-2 rounded-full bg-gradient-to-r ${getLevelColor(userStatus.level)}`}>
          <Award className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Level {userStatus.level}</span>
            <Badge variant="secondary" className="text-xs">
              {getLevelTitle(userStatus.level)}
            </Badge>
          </div>
          <Progress 
            value={userStatus.levelProgress} 
            className="h-2 mt-1"
          />
        </div>
        <div className="text-sm text-gray-600">
          {userStatus.xp} XP
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Level Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-gradient-to-r ${getLevelColor(userStatus.level)}`}>
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Level {userStatus.level}</h3>
                <p className="text-gray-600">{getLevelTitle(userStatus.level)}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">
                {userStatus.xp.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total XP</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to Level {userStatus.level + 1}</span>
              <span className="font-semibold">
                {userStatus.xpToNextLevel} XP needed
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={animateProgress ? userStatus.levelProgress : 0} 
                className="h-4 transition-all duration-1000"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-white drop-shadow">
                  {Math.floor(userStatus.levelProgress)}%
                </span>
              </div>
            </div>
          </div>

          {showDetails && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-semibold">{userStatus.stars}</div>
                    <div className="text-xs text-gray-600">Stars Earned</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold">{userStatus.streaks.daily}</div>
                    <div className="text-xs text-gray-600">Day Streak</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-semibold">{userStatus.badges.length}</div>
                    <div className="text-xs text-gray-600">Badges Earned</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-semibold">{userStatus.statistics.storiesCompleted}</div>
                    <div className="text-xs text-gray-600">Stories Read</div>
                  </div>
                </div>
              </div>

              {/* Next Rewards */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Next Level Rewards
                </h4>
                <div className="flex gap-3">
                  <Badge className="bg-white">
                    +{(userStatus.level + 1) * 5} Stars
                  </Badge>
                  <Badge className="bg-white">
                    New Title Unlock
                  </Badge>
                  {userStatus.level % 5 === 4 && (
                    <Badge className="bg-white">
                      Special Feature!
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}