import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  BookOpen, Users, Settings, BarChart3, Sparkles, 
  Crown, Palette, Globe, Headphones, Image as ImageIcon,
  Menu, X, Home, Star, Trophy, Plus
} from 'lucide-react';

// Import all components
import { ChildProfile } from './components/ChildProfile.jsx';
import { StoryCreator } from './components/StoryCreator.jsx';
import { StoryDisplayWithGames } from './components/StoryDisplayWithGames.jsx';
import { StoryLibrary } from './components/StoryLibrary.jsx';
import { BadgeGallery } from './components/gamification/BadgeGallery.jsx';
import { LevelProgress } from './components/gamification/LevelProgress.jsx';
import { ProgressIndicator } from './components/gamification/ProgressIndicator.jsx';
import { ParentDashboard as GamificationDashboard } from './components/gamification/ParentDashboard.jsx';

// Import enhanced services
import { authEnhanced } from './lib/auth-enhanced';
import storyAutoSave from './lib/story-autosave';
import gamification from './lib/gamification';
import { useLocalStorage } from './hooks/useLocalStorage.js';

function AppEnhanced() {
  // State management
  const [user, setUser] = useState(null);
  const [children, setChildren] = useLocalStorage('children', []);
  const [selectedChild, setSelectedChild] = useState(null);
  const [currentStory, setCurrentStory] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedStories, setSavedStories] = useState([]);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Auto-select default child when children list updates
    if (children.length > 0 && !selectedChild) {
      const defaultChild = children.find(c => c.is_default) || children[0];
      setSelectedChild(defaultChild);
    }
  }, [children]);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // Get current user with profile
      const { user: currentUser, profile } = await authEnhanced.getCurrentUserWithProfile();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Set default profile as a child
        if (profile) {
          setChildren([profile]);
          setSelectedChild(profile);
        }
        
        // Initialize gamification
        await gamification.init();
        
        // Load saved stories
        await loadSavedStories(currentUser.id);
        
        // Sync any local stories
        await storyAutoSave.syncLocalStories(currentUser.id);
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedStories = async (userId) => {
    const stories = await storyAutoSave.getAllSavedStories(userId);
    setSavedStories(stories);
  };

  const handleSignUp = async (email, password, parentName) => {
    const { user, profile, error } = await authEnhanced.signUpWithProfile(email, password, parentName);
    
    if (!error && user && profile) {
      setUser(user);
      setChildren([profile]);
      setSelectedChild(profile);
      await gamification.init();
    }
    
    return { user, profile, error };
  };

  const handleSignIn = async (email, password) => {
    const { user, profile, error } = await authEnhanced.signInWithProfile(email, password);
    
    if (!error && user && profile) {
      setUser(user);
      setChildren([profile]);
      setSelectedChild(profile);
      await gamification.init();
      await loadSavedStories(user.id);
    }
    
    return { user, profile, error };
  };

  const handleStoryGenerated = async (story) => {
    // Auto-save the story immediately
    const savedStory = await storyAutoSave.autoSaveStory(
      story,
      user?.id,
      selectedChild?.id
    );
    
    setCurrentStory(savedStory);
    setActiveTab('story');
    
    // Reload saved stories
    if (user) {
      await loadSavedStories(user.id);
    }
    
    // Track in gamification
    await gamification.trackStoryActivity('story_created', {
      wordCount: story.content?.split(' ').length || 0
    });
  };

  const handleImageGenerated = async (storyId, imageUrl) => {
    // Update story with image
    await storyAutoSave.updateStoryImage(storyId, imageUrl);
    
    // Update current story if it matches
    if (currentStory?.savedId === storyId || currentStory?.id === storyId) {
      setCurrentStory(prev => ({ ...prev, imageUrl, image_url: imageUrl }));
    }
    
    // Reload saved stories
    if (user) {
      await loadSavedStories(user.id);
    }
  };

  const handleCreateChildProfile = async (profileData) => {
    const newProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      parent_id: user?.id,
      is_default: false,
      created_at: new Date().toISOString()
    };
    
    setChildren(prev => [...prev, newProfile]);
    setSelectedChild(newProfile);
    
    // Save to database if user is logged in
    if (user) {
      try {
        await supabase.from('children').insert([newProfile]);
      } catch (error) {
        console.error('Error saving child profile:', error);
      }
    }
  };

  const navigation = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'stories', name: 'Create Story', icon: BookOpen },
    { id: 'library', name: 'My Library', icon: Star },
    { id: 'badges', name: 'Achievements', icon: Trophy },
    { id: 'progress', name: 'Progress', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Kids Story Time!</CardTitle>
                <CardDescription>
                  {selectedChild 
                    ? `Creating magical stories for ${selectedChild.name}`
                    : 'Start creating personalized stories for your child'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => setActiveTab('stories')}
                    className="w-full"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Create New Story
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setActiveTab('library')}
                    className="w-full"
                  >
                    <Star className="mr-2 h-5 w-5" />
                    View Library ({savedStories.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <LevelProgress showDetails={true} />

            {/* Recent Stories */}
            {savedStories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {savedStories.slice(0, 3).map(story => (
                      <Card 
                        key={story.id} 
                        className="cursor-pointer hover:shadow-lg transition"
                        onClick={() => {
                          setCurrentStory(story);
                          setActiveTab('story');
                        }}
                      >
                        <CardContent className="p-4">
                          {story.image_url && (
                            <img 
                              src={story.image_url} 
                              alt={story.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <h4 className="font-semibold">{story.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(story.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'stories':
        return (
          <StoryCreator 
            selectedChild={selectedChild}
            onStoryGenerated={handleStoryGenerated}
          />
        );
      
      case 'story':
        return currentStory ? (
          <StoryDisplayWithGames
            story={currentStory}
            onBack={() => setActiveTab('home')}
            onSave={() => {/* Already auto-saved */}}
            onShowLibrary={() => setActiveTab('library')}
            user={user}
            childProfile={selectedChild}
          />
        ) : (
          <div className="text-center py-12">
            <p>No story selected</p>
            <Button onClick={() => setActiveTab('stories')} className="mt-4">
              Create a Story
            </Button>
          </div>
        );
      
      case 'library':
        return (
          <StoryLibrary
            stories={savedStories}
            onStorySelect={(story) => {
              setCurrentStory(story);
              setActiveTab('story');
            }}
            onRefresh={() => loadSavedStories(user?.id)}
          />
        );
      
      case 'badges':
        return (
          <div className="space-y-6">
            <BadgeGallery 
              userId={selectedChild?.id} 
              readingLevel={selectedChild?.reading_level || 'beginningReader'} 
            />
          </div>
        );
      
      case 'progress':
        return (
          <GamificationDashboard 
            children={children} 
            onSettingsChange={(settings) => {
              console.log('Settings updated:', settings);
            }}
          />
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Child Profiles Management */}
            <Card>
              <CardHeader>
                <CardTitle>Child Profiles</CardTitle>
                <CardDescription>Manage reading profiles for your children</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {children.map(child => (
                    <div 
                      key={child.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedChild?.id === child.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedChild(child)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{child.name}</h4>
                          <p className="text-sm text-gray-600">
                            Age {child.age} • {child.reading_level}
                            {child.is_default && (
                              <Badge className="ml-2" variant="secondary">Default</Badge>
                            )}
                          </p>
                        </div>
                        {selectedChild?.id === child.id && (
                          <Badge className="bg-blue-500 text-white">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {/* Open create profile modal */}}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600">{user?.email || 'Not logged in'}</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {/* Sign out */}}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your magical stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Persistent Progress Indicator */}
      <ProgressIndicator position="top-right" compact={true} />

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h1 className="text-2xl font-bold text-purple-600">Story Time</h1>
            </div>

            {/* Selected Child Display */}
            {selectedChild && (
              <div className="p-4 bg-purple-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-200 rounded-full">
                    <Users className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedChild.name}</p>
                    <p className="text-xs text-gray-600">Age {selectedChild.age}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4">
              {navigation.map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors mb-2 ${
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="text-xl font-bold text-purple-600">Story Time</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Page Content */}
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AppEnhanced;