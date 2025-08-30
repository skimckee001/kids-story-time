// API client - now using the bridge to connect with existing infrastructure
// This maintains compatibility while connecting to Supabase and Netlify functions

import { apiClient as bridgedClient } from './api-bridge';

// Re-export the bridged client for backward compatibility
export { apiClient } from './api-bridge';

// Legacy API client class for any components still using it
class ApiClient {
  async request(endpoint, options = {}) {
    // Route to appropriate bridge method based on endpoint
    console.warn('Legacy API client used, routing through bridge:', endpoint);
    
    // Map old endpoints to new bridge methods
    if (endpoint.includes('/children') && options.method === 'POST') {
      return bridgedClient.createChild(options.body);
    }
    if (endpoint.includes('/children/') && options.method === 'GET') {
      return bridgedClient.getChildren();
    }
    if (endpoint.includes('/stories/generate')) {
      return bridgedClient.generateStory(options.body);
    }
    if (endpoint.includes('/themes')) {
      return bridgedClient.getThemes();
    }
    
    // Default fallback
    throw new Error(`Unmapped legacy endpoint: ${endpoint}`);
  }

  // Child management
  async createChild(childData) {
    return this.request('/children', {
      method: 'POST',
      body: childData,
    });
  }

  async getChildren(parentId) {
    return this.request(`/children/${parentId}`);
  }

  async updateChild(childId, childData) {
    return this.request(`/children/${childId}`, {
      method: 'PUT',
      body: childData,
    });
  }

  // Story management
  async getThemes() {
    return this.request('/themes');
  }

  async generateStory(storyData) {
    return this.request('/stories/generate', {
      method: 'POST',
      body: storyData,
    });
  }

  async getChildStories(childId, page = 1, perPage = 10) {
    return this.request(`/stories/${childId}?page=${page}&per_page=${perPage}`);
  }

  async getStory(storyId) {
    return this.request(`/stories/${storyId}`);
  }

  async toggleFavorite(storyId) {
    return this.request(`/stories/${storyId}/favorite`, {
      method: 'POST',
    });
  }

  // Series management
  async createSeries(seriesData) {
    return this.request('/series', {
      method: 'POST',
      body: seriesData,
    });
  }

  async getChildSeries(childId) {
    return this.request(`/series/${childId}`);
  }

  async addStoryToSeries(seriesData) {
    return this.request('/series/stories', {
      method: 'POST',
      body: seriesData,
    });
  }

  // Suggestions
  async getStorySuggestions(childId) {
    return this.request(`/suggestions/${childId}`);
  }

  // Interactive choices
  async makeChoice(choiceId, selectedOption) {
    return this.request(`/choices/${choiceId}`, {
      method: 'POST',
      body: { selected_option: selectedOption },
    });
  }

  // Audio narration
  async generateNarration(storyId, voiceType = 'alloy', speed = 1.0) {
    return this.request('/generate-narration', {
      method: 'POST',
      body: {
        story_id: storyId,
        voice_type: voiceType,
        speed: speed
      },
    });
  }

  async getAvailableVoices() {
    return this.request('/voices');
  }

  async getStoryAudio(storyId) {
    const url = `${API_BASE_URL}/story/${storyId}/audio`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Audio not available');
    }
    
    return response.blob();
  }

  async generateCustomAudio(text, voiceType = 'alloy', speed = 1.0) {
    const url = `${API_BASE_URL}/generate-custom-audio`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_type: voiceType,
        speed: speed
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate audio');
    }

    return response.blob();
  }
}

// Use the bridged client from api-bridge.js instead
// export const apiClient = new ApiClient();

