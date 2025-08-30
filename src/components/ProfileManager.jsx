import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ProfileManager.css';

const READING_LEVELS = [
  { value: 'pre-reader', label: 'Pre-Reader', age: '0-4 years' },
  { value: 'early-phonics', label: 'Early Reader', age: '4-6 years' },
  { value: 'beginning-reader', label: 'Beginning Reader', age: '6-8 years' },
  { value: 'developing-reader', label: 'Developing Reader', age: '8-10 years' },
  { value: 'fluent-reader', label: 'Fluent Reader', age: '10-12 years' },
  { value: 'insightful-reader', label: 'Advanced Reader', age: '12+ years' }
];

const FAVORITE_THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🗺️' },
  { value: 'animals', label: 'Animals', emoji: '🦁' },
  { value: 'fairytale', label: 'Fairy Tales', emoji: '🏰' },
  { value: 'space', label: 'Space', emoji: '🚀' },
  { value: 'ocean', label: 'Ocean', emoji: '🐠' },
  { value: 'friendship', label: 'Friendship', emoji: '🤝' },
  { value: 'mystery', label: 'Mystery', emoji: '🔍' },
  { value: 'fantasy', label: 'Fantasy', emoji: '🧙‍♂️' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'bedtime', label: 'Bedtime', emoji: '🌙' }
];

