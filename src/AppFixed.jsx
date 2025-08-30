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
  Menu, X, Home, Star, Trophy, Plus, Library, TrendingUp
} from 'lucide-react';

// Import all components
import { ChildProfileEnhanced, CreateChildProfileEnhanced } from './components/ChildProfileEnhanced.jsx';
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

function AppFixed() {
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
  const [showChildModal, setShowChildModal] = useState(false);

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
      
      // Load all children profiles
      const childrenProfiles = await loadChildrenProfiles(user.id);
      if (childrenProfiles.length > 0) {
        setChildren(childrenProfiles);
      } else {
        setChildren([profile]);
      }
      
      await gamification.init();
      await loadSavedStories(user.id);
    }
    
    return { user, profile, error };
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
          setShowChildModal(false);
        }
      } catch (error) {
        console.error('Error saving child profile:', error);
      }
    } else {
      // Save locally
      setChildren(prev => [...prev, newProfile]);
      setSelectedChild(newProfile);
      setShowChildModal(false);
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
            {/* Child Selection for multi-child families */}
            {children.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Who is this story for?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedChild(child);
                          setIncludeNameInStory(child.include_name_in_stories !== false);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedChild?.id === child.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <div className="font-medium">{child.name}</div>
                        <div className="text-xs text-gray-500">
                          {child.reading_level?.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Include Name Checkbox */}
            {selectedChild && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-name-story"
                      checked={includeNameInStory}
                      onCheckedChange={handleIncludeNameChange}
                    />
                    <Label htmlFor="include-name-story">
                      Include {selectedChild.name}'s name in the story
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Story Creator */}
            <StoryCreator 
              selectedChild={selectedChild}
              onStoryGenerated={handleStoryGenerated}
            />
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
                <div className="grid md:grid-cols-2 gap-4">
                  {children.map(child => (
                    <ChildProfileEnhanced
                      key={child.id}
                      child={child}
                      isSelected={selectedChild?.id === child.id}
                      onSelect={setSelectedChild}
                      onUpdate={handleUpdateChildProfile}
                      onDelete={handleDeleteChildProfile}
                    />
                  ))}
                  
                  {/* Add New Child Card */}
                  <CreateChildProfileEnhanced
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
            
            {/* Quick Access to Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab('profiles')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Child Profiles
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
                  <div className={`p-2 rounded-full ${
                    selectedChild.gender === 'female' ? 'bg-pink-200' :
                    selectedChild.gender === 'male' ? 'bg-blue-200' :
                    'bg-purple-200'
                  }`}>
                    <Users className={`h-5 w-5 ${
                      selectedChild.gender === 'female' ? 'text-pink-700' :
                      selectedChild.gender === 'male' ? 'text-blue-700' :
                      'text-purple-700'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedChild.name}</p>
                    <p className="text-xs text-gray-600">
                      {selectedChild.reading_level?.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
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

            {/* Story Count */}
            <div className="p-4 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Stories</p>
                <p className="text-2xl font-bold text-purple-600">{savedStories.length}</p>
              </div>
            </div>
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

export default AppFixed;