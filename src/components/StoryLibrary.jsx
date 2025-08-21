import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StoryDisplay from './StoryDisplay';
import './StoryLibrary.css';

function StoryLibrary({ onBack }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [filterChild, setFilterChild] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [children, setChildren] = useState([]);

  useEffect(() => {
    loadStories();
    loadChildren();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
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

  const loadChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
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
      
      // Remove from local state
      setStories(stories.filter(s => s.id !== storyId));
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
      
      // Update local state
      setStories(stories.map(s => 
        s.id === story.id 
          ? { ...s, is_favorite: newFavoriteStatus }
          : s
      ));
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
        onBack={() => setSelectedStory(null)}
        onSave={() => {}}
      />
    );
  }

  return (
    <div className="story-library-container">
      {/* Header */}
      <div className="library-header">
        <div className="header-content">
          <button onClick={onBack} className="back-btn">
            ← Back
          </button>
          <h1 className="library-title">📚 My Story Library</h1>
          <div className="header-stats">
            <span className="stat-badge">{stories.length} Stories</span>
            <span className="stat-badge">
              {stories.filter(s => s.is_favorite).length} ⭐ Favorites
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="library-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search stories..."
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
            {[...new Set(stories.map(s => s.child_name))].map(name => (
              <option key={name} value={name}>{name}</option>
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
                : 'Create your first magical story to see it here!'}
            </p>
            {!searchTerm && (
              <button onClick={onBack} className="create-story-btn">
                ✨ Create Your First Story
              </button>
            )}
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
      fantasy: '🧙‍♂️',
      mystery: '🔍'
    };
    return themeEmojis[theme] || '📖';
  };

  return (
    <div className="story-card">
      {/* Story Image */}
      {story.image_url && (
        <div className="story-card-image">
          <img 
            src={story.image_url} 
            alt={story.title}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
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
          <span className="meta-item">
            <span className="meta-icon">👤</span>
            {story.child_name}
          </span>
          <span className="meta-item">
            <span className="meta-icon">{getThemeEmoji(story.theme)}</span>
            {story.theme}
          </span>
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            {formatDate(story.created_at)}
          </span>
        </div>
        
        <p className="story-card-preview">
          {story.content?.substring(0, 150)}...
        </p>
        
        <div className="story-card-actions">
          <button onClick={onRead} className="read-btn">
            📖 Read Story
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