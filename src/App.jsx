import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  BookOpen, Users, Settings, BarChart3, Sparkles, 
  Crown, Palette, Globe, Headphones, Image as ImageIcon,
  Menu, X, Home, Star
} from 'lucide-react';

// Import all components
import { ChildProfile } from './components/ChildProfile.jsx';
import { StoryCreator } from './components/StoryCreator.jsx';
import { SeriesManager } from './components/SeriesManager.jsx';
import { InteractiveStory } from './components/InteractiveStory.jsx';
import { AudioNarration } from './components/AudioNarration.jsx';
import { StoryIllustrations } from './components/StoryIllustrations.jsx';
import { ParentalDashboard } from './components/ParentalDashboard.jsx';
import { SubscriptionManager, useFeatureGate } from './components/SubscriptionManager.jsx';
import { OfflineIndicator, OfflineStoryManager } from './components/OfflineIndicator.jsx';

// Import hooks and utilities
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { apiClient } from './lib/api.js';
import { offlineManager } from './lib/offlineManager.js';

function App() {
  // State management
  const [children, setChildren] = useLocalStorage('children', []);
  const [selectedChild, setSelectedChild] = useState(null);
  const [currentStory, setCurrentStory] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOfflineStories, setShowOfflineStories] = useState(false);
  const [themes, setThemes] = useState({});
  const [languages, setLanguages] = useState({});
  
  // Feature gate hook
  const { checkFeatureAccess, trackUsage } = useFeatureGate();

  useEffect(() => {
    loadInitialData();
    
    // Set default selected child
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children]);

  const loadInitialData = async () => {
    try {
      // Load themes and languages
      const [themesResponse, languagesResponse] = await Promise.all([
        apiClient.getThemes(),
        apiClient.getAvailableLanguages()
      ]);
      
      setThemes(themesResponse.themes || {});
      setLanguages(languagesResponse.languages || {});
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleChildCreated = (child) => {
    const newChildren = [...children, child];
    setChildren(newChildren);
    setSelectedChild(child);
  };

  const handleStoryGenerated = async (story) => {
    setCurrentStory(story);
    trackUsage('story_generation');
    
    // Save story offline if feature is available
    if (checkFeatureAccess('offline_mode')) {
      try {
        await offlineManager.saveStoryOffline(story);
      } catch (error) {
        console.error('Failed to save story offline:', error);
      }
    }
  };

  const handleSeriesStoryGenerated = (story) => {
    setCurrentStory(story);
    trackUsage('story_generation');
    trackUsage('series_creation');
  };

  const handleAudioGenerated = (audioUrl) => {
    if (currentStory) {
      setCurrentStory(prev => ({ ...prev, audio_url: audioUrl }));
      trackUsage('audio_generation');
    }
  };

  const handleIllustrationGenerated = (illustration) => {
    if (currentStory) {
      setCurrentStory(prev => ({
        ...prev,
        illustrations: [...(prev.illustrations || []), illustration]
      }));
      trackUsage('illustration_generation');
    }
  };

  const handleChoiceMade = (choiceId, optionIndex, optionText) => {
    console.log('Choice made:', { choiceId, optionIndex, optionText });
  };

  const handleStoryComplete = (choices) => {
    console.log('Story completed with choices:', choices);
  };

  const handleUpgrade = (plan) => {
    console.log('Upgraded to plan:', plan);
    // Refresh the page to update feature access
    window.location.reload();
  };

  const navigation = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'stories', name: 'Create Stories', icon: BookOpen },
    { id: 'series', name: 'Story Series', icon: Star },
    { id: 'dashboard', name: 'Parental Dashboard', icon: BarChart3 },
    { id: 'subscription', name: 'Subscription', icon: Crown }
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView 
          children={children}
          selectedChild={selectedChild}
          onChildSelect={setSelectedChild}
          onCreateStory={() => setActiveTab('stories')}
          currentStory={currentStory}
          onStorySelect={setCurrentStory}
        />;
      
      case 'stories':
        return <StoryCreationView
          selectedChild={selectedChild}
          onStoryGenerated={handleStoryGenerated}
          themes={themes}
          languages={languages}
          checkFeatureAccess={checkFeatureAccess}
        />;
      
      case 'series':
        return <SeriesManager
          selectedChild={selectedChild}
          onSeriesStoryGenerated={handleSeriesStoryGenerated}
        />;
      
      case 'dashboard':
        return <ParentalDashboard
          children={children}
          onSettingsChange={(settings) => console.log('Settings changed:', settings)}
        />;
      
      case 'subscription':
        return <SubscriptionManager onUpgrade={handleUpgrade} />;
      
      default:
        return <HomeView 
          children={children}
          selectedChild={selectedChild}
          onChildSelect={setSelectedChild}
          onCreateStory={() => setActiveTab('stories')}
          currentStory={currentStory}
          onStorySelect={setCurrentStory}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Kids Story Time</h1>
                  <p className="text-xs text-gray-500">Full Product</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {selectedChild && (
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="p-1 bg-purple-100 rounded-full">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedChild.name}
                  </span>
                </div>
              )}
              
              <Badge variant="secondary" className="hidden sm:inline-flex">
                <Sparkles className="h-3 w-3 mr-1" />
                Full Features
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:shadow-none border-r`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Navigation</h2>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Child Profiles in Sidebar */}
            {children.length > 0 && (
              <div className="p-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Children</h3>
                <div className="space-y-1">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-sm transition-colors ${
                        selectedChild?.id === child.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="p-1 bg-blue-100 rounded-full">
                        <Users className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children.length === 0 ? (
              <WelcomeScreen onChildCreated={handleChildCreated} />
            ) : (
              renderMainContent()
            )}
          </div>
        </main>
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator 
        onOfflineStoriesClick={() => setShowOfflineStories(true)}
      />

      {/* Offline Stories Modal */}
      {showOfflineStories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Offline Stories</h2>
              <Button
                variant="ghost"
                onClick={() => setShowOfflineStories(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <OfflineStoryManager
                children={children}
                onStorySelect={(story) => {
                  setCurrentStory(story);
                  setShowOfflineStories(false);
                  setActiveTab('home');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function WelcomeScreen({ onChildCreated }) {
  return (
    <div className="text-center py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-20 h-20 mx-auto mb-4">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Kids Story Time
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create magical, personalized stories for your children with AI-powered narration, 
            beautiful illustrations, and interactive elements.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your first child profile to begin generating personalized stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChildProfile onChildCreated={onChildCreated} />
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-6 text-left">
          <FeatureCard
            icon={Headphones}
            title="Audio Narration"
            description="Professional voice narration brings stories to life"
          />
          <FeatureCard
            icon={ImageIcon}
            title="Beautiful Illustrations"
            description="AI-generated artwork for every story scene"
          />
          <FeatureCard
            icon={Globe}
            title="Multiple Languages"
            description="Stories available in English, Spanish, French, and German"
          />
        </div>
      </div>
    </div>
  );
}

function HomeView({ children, selectedChild, onChildSelect, onCreateStory, currentStory, onStorySelect }) {
  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onCreateStory}>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Create New Story</h3>
            <p className="text-sm text-gray-600">Generate a personalized story for {selectedChild?.name}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Story Series</h3>
            <p className="text-sm text-gray-600">Create ongoing adventures</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
              <Palette className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Illustrations</h3>
            <p className="text-sm text-gray-600">Add beautiful artwork</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Story */}
      {currentStory && (
        <Card>
          <CardHeader>
            <CardTitle>Current Story</CardTitle>
          </CardHeader>
          <CardContent>
            <StoryViewer story={currentStory} child={selectedChild} />
          </CardContent>
        </Card>
      )}

      {/* Child Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Child Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => onChildSelect(child)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedChild?.id === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{child.name}</h4>
                    {child.age && <p className="text-sm text-gray-600">Age: {child.age}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StoryCreationView({ selectedChild, onStoryGenerated, themes, languages, checkFeatureAccess }) {
  if (!selectedChild) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Select a Child Profile
          </h3>
          <p className="text-gray-500">
            Choose a child profile to create personalized stories
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <StoryCreator
      selectedChild={selectedChild}
      onStoryGenerated={onStoryGenerated}
      themes={themes}
      languages={languages}
      checkFeatureAccess={checkFeatureAccess}
    />
  );
}

function StoryViewer({ story, child }) {
  const [activeStoryTab, setActiveStoryTab] = useState('story');

  return (
    <Tabs value={activeStoryTab} onValueChange={setActiveStoryTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="story">Story</TabsTrigger>
        <TabsTrigger value="audio">Audio</TabsTrigger>
        <TabsTrigger value="illustrations">Illustrations</TabsTrigger>
        <TabsTrigger value="interactive">Interactive</TabsTrigger>
      </TabsList>

      <TabsContent value="story" className="mt-6">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">{story.title}</h2>
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {story.content}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="audio" className="mt-6">
        <AudioNarration story={story} onAudioGenerated={() => {}} />
      </TabsContent>

      <TabsContent value="illustrations" className="mt-6">
        <StoryIllustrations story={story} child={child} onIllustrationGenerated={() => {}} />
      </TabsContent>

      <TabsContent value="interactive" className="mt-6">
        {story.interactive_choices && story.interactive_choices.length > 0 ? (
          <InteractiveStory 
            story={story} 
            onChoiceMade={() => {}} 
            onStoryComplete={() => {}} 
          />
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">This story doesn't have interactive elements</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export default App;

