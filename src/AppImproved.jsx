import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { 
  BookOpen, Users, Settings, BarChart3, Sparkles, 
  Crown, Palette, Globe, Headphones, Image as ImageIcon,
  Menu, X, Home, Star, Trophy, Plus, Library, TrendingUp,
  ChevronDown, User, ArrowRight
} from 'lucide-react';

// Import all components
import { ChildProfileImproved, CreateChildProfileImproved } from './components/ChildProfileImproved.jsx';
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
import { supabase } from './lib/supabase.js';

function AppImproved() {
  // State management
  const [user, setUser] = useState(null);
  const [children, setChildren] = useLocalStorage('children', []);
  const [selectedChild, setSelectedChild] = useState(null);
  const [currentStory, setCurrentStory] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // Start with create story page
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedStories, setSavedStories] = useState([]);
  const [includeNameInStory, setIncludeNameInStory] = useState(true);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Auto-select child when children list updates
    if (children.length === 1 && !selectedChild) {
      // If only one child, auto-select it
      setSelectedChild(children[0]);
      setIncludeNameInStory(children[0].include_name_in_stories !== false);
    } else if (children.length > 0 && !selectedChild) {
      // Otherwise select default or first child
      const defaultChild = children.find(c => c.is_default) || children[0];
      setSelectedChild(defaultChild);
      setIncludeNameInStory(defaultChild.include_name_in_stories !== false);
    }
  }, [children]);

  useEffect(() => {
    // Sync include name preference when child changes
    if (selectedChild) {
      setIncludeNameInStory(selectedChild.include_name_in_stories !== false);
    }
  }, [selectedChild]);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // Get current user with profile
      const { user: currentUser, profile } = await authEnhanced.getCurrentUserWithProfile();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Load all children profiles
        const childrenProfiles = await loadChildrenProfiles(currentUser.id);
        if (childrenProfiles.length > 0) {
          setChildren(childrenProfiles);
        } else if (profile) {
          // Use default profile if no children exist
          setChildren([profile]);
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

  const loadChildrenProfiles = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading children:', error);
      return [];
    }
  };

  const loadSavedStories = async (userId) => {
    const stories = await storyAutoSave.getAllSavedStories(userId);
    setSavedStories(stories);
  };

  const handleStoryGenerated = async (story) => {
    // Include child's name if preference is set
    if (selectedChild && includeNameInStory) {
      story.child_name = selectedChild.name;
    }
    
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

  const handleCreateChildProfile = async (profileData) => {
    const newProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      parent_id: user?.id,
      created_at: new Date().toISOString()
    };
    
    // Save to database if user is logged in
    if (user) {
      try {
        const { data, error } = await supabase
          .from('children')
          .insert([newProfile])
          .select()
          .single();
        
        if (!error && data) {
          setChildren(prev => [...prev, data]);
          setSelectedChild(data);
        }
      } catch (error) {
        console.error('Error saving child profile:', error);
      }
    } else {
      // Save locally
      setChildren(prev => [...prev, newProfile]);
      setSelectedChild(newProfile);
    }
  };

  const handleUpdateChildProfile = async (childId, updates) => {
    try {
      // Update in database
      if (user) {
        const { error } = await supabase
          .from('children')
          .update(updates)
          .eq('id', childId);
        
        if (error) throw error;
      }
      
      // Update locally
      setChildren(prev => prev.map(child => 
        child.id === childId ? { ...child, ...updates } : child
      ));
      
      // Update selected child if it's the one being updated
      if (selectedChild?.id === childId) {
        setSelectedChild(prev => ({ ...prev, ...updates }));
        // Sync the include name preference
        if (updates.include_name_in_stories !== undefined) {
          setIncludeNameInStory(updates.include_name_in_stories);
        }
      }
    } catch (error) {
      console.error('Error updating child profile:', error);
    }
  };

  const handleDeleteChildProfile = async (childId) => {
    try {
      // Don't delete default profiles
      const child = children.find(c => c.id === childId);
      if (child?.is_default) return;
      
      // Delete from database
      if (user) {
        const { error } = await supabase
          .from('children')
          .delete()
          .eq('id', childId);
        
        if (error) throw error;
      }
      
      // Update local state
      setChildren(prev => prev.filter(c => c.id !== childId));
      
      // Select another child if this was selected
      if (selectedChild?.id === childId) {
        const remaining = children.filter(c => c.id !== childId);
        setSelectedChild(remaining[0] || null);
      }
    } catch (error) {
      console.error('Error deleting child profile:', error);
    }
  };

  const handleIncludeNameChange = (checked) => {
    setIncludeNameInStory(checked);
    // Update the selected child's preference
    if (selectedChild) {
      handleUpdateChildProfile(selectedChild.id, { 
        include_name_in_stories: checked 
      });
    }
  };

  const navigation = [
    { id: 'create', name: 'Create Story', icon: BookOpen },
    { id: 'library', name: 'My Library', icon: Library },
    { id: 'badges', name: 'Achievements', icon: Trophy },
    { id: 'progress', name: 'Progress', icon: TrendingUp },
    { id: 'profiles', name: 'Child Profiles', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="space-y-6">
            {/* Profile Selector Bar - Always visible but collapsed by default */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Creating story for:</Label>
                    {selectedChild && (
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${
                          selectedChild.gender === 'female' ? 'bg-pink-100' :
                          selectedChild.gender === 'male' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          <User className={`h-4 w-4 ${
                            selectedChild.gender === 'female' ? 'text-pink-600' :
                            selectedChild.gender === 'male' ? 'text-blue-600' :
                            'text-purple-600'
                          }`} />
                        </div>
                        <span className="font-medium">{selectedChild.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedChild.reading_level?.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {children.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfileSelector(!showProfileSelector)}
                    >
                      Change Profile
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${
                        showProfileSelector ? 'rotate-180' : ''
                      }`} />
                    </Button>
                  )}
                </div>
                
                {/* Expandable Profile Selector */}
                {showProfileSelector && children.length > 1 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {children.map(child => (
                        <ChildProfileImproved
                          key={child.id}
                          child={child}
                          isSelected={selectedChild?.id === child.id}
                          onSelect={(child) => {
                            setSelectedChild(child);
                            setIncludeNameInStory(child.include_name_in_stories !== false);
                            setShowProfileSelector(false);
                          }}
                          onUpdate={handleUpdateChildProfile}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Include Name Checkbox - Always visible */}
                {selectedChild && (
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                    <Checkbox
                      id="include-name-story"
                      checked={includeNameInStory}
                      onCheckedChange={handleIncludeNameChange}
                    />
                    <Label htmlFor="include-name-story" className="text-sm">
                      Include {selectedChild.name}'s name in the story
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Story Creator - Main Focus */}
            {selectedChild ? (
              <StoryCreator 
                selectedChild={selectedChild}
                onStoryGenerated={handleStoryGenerated}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No Child Profile Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create a child profile to start generating personalized stories
                  </p>
                  <Button onClick={() => setActiveTab('profiles')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Child Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'story':
        return currentStory ? (
          <StoryDisplayWithGames
            story={currentStory}
            onBack={() => setActiveTab('create')}
            onSave={() => {/* Already auto-saved */}}
            onShowLibrary={() => setActiveTab('library')}
            user={user}
            childProfile={selectedChild}
          />
        ) : (
          <div className="text-center py-12">
            <p>No story selected</p>
            <Button onClick={() => setActiveTab('create')} className="mt-4">
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
            <LevelProgress showDetails={true} />
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
              localStorage.setItem('gamificationSettings', JSON.stringify(settings));
            }}
          />
        );
      
      case 'profiles':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Child Profiles</CardTitle>
                <CardDescription>
                  Manage profiles for personalized story experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {children.map(child => (
                    <ChildProfileImproved
                      key={child.id}
                      child={child}
                      isSelected={selectedChild?.id === child.id}
                      onSelect={setSelectedChild}
                      onUpdate={handleUpdateChildProfile}
                      onDelete={handleDeleteChildProfile}
                    />
                  ))}
                  
                  {/* Add New Child Card */}
                  <CreateChildProfileImproved
                    onCreateChild={handleCreateChildProfile}
                    parentId={user?.id}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p className="font-medium">{user?.email || 'Not logged in'}</p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-600">Subscription Status</Label>
                      <Badge variant="secondary">Example Only</Badge>
                    </div>
                    <p className="font-medium text-amber-900">Premium Plan</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Unlimited stories, all features unlocked
                    </p>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Crown className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('profiles')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Child Profiles
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('progress')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Progress Dashboard
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
            <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Story Time
              </h1>
            </div>

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
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                      activeTab === item.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Story Stats */}
            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{savedStories.length}</p>
                  <p className="text-xs text-gray-500">Stories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-600">{children.length}</p>
                  <p className="text-xs text-gray-500">Profiles</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-40">
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
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
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

export default AppImproved;