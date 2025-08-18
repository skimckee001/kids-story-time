import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  Image, Palette, Wand2, Download, Eye, RefreshCw, 
  Sparkles, Camera, Settings, Loader2 
} from 'lucide-react';
import { apiClient } from '../lib/api';

export function StoryIllustrations({ story, child, onIllustrationGenerated }) {
  const [illustrations, setIllustrations] = useState([]);
  const [illustrationStyles, setIllustrationStyles] = useState({});
  const [selectedStyle, setSelectedStyle] = useState('children_book');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScene, setSelectedScene] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showStylePreview, setShowStylePreview] = useState(false);

  useEffect(() => {
    if (story) {
      loadIllustrations();
      loadIllustrationStyles();
    }
  }, [story]);

  const loadIllustrations = async () => {
    try {
      const response = await fetch(`/api/story/${story.id}/illustrations`);
      const data = await response.json();
      if (data.success) {
        setIllustrations(data.illustrations);
      }
    } catch (error) {
      console.error('Error loading illustrations:', error);
    }
  };

  const loadIllustrationStyles = async () => {
    try {
      const response = await fetch('/api/illustration-styles');
      const data = await response.json();
      if (data.success) {
        setIllustrationStyles(data.styles);
      }
    } catch (error) {
      console.error('Error loading illustration styles:', error);
    }
  };

  const generateIllustration = async () => {
    if (!selectedScene && !customPrompt) {
      alert('Please select a scene or enter a custom description');
      return;
    }

    setIsGenerating(true);
    try {
      const sceneDescription = customPrompt || getSceneDescription(selectedScene);
      
      const response = await fetch('/api/generate-illustration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: story.id,
          scene_description: sceneDescription,
          child_name: child.name,
          favorite_item: child.favorite_items?.[0] || 'toy',
          art_style: selectedStyle,
          theme: story.theme,
          character_description: child.character_description || ''
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIllustrations(prev => [...prev, data.illustration]);
        if (onIllustrationGenerated) {
          onIllustrationGenerated(data.illustration);
        }
        setCustomPrompt('');
        setSelectedScene('');
      } else {
        alert('Failed to generate illustration: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating illustration:', error);
      alert('Failed to generate illustration');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSceneDescription = (sceneType) => {
    const sceneDescriptions = {
      'opening': `${child.name} discovering their magical ${child.favorite_items?.[0] || 'toy'} at the beginning of the adventure`,
      'adventure': `${child.name} on an exciting adventure with their ${child.favorite_items?.[0] || 'toy'}`,
      'challenge': `${child.name} facing a challenge or obstacle during their journey`,
      'friendship': `${child.name} meeting new friends or helping others`,
      'discovery': `${child.name} making an amazing discovery or finding something special`,
      'celebration': `${child.name} celebrating their success at the end of the story`,
      'magical_moment': `A magical moment where ${child.name}'s ${child.favorite_items?.[0] || 'toy'} shows its special power`,
      'landscape': `The beautiful setting or landscape where ${child.name}'s adventure takes place`
    };
    
    return sceneDescriptions[sceneType] || sceneDescriptions['adventure'];
  };

  const downloadIllustration = (illustration) => {
    const link = document.createElement('a');
    link.href = illustration.url;
    link.download = `${story.title}_illustration_${illustration.id}.png`;
    link.click();
  };

  const getStoryScenes = () => {
    // Extract potential scenes from story content
    const scenes = [
      { id: 'opening', name: 'Story Opening', description: 'The beginning of the adventure' },
      { id: 'adventure', name: 'Main Adventure', description: 'The exciting journey' },
      { id: 'challenge', name: 'Challenge Scene', description: 'Overcoming obstacles' },
      { id: 'friendship', name: 'Making Friends', description: 'Meeting new characters' },
      { id: 'discovery', name: 'Amazing Discovery', description: 'Finding something special' },
      { id: 'magical_moment', name: 'Magical Moment', description: 'When magic happens' },
      { id: 'landscape', name: 'Story Setting', description: 'The adventure location' },
      { id: 'celebration', name: 'Happy Ending', description: 'Celebrating success' }
    ];
    
    return scenes;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="h-6 w-6 text-pink-600" />
            <span>Story Illustrations</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({illustrations.length})</TabsTrigger>
          <TabsTrigger value="styles">Art Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Illustration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Art Style Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Art Style
                </label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(illustrationStyles).map(([key, style]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span className="font-medium">{style.name}</span>
                          <span className="text-xs text-gray-500">{style.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scene Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Story Scene
                </label>
                <Select value={selectedScene} onValueChange={setSelectedScene}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a scene to illustrate" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStoryScenes().map((scene) => (
                      <SelectItem key={scene.id} value={scene.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{scene.name}</span>
                          <span className="text-xs text-gray-500">{scene.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Custom Scene Description (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe a specific scene you'd like to illustrate..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateIllustration}
                disabled={isGenerating || (!selectedScene && !customPrompt)}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Illustration...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Illustration
                  </div>
                )}
              </Button>

              {/* Preview */}
              {(selectedScene || customPrompt) && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Preview Description:</h4>
                  <p className="text-sm text-purple-700">
                    {customPrompt || getSceneDescription(selectedScene)}
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Style: {illustrationStyles[selectedStyle]?.name}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          {illustrations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Illustrations Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Generate your first illustration to bring this story to life!
                </p>
                <Button
                  onClick={() => document.querySelector('[value="generate"]').click()}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Illustration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {illustrations.map((illustration) => (
                <IllustrationCard
                  key={illustration.id}
                  illustration={illustration}
                  onDownload={downloadIllustration}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="styles" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(illustrationStyles).map(([key, style]) => (
              <StyleCard
                key={key}
                styleKey={key}
                style={style}
                isSelected={selectedStyle === key}
                onSelect={() => setSelectedStyle(key)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IllustrationCard({ illustration, onDownload }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Image not available</p>
            </div>
          </div>
        ) : (
          <img
            src={illustration.url}
            alt={`Illustration ${illustration.id}`}
            className={`w-full h-full object-cover transition-opacity ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Scene {illustration.scene_number || 'Custom'}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(illustration.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(illustration)}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(illustration.url, '_blank')}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StyleCard({ styleKey, style, isSelected, onSelect }) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-pink-500 bg-pink-50' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${
            isSelected ? 'bg-pink-200' : 'bg-gray-100'
          }`}>
            <Palette className={`h-4 w-4 ${
              isSelected ? 'text-pink-600' : 'text-gray-600'
            }`} />
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">{style.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{style.description}</p>
            
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
              <strong>Style prompt:</strong> {style.example_prompt}
            </div>
          </div>
          
          {isSelected && (
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-pink-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

