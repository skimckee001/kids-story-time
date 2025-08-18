import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { BookOpen, ChevronRight, RotateCcw, Star, Share2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export function InteractiveStory({ story, onChoiceMade, onStoryComplete }) {
  const [currentChoices, setCurrentChoices] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [storyProgress, setStoryProgress] = useState(0);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);
  const [storyParts, setStoryParts] = useState([]);

  useEffect(() => {
    if (story) {
      initializeStory();
    }
  }, [story]);

  const initializeStory = () => {
    // Split story content into parts for progressive revelation
    const parts = story.content.split('\n\n').filter(part => part.trim());
    setStoryParts(parts);
    
    // Load interactive choices
    if (story.interactive_choices) {
      setCurrentChoices(story.interactive_choices);
    }
    
    setStoryProgress(0);
    setSelectedChoices({});
  };

  const handleChoice = async (choiceId, optionIndex, optionText) => {
    setIsProcessingChoice(true);
    
    try {
      // Record the choice
      await apiClient.makeChoice(choiceId, optionIndex);
      
      // Update local state
      setSelectedChoices(prev => ({
        ...prev,
        [choiceId]: {
          optionIndex,
          optionText
        }
      }));
      
      // Update progress
      const choiceIndex = currentChoices.findIndex(choice => choice.id === choiceId);
      const newProgress = ((choiceIndex + 1) / currentChoices.length) * 100;
      setStoryProgress(newProgress);
      
      // Notify parent component
      if (onChoiceMade) {
        onChoiceMade(choiceId, optionIndex, optionText);
      }
      
      // Check if story is complete
      if (choiceIndex === currentChoices.length - 1) {
        setTimeout(() => {
          if (onStoryComplete) {
            onStoryComplete(selectedChoices);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error making choice:', error);
    } finally {
      setIsProcessingChoice(false);
    }
  };

  const resetStory = () => {
    setSelectedChoices({});
    setStoryProgress(0);
  };

  const getVisibleStoryParts = () => {
    // Show story parts progressively based on choices made
    const choicesMade = Object.keys(selectedChoices).length;
    const partsToShow = Math.min(storyParts.length, choicesMade + 1);
    return storyParts.slice(0, partsToShow);
  };

  const getCurrentChoice = () => {
    const choicesMade = Object.keys(selectedChoices).length;
    return currentChoices[choicesMade];
  };

  const isStoryComplete = () => {
    return Object.keys(selectedChoices).length === currentChoices.length;
  };

  if (!story) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Story Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-amber-800 flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span>{story.title}</span>
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary">Interactive Story</Badge>
                <Badge variant="outline">{currentChoices.length} Choices</Badge>
                {story.is_favorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={resetStory}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          {currentChoices.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-amber-700 mb-2">
                <span>Story Progress</span>
                <span>{Object.keys(selectedChoices).length} / {currentChoices.length} choices made</span>
              </div>
              <Progress value={storyProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Story Content */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none">
            {getVisibleStoryParts().map((part, index) => (
              <div
                key={index}
                className={`mb-6 p-4 bg-white rounded-lg shadow-sm border border-blue-100 ${
                  index === getVisibleStoryParts().length - 1 ? 'animate-fade-in' : ''
                }`}
              >
                <p className="text-gray-800 leading-relaxed">
                  {part}
                </p>
              </div>
            ))}
          </div>
          
          {/* Choice Summary */}
          {Object.keys(selectedChoices).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Your Choices So Far:</h4>
              <div className="space-y-2">
                {Object.entries(selectedChoices).map(([choiceId, choice], index) => {
                  const choiceData = currentChoices.find(c => c.id === parseInt(choiceId));
                  return (
                    <div key={choiceId} className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-200 rounded-full text-xs font-medium text-blue-800">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>{choiceData?.choice_text}:</strong> {choice.optionText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Choice */}
      {!isStoryComplete() && getCurrentChoice() && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              Make Your Choice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-800 font-medium">
                {getCurrentChoice().choice_text}
              </p>
              
              <div className="grid gap-3">
                {getCurrentChoice().options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 text-left justify-start hover:bg-green-100 hover:border-green-300 transition-colors"
                    onClick={() => handleChoice(getCurrentChoice().id, index, option)}
                    disabled={isProcessingChoice}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full text-sm font-medium text-green-700">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      <ChevronRight className="h-4 w-4 text-green-600" />
                    </div>
                  </Button>
                ))}
              </div>
              
              {isProcessingChoice && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing your choice...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Complete */}
      {isStoryComplete() && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="text-center py-8">
            <div className="mb-4">
              <Star className="h-12 w-12 mx-auto text-purple-500 mb-2" />
              <h3 className="text-xl font-bold text-purple-800 mb-2">
                Story Complete!
              </h3>
              <p className="text-purple-600">
                You've made all the choices and completed this interactive adventure!
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={resetStory} className="bg-purple-600 hover:bg-purple-700">
                <RotateCcw className="h-4 w-4 mr-2" />
                Read Again
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share Story
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Tips */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-800 mb-2">Interactive Story Tips:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Each choice you make affects how the story unfolds</li>
            <li>• There are no wrong choices - every path leads to a great adventure</li>
            <li>• You can restart the story anytime to explore different choices</li>
            <li>• Discuss the choices with your child to make it more engaging</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

