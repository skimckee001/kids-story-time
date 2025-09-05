import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import StoryDisplay from './StoryDisplay';
import AchievementSystem from './AchievementSystem';
import ReadingStreak from './ReadingStreak';
import StarRewardsSystem from './StarRewardsSystem';
import './StoryLibrary.css';

function StoryLibrary({ user: propUser, subscriptionTier: propTier, onBack }) {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [filterChild, setFilterChild] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [children, setChildren] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [starPoints, setStarPoints] = useState(0);
  const [currentChildProfile, setCurrentChildProfile] = useState(null);
  
  // Use props if provided, otherwise check locally
  const user = propUser;
  const subscriptionTier = propTier || 'reader-free';

  useEffect(() => {
    loadStories();
    loadStarsAndProfile();
  }, []);

  useEffect(() => {
    // Load children profiles when component mounts
    const loadChildren = async () => {
      try {
        // First check localStorage for profiles
        const localProfiles = localStorage.getItem('childProfiles');
        if (localProfiles) {
          const profiles = JSON.parse(localProfiles);
          setChildren(profiles);
          // Set the first profile as current if none selected
          if (profiles.length > 0 && !currentChildProfile) {
            setCurrentChildProfile(profiles[0]);
          }
        }
        
        // Also try to load from Supabase if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id);

          if (!error && data) {
            // Merge with local profiles if they exist
            const mergedProfiles = localProfiles ? 
              [...JSON.parse(localProfiles), ...data].reduce((acc, profile) => {
                if (!acc.find(p => p.id === profile.id)) {
                  acc.push(profile);
                }
                return acc;
              }, []) : data;
            
            setChildren(mergedProfiles);
          }
        }
      } catch (error) {
        console.error('Error loading children:', error);
      }
    };
    
    loadChildren();
  }, []);

  const loadStarsAndProfile = () => {
    // Load current child profile
    const profiles = localStorage.getItem('childProfiles');
    if (profiles) {
      const parsedProfiles = JSON.parse(profiles);
      if (parsedProfiles.length > 0) {
        setCurrentChildProfile(parsedProfiles[0]);
        // Load stars for the profile
        const stars = localStorage.getItem(`stars_${parsedProfiles[0].id}`) || 0;
        setStarPoints(parseInt(stars));
      }
    }
  };

  const loadStories = async () => {
    setLoading(true);
    try {
      // Check if this is a test user or no real Supabase connection
      const isTestUser = user?.id?.startsWith('test-') || 
                        !import.meta.env.VITE_SUPABASE_URL || 
                        import.meta.env.VITE_SUPABASE_URL.includes('dummy');
      
      if (isTestUser || !user) {
        // Load from localStorage for test users
        const libraryStories = localStorage.getItem('libraryStories');
        const legacyStories = localStorage.getItem('stories'); // Also check old key
        
        let allStories = [];
        if (libraryStories) {
          allStories = JSON.parse(libraryStories);
        } else if (legacyStories) {
          allStories = JSON.parse(legacyStories);
        }
        
        setStories(allStories);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
      
      // Refresh the stories list
      loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  const handleToggleFavorite = async (story) => {
    try {
      const newFavoriteStatus = !story.is_favorite;
      
      const { error } = await supabase
        .from('stories')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', story.id);

      if (error) throw error;
      
      // Refresh the stories list
      loadStories();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  // Filter and sort stories
  const filteredStories = stories
    .filter(story => {
      // Filter by child
      if (filterChild !== 'all' && story.child_name !== filterChild) return false;
      
      // Filter by search term
      if (searchTerm && !story.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !story.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'favorites':
          return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
        default: // newest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  // If a story is selected, show it
  if (selectedStory) {
    return (
      <StoryDisplay
        story={selectedStory}
        user={user}
        subscriptionTier={subscriptionTier}
        starPoints={starPoints}
        childProfile={currentChildProfile}
        onBack={() => setSelectedStory(null)}
        onShowLibrary={() => setSelectedStory(null)}
        onShowAuth={() => {}}
      />
    );
  }

  return (
    <div className="library-page">
      {/* Use the same Header component as other pages */}
      <Header 
        user={user}
        subscriptionTier={subscriptionTier}
        starPoints={starPoints}
        onShowLibrary={() => {}}
        onShowAuth={() => {}}
        onShowAchievements={() => setShowAchievements(true)}
        onShowRewards={() => setShowRewards(true)}
        onLogoClick={onBack}
        isLibraryPage={true}
      />
      
      <div className="library-container">
        {/* Library Title Section */}
        <div className="library-title-section">
          <h1>My Story Library</h1>
          <div className="library-stats">
            <div className="library-stat">
              <span className="library-stat-icon">📚</span>
              <span className="library-stat-text">{stories.length} {stories.length === 1 ? 'Story' : 'Stories'}</span>
            </div>
            <div className="library-stat">
              <span className="library-stat-icon">👥</span>
              <span className="library-stat-text">
                {children.length === 1 
                  ? `Profile 1: ${children[0].name || 'Unnamed'}` 
                  : `${children.length} Profiles`}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="library-controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterChild}
            onChange={(e) => setFilterChild(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Children</option>
            {/* Show all children profiles, not just those with stories */}
            {children.map(child => (
              <option key={child.id} value={child.name}>{child.name}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="favorites">Favorites First</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="stories-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No Stories Yet</h2>
            <p>
              {searchTerm 
                ? 'No stories match your search. Try different keywords.'
                : filterChild !== 'all' 
                  ? `No stories for ${filterChild} yet. Create your first magical story!`
                  : 'Create your first magical story to see it here!'}
            </p>
            <button onClick={onBack} className="create-story-btn">
              ✨ Create New Story
            </button>
          </div>
        ) : (
          <div className="stories-grid">
            {filteredStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onRead={() => setSelectedStory(story)}
                onDelete={() => handleDeleteStory(story.id)}
                onToggleFavorite={() => handleToggleFavorite(story)}
              />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Achievement System Modal */}
      {showAchievements && (
        <div className="modal-overlay">
          <AchievementSystem 
            childProfile={currentChildProfile}
            onClose={() => setShowAchievements(false)}
          />
        </div>
      )}

      {/* Star Rewards Modal */}
      {showRewards && (
        <div className="modal-overlay">
          <StarRewardsSystem
            childProfile={currentChildProfile}
            stars={starPoints}
            setStars={setStarPoints}
            onClose={() => setShowRewards(false)}
          />
        </div>
      )}
    </div>
  );
}

// Story Card Component
function StoryCard({ story, onRead, onDelete, onToggleFavorite }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getThemeEmoji = (theme) => {
    const themeEmojis = {
      adventure: '🗺️',
      fairytale: '🏰',
      educational: '📚',
      bedtime: '🌙',
      friendship: '🤝',
      animals: '🦁',
      space: '🚀',
      underwater: '🐠',
      ocean: '🐠',
      fantasy: '🧙‍♂️',
      mystery: '🔍'
    };
    return themeEmojis[theme?.toLowerCase()] || '📖';
  };

  // Generate a fallback gradient based on story title
  const getGradient = (title) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const index = (title || '').charCodeAt(0) % gradients.length;
    return gradients[index] || gradients[0];
  };

  return (
    <div className="story-card">
      {/* Story Image */}
      <div className="story-card-image" style={!story.image_url ? { background: getGradient(story.title) } : {}}>
        {story.image_url ? (
          <img 
            src={story.image_url} 
            alt={story.title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = getGradient(story.title);
            }}
          />
        ) : (
          <div className="story-card-placeholder">
            <span className="placeholder-emoji">📚</span>
          </div>
        )}
      </div>
      
      {/* Story Content */}
      <div className="story-card-content">
        <div className="story-card-header">
          <h3 className="story-card-title">{story.title || 'Untitled Story'}</h3>
          <button 
            className={`favorite-btn ${story.is_favorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
            title="Toggle favorite"
          >
            {story.is_favorite ? '⭐' : '☆'}
          </button>
        </div>
        
        <div className="story-card-meta">
          {story.child_name && story.child_name !== 'Unknown' && (
            <span className="meta-item">
              <span className="meta-icon">👤</span>
              {story.child_name}
            </span>
          )}
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            {formatDate(story.created_at)}
          </span>
        </div>
        
        {story.content && (
          <p className="story-card-preview">
            {story.content.substring(0, 150)}{story.content.length > 150 ? '...' : ''}
          </p>
        )}
        
        <div className="story-card-actions">
          <button onClick={onRead} className="read-btn">
            📖 Read
          </button>
          <button onClick={onDelete} className="delete-btn" title="Delete story">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoryLibrary;