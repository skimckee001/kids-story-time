import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Star, Trophy, Sparkles, BookOpen, Gamepad2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import gamification from '../lib/gamification';
import { StarTappingGame } from './gamification/StarTappingGame';
import { SightWordHunt } from './gamification/SightWordHunt';
import { RhymingGame } from './gamification/RhymingGame';
import { LevelProgress } from './gamification/LevelProgress';
import Header from './Header';
import AdSense from './AdSense';
import './StoryDisplay.css';

export function StoryDisplayWithGames({ 
  story, 
  onBack, 
  onSave, 
  onShowLibrary, 
  onShowAuth, 
  user, 
  subscriptionTier, 
  starPoints,
  childProfile 
}) {
  const [activeTab, setActiveTab] = useState('story');
  const [gameCompleted, setGameCompleted] = useState({
    starTapping: false,
    sightWords: false,
    rhyming: false
  });
  const [totalRewards, setTotalRewards] = useState({
    stars: 0,
    xp: 0
  });
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);

  useEffect(() => {
    // Track story view
    trackStoryActivity('story_viewed');
  }, [story]);

  const trackStoryActivity = async (activity) => {
    if (!user) return;
    
    try {
      await gamification.trackStoryActivity(activity, {
        storyId: story.id,
        wordCount: story.content?.split(' ').length || 0,
        readingTime: Math.ceil((story.content?.split(' ').length || 0) / 200) // Avg reading speed
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const handleGameComplete = async (gameType, results) => {
    setGameCompleted(prev => ({ ...prev, [gameType]: true }));
    setTotalRewards(prev => ({
      stars: prev.stars + (results.bonusEarned || 0),
      xp: prev.xp + (results.xpEarned || 0)
    }));

    // Check if all games completed
    const allCompleted = gameType === 'starTapping' ? 
      gameCompleted.sightWords && gameCompleted.rhyming :
      gameType === 'sightWords' ?
      gameCompleted.starTapping && gameCompleted.rhyming :
      gameCompleted.starTapping && gameCompleted.sightWords;

    if (allCompleted) {
      await handleAllGamesComplete();
    }
  };

  const handleAllGamesComplete = async () => {
    // Award completion bonus
    await gamification.addStars(25, 'all_games_complete');
    await gamification.addXP(50, 'all_games_complete');
    
    // Track story completion
    await trackStoryActivity('story_completed');
    
    // Show celebration
    setShowCompletionCelebration(true);
    setTimeout(() => setShowCompletionCelebration(false), 5000);
  };

  const getReadingLevel = () => {
    const age = childProfile?.age || 6;
    if (age <= 6) return 'preReader';
    if (age <= 7) return 'earlyPhonics';
    if (age <= 8) return 'beginningReader';
    if (age <= 10) return 'developingReader';
    if (age <= 13) return 'fluentReader';
    return 'insightfulReader';
  };

  const readingLevel = getReadingLevel();
  const showStarTapping = ['preReader', 'earlyPhonics'].includes(readingLevel);
  const showRhyming = ['earlyPhonics', 'beginningReader'].includes(readingLevel);
  const showSightWords = ['beginningReader', 'developingReader'].includes(readingLevel);

  return (
    <div className="story-display-container">
      <Header 
        user={user}
        onShowAuth={onShowAuth}
        onShowLibrary={onShowLibrary}
        subscriptionTier={subscriptionTier}
        starPoints={starPoints}
      />

      <div className="story-content-wrapper">
        {/* Level Progress Bar */}
        <div className="mb-4">
          <LevelProgress compact={true} />
        </div>

        {/* Story Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="story">
              <BookOpen className="h-4 w-4 mr-2" />
              Story
            </TabsTrigger>
            {showStarTapping && (
              <TabsTrigger value="stars" disabled={!story.imageUrl}>
                <Sparkles className="h-4 w-4 mr-2" />
                Star Hunt
                {gameCompleted.starTapping && <Star className="h-3 w-3 ml-1 text-yellow-500" />}
              </TabsTrigger>
            )}
            {showRhyming && (
              <TabsTrigger value="rhyme">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Rhymes
                {gameCompleted.rhyming && <Star className="h-3 w-3 ml-1 text-yellow-500" />}
              </TabsTrigger>
            )}
            {showSightWords && (
              <TabsTrigger value="words">
                <Trophy className="h-4 w-4 mr-2" />
                Word Hunt
                {gameCompleted.sightWords && <Star className="h-3 w-3 ml-1 text-yellow-500" />}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Story Tab */}
          <TabsContent value="story" className="mt-4">
            <Card>
              <CardContent className="p-6">
                {story.imageUrl && (
                  <div className="story-image-container mb-4">
                    <img 
                      src={story.imageUrl} 
                      alt="Story illustration" 
                      className="story-image rounded-lg"
                    />
                  </div>
                )}
                
                <h2 className="story-title text-2xl font-bold mb-4">
                  {story.title}
                </h2>
                
                <div className="story-text prose prose-lg">
                  {story.content}
                </div>

                {/* Ad placement for free tier */}
                {subscriptionTier === 'free' && (
                  <div className="my-6">
                    <AdSense slot="story-middle" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Star Tapping Game */}
          {showStarTapping && (
            <TabsContent value="stars" className="mt-4">
              <StarTappingGame
                storyImage={story.imageUrl}
                onComplete={(results) => handleGameComplete('starTapping', results)}
                readingLevel={readingLevel}
                childName={childProfile?.name || 'Friend'}
              />
            </TabsContent>
          )}

          {/* Rhyming Game */}
          {showRhyming && (
            <TabsContent value="rhyme" className="mt-4">
              <RhymingGame
                storyText={story.content}
                onComplete={(results) => handleGameComplete('rhyming', results)}
                readingLevel={readingLevel}
                childName={childProfile?.name || 'Friend'}
              />
            </TabsContent>
          )}

          {/* Sight Word Hunt */}
          {showSightWords && (
            <TabsContent value="words" className="mt-4">
              <SightWordHunt
                storyText={story.content}
                onComplete={(results) => handleGameComplete('sightWords', results)}
                readingLevel={readingLevel}
                childName={childProfile?.name || 'Friend'}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Rewards Summary */}
        {(totalRewards.stars > 0 || totalRewards.xp > 0) && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Session Rewards:</span>
                <div className="flex gap-3">
                  <Badge variant="secondary">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    +{totalRewards.stars} Stars
                  </Badge>
                  <Badge variant="secondary">
                    <Trophy className="h-4 w-4 mr-1 text-purple-500" />
                    +{totalRewards.xp} XP
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Story Actions */}
        <div className="story-actions mt-6 flex gap-3">
          <Button onClick={onBack} variant="outline">
            Back to Stories
          </Button>
          <Button onClick={onSave} variant="default">
            Save Story
          </Button>
          <Button onClick={onShowLibrary} variant="outline">
            My Library
          </Button>
        </div>

        {/* Completion Celebration */}
        {showCompletionCelebration && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-8 text-center animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-2">Amazing Job!</h2>
              <p className="text-xl mb-4">You completed all the activities!</p>
              <div className="flex justify-center gap-3">
                <Badge className="text-lg px-4 py-2">
                  <Star className="h-5 w-5 mr-2" />
                  +25 Bonus Stars!
                </Badge>
                <Badge className="text-lg px-4 py-2">
                  <Trophy className="h-5 w-5 mr-2" />
                  +50 Bonus XP!
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}