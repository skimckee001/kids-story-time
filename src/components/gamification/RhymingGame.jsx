import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Music, Volume2, CheckCircle, XCircle } from 'lucide-react';
import gamification from '../../lib/gamification';

export function RhymingGame({ 
  storyText,
  onComplete,
  readingLevel = 'earlyPhonics',
  childName = 'Friend'
}) {
  const [rhymePairs, setRhymePairs] = useState([]);
  const [currentPair, setCurrentPair] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [showFeedback, setShowFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Common rhyming patterns for early readers
  const rhymePatterns = [
    { pattern: 'at', words: ['cat', 'hat', 'mat', 'bat', 'rat', 'sat', 'fat', 'pat'] },
    { pattern: 'an', words: ['can', 'man', 'pan', 'ran', 'tan', 'van', 'fan', 'plan'] },
    { pattern: 'ig', words: ['big', 'dig', 'fig', 'pig', 'wig', 'jig', 'rig'] },
    { pattern: 'og', words: ['dog', 'fog', 'hog', 'log', 'jog', 'frog', 'clog'] },
    { pattern: 'un', words: ['fun', 'run', 'sun', 'bun', 'gun', 'nun', 'spun'] },
    { pattern: 'et', words: ['get', 'let', 'met', 'net', 'pet', 'set', 'wet', 'jet'] },
    { pattern: 'ake', words: ['make', 'take', 'bake', 'cake', 'lake', 'wake', 'rake'] },
    { pattern: 'ing', words: ['sing', 'ring', 'king', 'wing', 'bring', 'spring', 'thing'] },
    { pattern: 'ight', words: ['light', 'night', 'right', 'might', 'sight', 'fight', 'bright'] },
    { pattern: 'ay', words: ['day', 'way', 'say', 'play', 'may', 'stay', 'pay', 'ray'] }
  ];

  useEffect(() => {
    generateRhymePairs();
  }, [storyText]);

  const generateRhymePairs = () => {
    // Extract words from story or use predefined sets
    const pairs = [];
    const usedPatterns = new Set();
    
    // Generate 5 rhyme pairs
    for (let i = 0; i < 5 && i < rhymePatterns.length; i++) {
      const pattern = rhymePatterns[i];
      const availableWords = pattern.words.filter(w => !usedPatterns.has(w));
      
      if (availableWords.length >= 2) {
        const shuffled = availableWords.sort(() => Math.random() - 0.5);
        pairs.push({
          id: i,
          pattern: pattern.pattern,
          correct: [shuffled[0], shuffled[1]],
          options: [
            shuffled[0],
            shuffled[1],
            getDistractor(pattern.pattern),
            getDistractor(pattern.pattern)
          ].sort(() => Math.random() - 0.5)
        });
        
        shuffled.slice(0, 2).forEach(w => usedPatterns.add(w));
      }
    }
    
    setRhymePairs(pairs);
    setCurrentPair(0);
    setMatchedPairs([]);
    setScore(0);
  };

  const getDistractor = (avoidPattern) => {
    // Get a word that doesn't rhyme with the pattern
    const distractors = ['tree', 'book', 'fish', 'ball', 'star', 'moon', 'door', 'bird'];
    return distractors.find(w => !w.endsWith(avoidPattern.slice(-2))) || 'word';
  };

  const playWordSound = (word) => {
    // Use Web Speech API to pronounce the word
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8; // Slower for children
      utterance.pitch = 1.2; // Slightly higher pitch
      speechSynthesis.speak(utterance);
    }
  };

  const handleWordSelect = async (word) => {
    if (selectedWords.includes(word)) {
      // Deselect word
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else if (selectedWords.length < 2) {
      // Select word
      const newSelected = [...selectedWords, word];
      setSelectedWords(newSelected);
      playWordSound(word);
      
      // Check if two words are selected
      if (newSelected.length === 2) {
        checkMatch(newSelected);
      }
    }
  };

  const checkMatch = async (words) => {
    const pair = rhymePairs[currentPair];
    setAttempts(prev => prev + 1);
    
    const isCorrect = 
      pair.correct.includes(words[0]) && 
      pair.correct.includes(words[1]) &&
      words[0] !== words[1];
    
    if (isCorrect) {
      // Correct match!
      setShowFeedback('correct');
      setMatchedPairs(prev => [...prev, currentPair]);
      
      // Calculate points based on attempts
      const points = attempts === 1 ? 20 : attempts === 2 ? 15 : 10;
      setScore(prev => prev + points);
      
      // Award XP and stars
      await gamification.addXP(10, 'rhyme_match');
      await gamification.addStars(2, 'rhyme_match');
      
      // Play success sound
      playSuccessSound();
      
      setTimeout(() => {
        setSelectedWords([]);
        setShowFeedback(null);
        setAttempts(0);
        
        // Move to next pair or complete
        if (currentPair < rhymePairs.length - 1) {
          setCurrentPair(prev => prev + 1);
        } else {
          handleCompletion();
        }
      }, 2000);
    } else {
      // Wrong match
      setShowFeedback('wrong');
      playErrorSound();
      
      setTimeout(() => {
        setSelectedWords([]);
        setShowFeedback(null);
      }, 1500);
    }
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659]; // C and E
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        }, index * 100);
      });
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  };

  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 200; // Low frequency
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  };

  const handleCompletion = async () => {
    // Award completion bonus
    await gamification.addStars(15, 'rhyme_game_complete');
    await gamification.addXP(30, 'rhyme_game_complete');
    
    // Update achievement
    await gamification.updateAchievementProgress('earlyPhonics', 'rhyme_master', rhymePairs.length);
    
    if (onComplete) {
      onComplete({
        pairsMatched: rhymePairs.length,
        score: score,
        perfectScore: score === 100
      });
    }
  };

  const getHint = () => {
    const pair = rhymePairs[currentPair];
    return `These words end with "-${pair.pattern}"`;
  };

  if (rhymePairs.length === 0) {
    return <div>Loading rhyming game...</div>;
  }

  const currentRhymePair = rhymePairs[currentPair];

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-purple-800 flex items-center gap-2">
              <Music className="h-5 w-5" />
              Rhyming Words Game
            </h3>
            <Badge variant="secondary">
              Score: {score}
            </Badge>
          </div>
          <p className="text-sm text-purple-700">
            Find the two words that rhyme, {childName}! Tap to hear them!
          </p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Rhyme Pairs</span>
            <span>{matchedPairs.length} / {rhymePairs.length} matched</span>
          </div>
          <div className="flex gap-1">
            {rhymePairs.map((pair, index) => (
              <div
                key={pair.id}
                className={`flex-1 h-2 rounded ${
                  matchedPairs.includes(index) 
                    ? 'bg-green-500' 
                    : index === currentPair 
                    ? 'bg-blue-500 animate-pulse' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Word Options */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {currentRhymePair.options.map((word, index) => (
            <Button
              key={`${word}-${index}`}
              variant={selectedWords.includes(word) ? 'default' : 'outline'}
              size="lg"
              onClick={() => handleWordSelect(word)}
              disabled={showFeedback !== null}
              className={`h-20 text-xl font-bold transition-all ${
                selectedWords.includes(word) 
                  ? 'bg-purple-500 hover:bg-purple-600 text-white scale-105' 
                  : ''
              } ${
                showFeedback === 'correct' && currentRhymePair.correct.includes(word)
                  ? 'bg-green-500 animate-pulse'
                  : ''
              } ${
                showFeedback === 'wrong' && selectedWords.includes(word)
                  ? 'bg-red-500 animate-shake'
                  : ''
              }`}
            >
              <Volume2 className="h-5 w-5 mr-2" />
              {word}
            </Button>
          ))}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`text-center p-3 rounded-lg mb-4 ${
            showFeedback === 'correct' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {showFeedback === 'correct' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">
                    Great job! "{currentRhymePair.correct[0]}" and "{currentRhymePair.correct[1]}" rhyme!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">
                    Not quite! Try again to find the rhyming pair.
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hint */}
        {attempts > 1 && !showFeedback && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alert(getHint())}
            >
              Need a hint? 💡
            </Button>
          </div>
        )}

        {/* Completion Message */}
        {matchedPairs.length === rhymePairs.length && (
          <div className="mt-4 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-purple-800 mb-2">
              Amazing Rhyming, {childName}!
            </h3>
            <p className="text-purple-700 mb-3">
              You matched all {rhymePairs.length} rhyme pairs!
            </p>
            <div className="flex justify-center gap-4">
              <Badge className="bg-purple-600 text-white">
                +15 Stars Earned
              </Badge>
              <Badge className="bg-pink-600 text-white">
                +30 XP Earned
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}