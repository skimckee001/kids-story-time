import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Search, CheckCircle, Award } from 'lucide-react';
import gamification from '../../lib/gamification';

export function SightWordHunt({ 
  storyText, 
  onComplete,
  readingLevel = 'beginningReader',
  childName = 'Friend'
}) {
  const [targetWords, setTargetWords] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [timeBonus, setTimeBonus] = useState(100);
  const timerRef = useRef(null);

  // Common sight words by grade level
  const sightWordsByLevel = {
    beginningReader: [
      'the', 'and', 'is', 'was', 'are', 'were', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'can', 'could', 'should', 'would', 'may', 'might',
      'what', 'where', 'when', 'who', 'why', 'how', 'there', 'their', 'they',
      'this', 'that', 'these', 'those', 'here', 'from', 'with', 'about'
    ],
    developingReader: [
      'because', 'through', 'although', 'however', 'therefore', 'before', 'after',
      'during', 'while', 'since', 'until', 'unless', 'between', 'among', 'within'
    ]
  };

  useEffect(() => {
    initializeHunt();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storyText]);

  const initializeHunt = () => {
    // Extract sight words from the story
    const words = sightWordsByLevel[readingLevel] || sightWordsByLevel.beginningReader;
    const storyWords = storyText.toLowerCase().split(/\s+/);
    
    // Find sight words that appear in the story
    const wordsInStory = words.filter(word => 
      storyWords.some(storyWord => storyWord.includes(word))
    );
    
    // Select 5-8 random sight words as targets
    const selectedWords = wordsInStory
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(8, Math.max(5, wordsInStory.length)));
    
    setTargetWords(selectedWords);
    setFoundWords(new Set());
    setScore(0);
  };

  const startTimer = () => {
    // Decrease time bonus over time (max 100 points, min 10)
    timerRef.current = setInterval(() => {
      setTimeBonus(prev => Math.max(10, prev - 1));
    }, 1000);
  };

  const handleWordClick = async (word, index) => {
    const normalizedWord = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
    
    if (targetWords.includes(normalizedWord) && !foundWords.has(normalizedWord)) {
      // Correct word found!
      setFoundWords(prev => new Set([...prev, normalizedWord]));
      setSelectedWord({ word: normalizedWord, index, correct: true });
      
      // Calculate points
      const points = 10 + Math.floor(timeBonus / 10);
      setScore(prev => prev + points);
      
      // Award XP and stars
      await gamification.addXP(5, 'sight_word_found');
      await gamification.addStars(1, 'sight_word_found');
      
      // Show feedback
      showWordFeedback(true);
      
      // Check if all words found
      if (foundWords.size + 1 === targetWords.length) {
        handleCompletion();
      }
    } else if (!foundWords.has(normalizedWord)) {
      // Wrong word
      setSelectedWord({ word: normalizedWord, index, correct: false });
      showWordFeedback(false);
    }
  };

  const showWordFeedback = (correct) => {
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedWord(null);
    }, 1500);
  };

  const handleCompletion = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calculate final bonus
    const perfectBonus = timeBonus > 50 ? 20 : 10;
    const totalScore = score + perfectBonus;
    
    // Award completion rewards
    await gamification.addStars(10, 'sight_word_hunt_complete');
    await gamification.addXP(25, 'sight_word_hunt_complete');
    
    // Update achievement
    await gamification.updateAchievementProgress(
      'beginningReader', 
      'sight_word_hunter', 
      targetWords.length
    );
    
    if (onComplete) {
      onComplete({
        wordsFound: targetWords.length,
        score: totalScore,
        timeBonus: timeBonus
      });
    }
  };

  const renderStoryWithHighlights = () => {
    const words = storyText.split(/(\s+)/);
    
    return words.map((word, index) => {
      const normalizedWord = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
      const isTarget = targetWords.includes(normalizedWord);
      const isFound = foundWords.has(normalizedWord);
      const isSelected = selectedWord?.index === index;
      
      if (word.trim() === '') {
        return <span key={index}>{word}</span>;
      }
      
      return (
        <span
          key={index}
          onClick={() => handleWordClick(word, index)}
          className={`cursor-pointer transition-all inline-block ${
            isFound 
              ? 'bg-green-200 text-green-800 font-semibold px-1 rounded' 
              : isTarget && !isFound
              ? 'hover:bg-yellow-100 hover:text-yellow-800'
              : 'hover:bg-gray-100'
          } ${
            isSelected 
              ? selectedWord.correct 
                ? 'animate-pulse bg-green-300' 
                : 'animate-shake bg-red-200'
              : ''
          }`}
        >
          {word}
        </span>
      );
    });
  };

  const getHintWord = () => {
    const remainingWords = targetWords.filter(word => !foundWords.has(word));
    if (remainingWords.length > 0) {
      return remainingWords[0];
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Sight Word Hunt
            </h3>
            <Badge variant="secondary">
              Score: {score}
            </Badge>
          </div>
          <p className="text-sm text-blue-700">
            Find these special words in the story, {childName}!
          </p>
        </div>

        {/* Target Words */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {targetWords.map(word => (
              <Badge
                key={word}
                variant={foundWords.has(word) ? 'default' : 'outline'}
                className={`transition-all ${
                  foundWords.has(word) 
                    ? 'bg-green-500 text-white' 
                    : 'hover:bg-blue-100'
                }`}
              >
                {foundWords.has(word) && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {word}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{foundWords.size} / {targetWords.length} words found</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(foundWords.size / targetWords.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Story Text */}
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
          <div className="prose prose-lg leading-relaxed">
            {renderStoryWithHighlights()}
          </div>
        </div>

        {/* Feedback Message */}
        {showFeedback && selectedWord && (
          <div className={`text-center p-3 rounded-lg mb-4 animate-slideIn ${
            selectedWord.correct 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {selectedWord.correct 
              ? `Great job! You found "${selectedWord.word}"! +${10 + Math.floor(timeBonus / 10)} points!` 
              : `Not quite! Keep looking for the sight words.`}
          </div>
        )}

        {/* Hint Button */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hint = getHintWord();
              if (hint) {
                alert(`Hint: Look for the word "${hint}" in the story!`);
                setScore(prev => Math.max(0, prev - 5)); // Penalty for using hint
              }
            }}
            disabled={foundWords.size === targetWords.length}
          >
            Need a Hint? (-5 points)
          </Button>
          
          <div className="text-sm text-gray-600">
            Time Bonus: {timeBonus}
          </div>
        </div>

        {/* Completion Message */}
        {foundWords.size === targetWords.length && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg text-center">
            <Award className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-yellow-800 mb-2">
              Fantastic Work, {childName}!
            </h3>
            <p className="text-yellow-700 mb-3">
              You found all {targetWords.length} sight words!
            </p>
            <div className="flex justify-center gap-4">
              <Badge className="bg-yellow-600 text-white">
                +10 Stars Earned
              </Badge>
              <Badge className="bg-blue-600 text-white">
                +25 XP Earned
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-shake {
    animation: shake 0.5s;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s;
  }
`;
document.head.appendChild(style);