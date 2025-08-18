import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { BookOpen, Plus, Play, Star, Calendar, Users, ChevronRight } from 'lucide-react';
import { apiClient } from '../lib/api';

export function SeriesManager({ selectedChild, onSeriesStoryGenerated }) {
  const [series, setSeries] = useState([]);
  const [childStories, setChildStories] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSeriesData, setNewSeriesData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (selectedChild) {
      loadSeries();
      loadChildStories();
    }
  }, [selectedChild]);

  const loadSeries = async () => {
    if (!selectedChild) return;
    
    try {
      const response = await apiClient.getChildSeries(selectedChild.id);
      setSeries(response.series);
    } catch (error) {
      console.error('Error loading series:', error);
    }
  };

  const loadChildStories = async () => {
    if (!selectedChild) return;
    
    try {
      const response = await apiClient.getChildStories(selectedChild.id, 1, 50);
      setChildStories(response.stories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleCreateSeries = async () => {
    if (!selectedChild || !newSeriesData.title.trim()) return;

    setIsCreating(true);
    try {
      const response = await apiClient.createSeries({
        ...newSeriesData,
        child_id: selectedChild.id
      });
      
      setSeries(prev => [...prev, response.series]);
      setNewSeriesData({ title: '', description: '' });
    } catch (error) {
      console.error('Error creating series:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddStoryToSeries = async (seriesId, storyData) => {
    try {
      const response = await apiClient.addStoryToSeries({
        series_id: seriesId,
        ...storyData
      });
      
      onSeriesStoryGenerated(response.story);
      loadSeries(); // Refresh series data
      loadChildStories(); // Refresh stories
    } catch (error) {
      console.error('Error adding story to series:', error);
    }
  };

  const getSeriesStories = (seriesId) => {
    return childStories.filter(story => story.series_id === seriesId);
  };

  const getStandaloneStories = () => {
    return childStories.filter(story => !story.series_id);
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
            Choose a child profile to manage story series
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span>Story Series for {selectedChild.name}</span>
          </CardTitle>
          <CardDescription>
            Create ongoing adventures and manage story collections
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="series" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="series">Story Series</TabsTrigger>
          <TabsTrigger value="standalone">Individual Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="series" className="space-y-6">
          {/* Create New Series */}
          <Card className="border-dashed border-2 border-indigo-300 bg-indigo-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Series</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="series-title">Series Title</Label>
                <Input
                  id="series-title"
                  value={newSeriesData.title}
                  onChange={(e) => setNewSeriesData(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder="e.g., Adventures of Emma and her Magic Teddy"
                />
              </div>
              
              <div>
                <Label htmlFor="series-description">Description (optional)</Label>
                <Input
                  id="series-description"
                  value={newSeriesData.description}
                  onChange={(e) => setNewSeriesData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Brief description of the series theme"
                />
              </div>
              
              <Button
                onClick={handleCreateSeries}
                disabled={!newSeriesData.title.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Series'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Series */}
          <div className="grid gap-6">
            {series.map((seriesItem) => (
              <SeriesCard
                key={seriesItem.id}
                series={seriesItem}
                stories={getSeriesStories(seriesItem.id)}
                selectedChild={selectedChild}
                onAddStory={handleAddStoryToSeries}
              />
            ))}
            
            {series.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No Series Yet
                  </h3>
                  <p className="text-gray-500">
                    Create your first story series to begin ongoing adventures
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="standalone" className="space-y-4">
          <div className="grid gap-4">
            {getStandaloneStories().map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
            
            {getStandaloneStories().length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No Individual Stories
                  </h3>
                  <p className="text-gray-500">
                    Individual stories will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeriesCard({ series, stories, selectedChild, onAddStory }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);

  const handleGenerateNextEpisode = async () => {
    setIsGenerating(true);
    try {
      const favoriteItem = selectedChild.favorite_items?.[0] || 'toy';
      await onAddStory(series.id, {
        favorite_item: favoriteItem,
        theme: 'adventure',
        genre: 'exploration'
      });
      setShowAddStory(false);
    } catch (error) {
      console.error('Error generating episode:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-indigo-800">
              {series.title}
            </CardTitle>
            {series.description && (
              <CardDescription className="mt-1">
                {series.description}
              </CardDescription>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">
                {series.story_count} episodes
              </Badge>
              <span className="text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Created {new Date(series.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Episode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Episode</DialogTitle>
                <DialogDescription>
                  Generate the next episode in "{series.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will create Episode {series.story_count + 1} continuing the adventures 
                  from previous episodes.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleGenerateNextEpisode}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Episode'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddStory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {stories.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 mb-2">Episodes:</h4>
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full text-sm font-medium text-indigo-600">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">{story.title}</h5>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{story.reading_time_minutes} min read</span>
                      {story.is_favorite && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Play className="h-3 w-3 mr-1" />
                  Read
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No episodes yet. Add the first episode to start the series!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StoryCard({ story }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">{story.title}</h4>
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <span>{story.theme} • {story.genre?.replace('_', ' ')}</span>
              <span>{story.reading_time_minutes} min read</span>
              <span>{new Date(story.created_at).toLocaleDateString()}</span>
              {story.is_favorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              )}
            </div>
          </div>
          <Button size="sm" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

