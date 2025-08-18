import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { BookOpen, Sparkles, Wand2, Globe, Users, Lightbulb } from 'lucide-react';
import { apiClient } from '../lib/api';

export function StoryCreator({ selectedChild, onStoryGenerated }) {
  const [themes, setThemes] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    theme: 'adventure',
    genre: 'exploration',
    favorite_item: '',
    language: 'en',
    include_interactive: true
  });

  useEffect(() => {
    loadThemes();
    if (selectedChild) {
      loadSuggestions();
      // Set default favorite item if available
      if (selectedChild.favorite_items && selectedChild.favorite_items.length > 0) {
        setFormData(prev => ({
          ...prev,
          favorite_item: selectedChild.favorite_items[0]
        }));
      }
    }
  }, [selectedChild]);

  const loadThemes = async () => {
    try {
      const response = await apiClient.getThemes();
      setThemes(response.themes);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const loadSuggestions = async () => {
    if (!selectedChild) return;
    
    try {
      const response = await apiClient.getStorySuggestions(selectedChild.id);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleThemeChange = (theme) => {
    setFormData(prev => ({
      ...prev,
      theme,
      genre: themes[theme]?.genres[0] || 'exploration'
    }));
  };

  const handleGenerateStory = async () => {
    if (!selectedChild || !formData.favorite_item) return;

    setIsGenerating(true);
    try {
      const response = await apiClient.generateStory({
        child_id: selectedChild.id,
        ...formData
      });
      
      onStoryGenerated(response.story);
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      theme: suggestion.theme,
      genre: suggestion.genre
    }));
  };

  if (!selectedChild) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Select a Child Profile
          </h3>
          <p className="text-gray-500">
            Choose a child profile to start creating personalized stories
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-6 w-6 text-purple-600" />
            <span>Create Story for {selectedChild.name}</span>
          </CardTitle>
          <CardDescription>
            Craft a magical, personalized story with advanced features
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Create Story</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Story Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Favorite Item Selection */}
              <div>
                <Label htmlFor="favorite-item">Featured Item</Label>
                <Select
                  value={formData.favorite_item}
                  onValueChange={(value) => setFormData(prev => ({...prev, favorite_item: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a favorite item" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedChild.favorite_items?.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom item...</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.favorite_item === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom item"
                    onChange={(e) => setFormData(prev => ({...prev, favorite_item: e.target.value}))}
                  />
                )}
              </div>

              {/* Theme Selection */}
              <div>
                <Label>Story Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.theme === key
                          ? 'border-purple-400 bg-purple-100 text-purple-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium">{theme.name}</div>
                      <div className="text-sm opacity-75">{theme.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Selection */}
              {themes[formData.theme] && (
                <div>
                  <Label>Story Genre</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {themes[formData.theme].genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setFormData(prev => ({...prev, genre}))}
                        className={`p-3 rounded-lg border transition-all ${
                          formData.genre === genre
                            ? 'border-purple-400 bg-purple-100 text-purple-800'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-medium capitalize">
                          {genre.replace('_', ' ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Options */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-medium">Advanced Options</Label>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="interactive"
                    checked={formData.include_interactive}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      include_interactive: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="interactive" className="text-sm">
                    Include interactive choices
                  </Label>
                </div>

                <div>
                  <Label htmlFor="language" className="text-sm">Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData(prev => ({...prev, language: value}))}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateStory}
                disabled={isGenerating || !formData.favorite_item}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Magic...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Story
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Story Suggestions</span>
              </CardTitle>
              <CardDescription>
                Personalized story ideas based on {selectedChild.name}'s profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {suggestion.title_preview}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {suggestion.description}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.theme}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.genre.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Use This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