function ProfileManager({ onClose, onProfileSelect, user }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state for new/edit profile
  const [formData, setFormData] = useState({
    name: '',
    gender: 'either',
    reading_level: 'beginning-reader',
    favorite_themes: [],
    favorite_items: [],
    include_name_in_stories: true
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // Always load from localStorage first
      const localProfiles = JSON.parse(localStorage.getItem('childProfiles') || '[]');
      // Ensure all profiles have favorite_items as an array
      const profilesWithArrays = localProfiles.map(p => ({
        ...p,
        favorite_items: Array.isArray(p.favorite_items) ? p.favorite_items : []
      }));
      setProfiles(profilesWithArrays);
      
      // If user is logged in, also try to sync with Supabase
      if (user) {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: true });
        
        if (!error && data && data.length > 0) {
          // Merge Supabase data with local data
          const mergedProfiles = [...localProfiles];
          data.forEach(supabaseProfile => {
            const existingIndex = mergedProfiles.findIndex(p => p.id === supabaseProfile.id);
            if (existingIndex >= 0) {
              // Update existing profile with Supabase data
              mergedProfiles[existingIndex] = supabaseProfile;
            } else {
              // Add new profile from Supabase
              mergedProfiles.push(supabaseProfile);
            }
          });
          setProfiles(mergedProfiles);
          localStorage.setItem('childProfiles', JSON.stringify(mergedProfiles));
        }
      }
      
      // Auto-select first profile if exists
      const storedSelected = localStorage.getItem('selectedChildProfile');
      if (storedSelected) {
        setSelectedProfile(JSON.parse(storedSelected));
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      // Ensure favorite_items is always an array
      const profileToSave = {
        name: formData.name,
        gender: formData.gender,
        reading_level: formData.reading_level,
        favorite_themes: formData.favorite_themes || [],
        favorite_items: formData.favorite_items || [],
        include_name_in_stories: formData.include_name_in_stories,
        id: editingProfile?.id || crypto.randomUUID(),
        parent_id: user?.id,
        created_at: editingProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (user) {
        // Save to Supabase
        if (editingProfile) {
          await supabase
            .from('children')
            .update(profileToSave)
            .eq('id', editingProfile.id);
        } else {
          await supabase
            .from('children')
            .insert([profileToSave]);
        }
      }

      // Update local state and localStorage
      let updatedProfiles;
      if (editingProfile) {
        updatedProfiles = profiles.map(p => 
          p.id === editingProfile.id ? profileToSave : p
        );
      } else {
        updatedProfiles = [...profiles, profileToSave];
      }
      
      setProfiles(updatedProfiles);
      localStorage.setItem('childProfiles', JSON.stringify(updatedProfiles));
      
      // Reset form
      setIsCreating(false);
      setEditingProfile(null);
      resetForm();
      
      // Auto-select if it's the first profile
      if (updatedProfiles.length === 1) {
        handleSelectProfile(profileToSave);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const deleteProfile = async (profileId) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      if (user) {
        await supabase
          .from('children')
          .delete()
          .eq('id', profileId);
      }
      
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      setProfiles(updatedProfiles);
      localStorage.setItem('childProfiles', JSON.stringify(updatedProfiles));
      
      // Clear selection if deleted profile was selected
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null);
        localStorage.removeItem('selectedChildProfile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    localStorage.setItem('selectedChildProfile', JSON.stringify(profile));
    
    // Pass profile data back to parent
    if (onProfileSelect) {
      onProfileSelect(profile);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'either',
      reading_level: 'beginning-reader',
      favorite_themes: [],
      favorite_items: [],
      include_name_in_stories: true
    });
  };

  const toggleTheme = (theme) => {
    setFormData(prev => ({
      ...prev,
      favorite_themes: prev.favorite_themes.includes(theme)
        ? prev.favorite_themes.filter(t => t !== theme)
        : [...prev.favorite_themes, theme]
    }));
  };

  const addFavoriteItem = (item) => {
    if (item && item.trim()) {
      const trimmedItem = item.trim();
      // Check if item already exists
      if (!formData.favorite_items?.includes(trimmedItem)) {
        setFormData(prev => ({
          ...prev,
          favorite_items: [...(prev.favorite_items || []), trimmedItem]
        }));
      }
    }
  };

  const removeFavoriteItem = (item) => {
    setFormData(prev => ({
      ...prev,
      favorite_items: prev.favorite_items.filter(i => i !== item)
    }));
  };

  if (loading) {
    return (
      <div className="profile-manager">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-manager">
      <div className="profile-manager-content">
        <div className="profile-manager-header">
          <h2>👤 Child Profiles</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {/* Profile List */}
        {!isCreating && !editingProfile && (
          <div className="profiles-section">
            {profiles.length === 0 ? (
              <div className="no-profiles">
                <p>No profiles yet. Create one to get personalized stories!</p>
              </div>
            ) : (
              <div className="profiles-grid">
                {profiles.map(profile => (
                  <div 
                    key={profile.id} 
                    className={`profile-card ${selectedProfile?.id === profile.id ? 'selected' : ''}`}
                  >
                    <div className="profile-card-header">
                      <div className="profile-avatar" style={{
                        background: profile.gender === 'female' ? '#ffc0cb' : 
                                   profile.gender === 'male' ? '#87ceeb' : '#dda0dd'
                      }}>
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="profile-info">
                        <h3>{profile.name}</h3>
                        <p className="profile-level">
                          {READING_LEVELS.find(l => l.value === profile.reading_level)?.label || 'Reader'}
                        </p>
                      </div>
                    </div>
                    
                    {profile.favorite_themes?.length > 0 && (
                      <div className="profile-themes">
                        {profile.favorite_themes.slice(0, 3).map(theme => {
                          const themeData = FAVORITE_THEMES.find(t => t.value === theme);
                          return themeData ? (
                            <span key={theme} className="theme-badge">
                              {themeData.emoji} {themeData.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    {profile.favorite_items?.length > 0 && (
                      <div className="profile-favorite-items">
                        <p className="favorite-items-label">Favorite things:</p>
                        <div className="favorite-items-list">
                          {profile.favorite_items.map((item, index) => (
                            <span key={index} className="favorite-item-badge">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="profile-actions">
                      <div className="profile-secondary-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => {
                            setEditingProfile(profile);
                            // Ensure arrays are properly initialized
                            setFormData({
                              name: profile.name || '',
                              gender: profile.gender || 'either',
                              reading_level: profile.reading_level || 'beginning-reader',
                              favorite_themes: Array.isArray(profile.favorite_themes) ? profile.favorite_themes : [],
                              favorite_items: Array.isArray(profile.favorite_items) ? profile.favorite_items : [],
                              include_name_in_stories: profile.include_name_in_stories !== false
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteProfile(profile.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <button 
                        className="profile-use-btn"
                        onClick={() => {
                          handleSelectProfile(profile);
                          // Call the onProfileSelect callback and close modal
                          if (onProfileSelect) {
                            onProfileSelect(profile);
                          }
                          onClose();
                        }}
                      >
                        {selectedProfile?.id === profile.id ? '✓ Using This Profile' : 'Use This Profile'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="create-profile-btn"
              onClick={() => {
                setIsCreating(true);
                resetForm();
              }}
            >
              ➕ Create New Profile
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingProfile) && (
          <div className="profile-form">
            <h3>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</h3>
            
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-group">
                <label>Child's Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter child's name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Storytime Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="male">Boy</option>
                  <option value="female">Girl</option>
                  <option value="either">Either</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reading Level</label>
                <select
                  value={formData.reading_level}
                  onChange={(e) => setFormData({...formData, reading_level: e.target.value})}
                >
                  {READING_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label} ({level.age})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="include-name"
                  checked={formData.include_name_in_stories}
                  onChange={(e) => setFormData({...formData, include_name_in_stories: e.target.checked})}
                />
                <label htmlFor="include-name">Include child's name in stories</label>
              </div>
            </div>

            <div className="form-section">
              <h4>Preferences</h4>
              
              <div className="form-group">
                <label>Favorite Story Topics</label>
                <div className="themes-grid">
                  {FAVORITE_THEMES.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      className={`theme-btn ${formData.favorite_themes.includes(theme.value) ? 'selected' : ''}`}
                      onClick={() => toggleTheme(theme.value)}
                    >
                      {theme.emoji} {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Favorite Things (Currently: {formData.favorite_items?.length || 0} items)</label>
                <div className="favorite-items">
                  {formData.favorite_items && formData.favorite_items.length > 0 && formData.favorite_items.map((item, index) => (
                    <span key={`${item}-${index}`} className="item-badge">
                      {item}
                      <button 
                        type="button"
                        onClick={() => removeFavoriteItem(item)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="favorite-item-input"
                    type="text"
                    placeholder="Add favorite (toy, place, character, person...)"
                    style={{ flex: 1 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target;
                        if (input.value.trim()) {
                          addFavoriteItem(input.value.trim());
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('favorite-item-input');
                      if (input && input.value.trim()) {
                        addFavoriteItem(input.value.trim());
                        input.value = '';
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProfile(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={saveProfile}
                disabled={!formData.name}
              >
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default ProfileManager;