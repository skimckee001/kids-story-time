// API Bridge to connect React app with existing Netlify functions
// This bridges the gap between the React app and the existing vanilla JS infrastructure

import { supabase, auth, db } from './supabase';

class APIBridge {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  // Helper to get auth headers
  async getAuthHeaders() {
    const session = await auth.getSession();
    return {
      'Authorization': session ? `Bearer ${session.access_token}` : '',
      'Content-Type': 'application/json'
    };
  }

  // Story Generation (using existing Netlify function)
  async generateStory(storyData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/.netlify/functions/generate-story', {
        method: 'POST',
        headers,
        body: JSON.stringify(storyData)
      });

      if (!response.ok) {
        throw new Error(`Story generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save to Supabase
      if (data.story) {
        const user = await auth.getUser();
        const { data: savedStory, error } = await db.stories.create({
          title: data.story.title,
          content: data.story.content,
          child_id: storyData.childId,
          theme: storyData.theme,
          age_range: storyData.ageRange,
          moral_lesson: storyData.moralLesson,
          image_url: data.story.imageUrl,
          user_id: user?.id
        });

        if (error) {
          console.error('Failed to save story:', error);
        } else {
          data.story.id = savedStory.id;
        }
      }

      return data;
    } catch (error) {
      console.error('Story generation error:', error);
      throw error;
    }
  }

  // Image Generation (using existing Netlify function)
  async generateImage(prompt, tier = 'reader-free') {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/.netlify/functions/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, tier })
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Fallback to placeholder
      return {
        imageUrl: `https://via.placeholder.com/800x600/6B46C1/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 20))}`
      };
    }
  }

  // Child Management (bridged through Supabase)
  async createChild(childData) {
    const { data, error } = await db.children.create(childData);
    if (error) throw error;
    return { child: data };
  }

  async getChildren() {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await db.children.list(user.id);
    if (error) throw error;
    return { children: data || [] };
  }

  async updateChild(childId, childData) {
    const { data, error } = await db.children.update(childId, childData);
    if (error) throw error;
    return { child: data };
  }

  async deleteChild(childId) {
    const { error } = await db.children.delete(childId);
    if (error) throw error;
    return { success: true };
  }

  // Story Management (bridged through Supabase)
  async getStories(childId = null, limit = 20) {
    const { data, error } = await db.stories.list(childId, limit);
    if (error) throw error;
    return { stories: data || [] };
  }

  async getStory(storyId) {
    const { data, error } = await db.stories.get(storyId);
    if (error) throw error;
    return { story: data };
  }

  async toggleFavorite(storyId) {
    const { data, error } = await db.stories.toggleFavorite(storyId);
    if (error) throw error;
    return { story: data };
  }

  async deleteStory(storyId) {
    const { error } = await db.stories.delete(storyId);
    if (error) throw error;
    return { success: true };
  }

  // Subscription Management (bridged through Supabase)
  async getSubscription() {
    const user = await auth.getUser();
    if (!user) return { subscription: { tier: 'reader-free', status: 'active' } };
    
    const { data, error } = await db.subscriptions.get(user.id);
    if (error || !data) {
      // Default to reader-free tier if no subscription found
      return { subscription: { tier: 'reader-free', status: 'active' } };
    }
    return { subscription: data };
  }

  async updateSubscription(tier) {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Check for existing subscription
    const { data: existing } = await db.subscriptions.get(user.id);
    
    if (existing) {
      const { data, error } = await db.subscriptions.update(existing.id, { tier, status: 'active' });
      if (error) throw error;
      return { subscription: data };
    } else {
      const { data, error } = await db.subscriptions.create({ tier, status: 'active' });
      if (error) throw error;
      return { subscription: data };
    }
  }

  // Theme Management
  async getThemes() {
    // Return hardcoded themes matching the vanilla app
    return {
      themes: [
        { id: 'adventure', name: 'Adventure', icon: '🗺️', description: 'Exciting journeys and discoveries' },
        { id: 'fairytale', name: 'Fairy Tale', icon: '🏰', description: 'Magical stories with wonder' },
        { id: 'educational', name: 'Educational', icon: '📚', description: 'Learning through stories' },
        { id: 'bedtime', name: 'Bedtime', icon: '🌙', description: 'Calming stories for sleep' },
        { id: 'friendship', name: 'Friendship', icon: '🤝', description: 'Stories about making friends' },
        { id: 'animals', name: 'Animals', icon: '🦁', description: 'Tales with animal characters' },
        { id: 'space', name: 'Space', icon: '🚀', description: 'Adventures beyond Earth' },
        { id: 'underwater', name: 'Underwater', icon: '🐠', description: 'Ocean and sea adventures' },
        { id: 'fantasy', name: 'Fantasy', icon: '🧙‍♂️', description: 'Magical and mythical tales' },
        { id: 'mystery', name: 'Mystery', icon: '🔍', description: 'Puzzles and mysteries to solve' }
      ]
    };
  }

  // Audio Generation
  async generateNarration(storyContent, voiceType = 'alloy', speed = 1.0) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch('/.netlify/functions/generate-audio', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: storyContent,
          voice_type: voiceType,
          speed
        })
      });

      if (!response.ok) {
        throw new Error(`Audio generation failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return { audioUrl };
    } catch (error) {
      console.error('Audio generation error:', error);
      throw error;
    }
  }

  // User Profile
  async getProfile() {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await db.profiles.get(user.id);
    if (error) throw error;
    
    return {
      profile: data || {
        id: user.id,
        email: user.email,
        subscription_tier: 'reader-free',
        star_points: 0
      }
    };
  }

  async updateProfile(updates) {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await db.profiles.update(user.id, updates);
    if (error) throw error;
    return { profile: data };
  }
}

// Create singleton instance
export const apiBridge = new APIBridge();

// Export a compatible API client that matches the expected interface
export const apiClient = {
  // Children
  createChild: (data) => apiBridge.createChild(data),
  getChildren: () => apiBridge.getChildren().then(res => res.children),
  updateChild: (id, data) => apiBridge.updateChild(id, data),
  
  // Stories
  generateStory: (data) => apiBridge.generateStory(data),
  getChildStories: (childId) => apiBridge.getStories(childId).then(res => res.stories),
  getStory: (id) => apiBridge.getStory(id).then(res => res.story),
  toggleFavorite: (id) => apiBridge.toggleFavorite(id),
  
  // Themes
  getThemes: () => apiBridge.getThemes().then(res => res.themes),
  
  // Audio
  generateNarration: (storyId, voice, speed) => {
    return apiBridge.getStory(storyId).then(res => 
      apiBridge.generateNarration(res.story.content, voice, speed)
    );
  },
  
  // Subscription
  getSubscription: () => apiBridge.getSubscription().then(res => res.subscription)
};

export default apiBridge;