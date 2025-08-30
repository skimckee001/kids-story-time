import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Trophy, Star, Lock, CheckCircle } from 'lucide-react';
import gamification from '../../lib/gamification';

export function BadgeGallery({ userId, readingLevel = 'beginningReader' }) {
  const [userStatus, setUserStatus] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    loadUserStatus();
  }, [userId]);

  const loadUserStatus = async () => {
    const status = gamification.getUserStatus();
    setUserStatus(status);
  };

  if (!userStatus) {
    return <div>Loading badges...</div>;
  }

  const BadgeCard = ({ badge, isUnlocked }) => (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isUnlocked
          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg'
          : 'border-gray-300 bg-gray-50 opacity-75'
      }`}
      onClick={() => setSelectedBadge(badge)}
    >
      {isUnlocked && (
        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500" />
      )}
      
      <div className="text-center">
        <div className="text-4xl mb-2">{badge.icon}</div>
        <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {badge.name}
        </h4>
        <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
        
        {!isUnlocked && (
          <div className="mt-2">
            <Lock className="h-4 w-4 text-gray-400 mx-auto" />
          </div>
        )}
        
        {isUnlocked && (
          <div className="mt-2 flex justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              +{badge.xpReward} XP
            </Badge>
            <Badge variant="secondary" className="text-xs">
              +{badge.starReward} ⭐
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Badge Collection
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {userStatus.badges.length} / {Object.keys(gamification.badges).length} Unlocked
          </span>
          <Progress 
            value={(userStatus.badges.length / Object.keys(gamification.badges).length) * 100} 
            className="w-32"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Badges</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.values(gamification.badges).map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={userStatus.badges.includes(badge.id)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="unlocked" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userStatus.unlockedBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} isUnlocked={true} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="locked" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userStatus.availableBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} isUnlocked={false} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedBadge.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{selectedBadge.name}</h3>
                <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
                
                {userStatus.badges.includes(selectedBadge.id) ? (
                  <div>
                    <Badge className="bg-green-500 text-white mb-4">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unlocked!
                    </Badge>
                    <div className="flex justify-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          +{selectedBadge.xpReward}
                        </div>
                        <div className="text-xs text-gray-600">XP Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          +{selectedBadge.starReward}
                        </div>
                        <div className="text-xs text-gray-600">Stars Earned</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Badge variant="secondary" className="mb-4">
                      <Lock className="h-4 w-4 mr-1" />
                      Locked
                    </Badge>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Complete the requirements to unlock this badge and earn:
                      </p>
                      <div className="flex justify-center gap-2 mt-2">
                        <Badge variant="outline">+{selectedBadge.xpReward} XP</Badge>
                        <Badge variant="outline">+{selectedBadge.starReward} ⭐</Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}