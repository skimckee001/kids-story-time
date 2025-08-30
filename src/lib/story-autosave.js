// Story Auto-Save Service
import { supabase } from './supabase';
import gamification from './gamification';

class StoryAutoSaveService {
  constructor() {
    this.pendingSaves = new Map();
    this.saveDebounceTime = 2000; // 2 seconds
  }

  // Auto-save story when generated
  async autoSaveStory(story, userId, childId) {
    try {
      // Check if story already has an ID (already saved)
      if (story.savedId || story.id) {
        console.log('Story already saved:', story.savedId || story.id);
        return story;
      }

      // Prepare story data
      const storyData = {
        id: crypto.randomUUID(),
        user_id: userId || localStorage.getItem('userId'),
        child_id: childId || localStorage.getItem('selectedChildId'),
        title: story.title || 'Untitled Story',
        content: story.content || story.story || '',
        theme: story.theme || 'general',
        age_group: story.ageGroup || story.age_group || '5-7',
        child_name: story.childName || story.child_name || 'Friend',
        gender: story.gender || 'neutral',
        image_url: story.imageUrl || story.image_url || null,
        reading_level: story.readingLevel || story.reading_level || 'beginningReader',
        word_count: (story.content || story.story || '').split(' ').length,
        is_favorite: false,
        created_at: new Date().toISOString(),
        metadata: {
          auto_saved: true,
          generation_params: {
            theme: story.theme,
            length: story.length,
            custom_prompt: story.customPrompt
          }
        }
      };

      // Save to database
      const { data: savedStory, error } = await supabase
        .from('stories')
        .insert([storyData])
        .select()
        .single();

      if (error) {
        console.error('Error auto-saving story:', error);
        // Save to localStorage as fallback
        this.saveToLocalStorage(storyData);
        return { ...story, savedId: storyData.id, autoSaveError: error };
      }

      // Track story creation in gamification
      await gamification.trackStoryActivity('story_created', {
        storyId: savedStory.id,
        wordCount: storyData.word_count
      });

      console.log('Story auto-saved successfully:', savedStory.id);
      
      // Return story with saved ID
      return { ...story, savedId: savedStory.id, autoSaved: true };
    } catch (error) {
      console.error('Auto-save error:', error);
      // Fallback to localStorage
      const localId = 'local-' + Date.now();
      this.saveToLocalStorage({ ...story, id: localId });
      return { ...story, savedId: localId, autoSaveError: error };
    }
  }

  // Save to localStorage as fallback
  saveToLocalStorage(story) {
    try {
      const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
      savedStories.push({
        ...story,
        savedAt: new Date().toISOString(),
        isLocal: true
      });
      localStorage.setItem('savedStories', JSON.stringify(savedStories));
      console.log('Story saved to localStorage:', story.id);
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  // Sync local stories to database when online
  async syncLocalStories(userId) {
    try {
      const localStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
      const unsyncedStories = localStories.filter(s => s.isLocal);

      if (unsyncedStories.length === 0) return;

      console.log(`Syncing ${unsyncedStories.length} local stories...`);

      for (const story of unsyncedStories) {
        const storyData = {
          ...story,
          user_id: userId,
          isLocal: undefined // Remove local flag
        };

        const { error } = await supabase
          .from('stories')
          .upsert([storyData]);

        if (!error) {
          // Remove from local storage after successful sync
          const updatedLocal = localStories.filter(s => s.id !== story.id);
          localStorage.setItem('savedStories', JSON.stringify(updatedLocal));
        }
      }

      console.log('Local stories synced successfully');
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Update story with image when it's generated
  async updateStoryImage(storyId, imageUrl) {
    try {
      // Update in database
      const { error } = await supabase
        .from('stories')
        .update({ image_url: imageUrl })
        .eq('id', storyId);

      if (error) {
        console.error('Error updating story image:', error);
        // Update in localStorage if it exists there
        this.updateLocalStoryImage(storyId, imageUrl);
      }

      console.log('Story image updated:', storyId);
    } catch (error) {
      console.error('Image update error:', error);
    }
  }

  // Update image in localStorage
  updateLocalStoryImage(storyId, imageUrl) {
    try {
      const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
      const storyIndex = savedStories.findIndex(s => s.id === storyId);
      
      if (storyIndex !== -1) {
        savedStories[storyIndex].image_url = imageUrl;
        savedStories[storyIndex].imageUrl = imageUrl;
        localStorage.setItem('savedStories', JSON.stringify(savedStories));
      }
    } catch (error) {
      console.error('Local image update error:', error);
    }
  }

  // Get all saved stories (database + local)
  async getAllSavedStories(userId) {
    try {
      const stories = [];

      // Get database stories
      if (userId) {
        const { data: dbStories, error } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && dbStories) {
          stories.push(...dbStories);
        }
      }

      // Get local stories
      const localStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
      stories.push(...localStories);

      // Remove duplicates (prefer database version)
      const uniqueStories = stories.reduce((acc, story) => {
        if (!acc.find(s => s.id === story.id)) {
          acc.push(story);
        }
        return acc;
      }, []);

      return uniqueStories.sort((a, b) => 
        new Date(b.created_at || b.savedAt) - new Date(a.created_at || a.savedAt)
      );
    } catch (error) {
      console.error('Error getting saved stories:', error);
      return [];
    }
  }
}

// Create singleton instance
const storyAutoSave = new StoryAutoSaveService();

export default storyAutoSave;