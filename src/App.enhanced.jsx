import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import StoryDisplay from './components/StoryDisplay';
import StoryLibrary from './components/StoryLibrary';
import { ChildProfileImproved, CreateChildProfileImproved } from './components/ChildProfileImproved.jsx';
import { StoryCreator } from './components/StoryCreator.jsx';
import { ProgressIndicator } from './components/gamification/ProgressIndicator.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { 
  BookOpen, Users, Settings, ChevronDown, User, Library,
  Menu, X, Trophy, TrendingUp, Plus, Crown
} from 'lucide-react';

function AppEnhanced() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('create'); // Start with create
  const [selectedStory, setSelectedStory] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [includeNameInStory, setIncludeNameInStory] = useState(true);
  const [savedStories, setSavedStories] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-select child when children list updates
    if (children.length === 1 && !selectedChild) {
      setSelectedChild(children[0]);
      setIncludeNameInStory(children[0]?.include_name_in_stories !== false);
    } else if (children.length > 0 && !selectedChild) {
      const defaultChild = children.find(c => c.is_default) || children[0];
      setSelectedChild(defaultChild);
      setIncludeNameInStory(defaultChild?.include_name_in_stories !== false);
    }
  }, [children]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        await loadChildren(currentUser.id);
        await loadStories(currentUser.id);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadStories = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleStoryGenerated = (story) => {
    // Include child's name if preference is set
    if (selectedChild && includeNameInStory) {
      story.child_name = selectedChild.name;
    }
    
    setSelectedStory(story);
    setCurrentView('story');
    
    // Reload stories
    if (user) {
      loadStories(user.id);
    }
  };

  const handleCreateChildProfile = async (profileData) => {
    const newProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      parent_id: user?.id,
      created_at: new Date().toISOString()
    };
    
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
      setChildren(prev => [...prev, newProfile]);
      setSelectedChild(newProfile);
    }
  };

  const handleUpdateChildProfile = async (childId, updates) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('children')
          .update(updates)
          .eq('id', childId);
        
        if (error) throw error;
      }
      
      setChildren(prev => prev.map(child => 
        child.id === childId ? { ...child, ...updates } : child
      ));
      
      if (selectedChild?.id === childId) {
        setSelectedChild(prev => ({ ...prev, ...updates }));
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
      const child = children.find(c => c.id === childId);
      if (child?.is_default) return;
      
      if (user) {
        const { error } = await supabase
          .from('children')
          .delete()
          .eq('id', childId);
        
        if (error) throw error;
      }
      
      setChildren(prev => prev.filter(c => c.id !== childId));
      
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
    if (selectedChild) {
      handleUpdateChildProfile(selectedChild.id, { 
        include_name_in_stories: checked 
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setChildren([]);
    setSelectedChild(null);
    window.location.reload();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Profile Selector Bar */}
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
                
                {/* Include Name Checkbox */}
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
            
            {/* Story Creator */}
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
                  <Button onClick={() => setCurrentView('profiles')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Child Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'story':
        return (
          <StoryDisplay
            story={selectedStory}
            onBack={() => setCurrentView('create')}
            onSave={() => user && loadStories(user.id)}
          />
        );
      
      case 'library':
        return (
          <StoryLibrary
            onBack={() => setCurrentView('create')}
          />
        );
      
      case 'profiles':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
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
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
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
                    onClick={handleSignOut}
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

  if (loading) {
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
    <div className="app-container">
      {/* Progress Indicator */}
      <ProgressIndicator position="top-right" compact={true} />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1 className="app-title">
            <BookOpen className="inline-block mr-2" size={24} />
            Kids Story Time
          </h1>
          
          <div className="header-actions">
            {savedStories.length > 0 && (
              <Badge variant="secondary">{savedStories.length} stories</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className={`app-nav ${menuOpen ? 'open' : ''}`}>
        <button 
          className={`nav-item ${currentView === 'create' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('create');
            setMenuOpen(false);
          }}
        >
          <BookOpen size={20} />
          Create Story
        </button>
        
        <button 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('library');
            setMenuOpen(false);
          }}
        >
          <Library size={20} />
          My Library
        </button>
        
        <button 
          className={`nav-item ${currentView === 'profiles' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('profiles');
            setMenuOpen(false);
          }}
        >
          <Users size={20} />
          Child Profiles
        </button>
        
        <button 
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('settings');
            setMenuOpen(false);
          }}
        >
          <Settings size={20} />
          Settings
        </button>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default AppEnhanced;