// Database Manager for Kids Story Time
// File: js/database-manager.js

class DatabaseManager {
    constructor() {
        this.client = window.supabaseClient;
    }

    // User Profile Operations
    async createUserProfile(userData) {
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .insert([{
                    user_id: userData.user_id,
                    display_name: userData.display_name,
                    child_age: userData.child_age,
                    preferences: userData.preferences || {},
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Create user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await this.client
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update user profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Story Operations
    async createStory(storyData) {
        try {
            const { data, error } = await this.client
                .from('stories')
                .insert([{
                    user_id: storyData.user_id,
                    title: storyData.title,
                    content: storyData.content,
                    age_group: storyData.age_group,
                    genre: storyData.genre,
                    characters: storyData.characters || [],
                    settings: storyData.settings || {},
                    is_public: storyData.is_public || false,
                    reading_level: storyData.reading_level,
                    story_length: storyData.story_length,
                    gender: storyData.gender,
                    custom_prompt: storyData.custom_prompt,
                    rating: null,
                    is_favorite: false,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Create story error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user's story history (for premium users)
    async getUserStoryHistory(userId, limit = 20, offset = 0) {
        try {
            const { data, error } = await this.client
                .from('stories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get story history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Rate a story
    async rateStory(storyId, rating, userId) {
        try {
            // Validate rating is between 1-5
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const { data, error } = await this.client
                .from('stories')
                .update({
                    rating: rating,
                    updated_at: new Date().toISOString()
                })
                .eq('id', storyId)
                .eq('user_id', userId) // Ensure user can only rate their own stories
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Rate story error:', error);
            return { success: false, error: error.message };
        }
    }

    // Toggle story as favorite
    async toggleStoryFavorite(storyId, userId) {
        try {
            // First get current favorite status
            const { data: currentStory, error: getError } = await this.client
                .from('stories')
                .select('is_favorite')
                .eq('id', storyId)
                .eq('user_id', userId)
                .single();

            if (getError) throw getError;

            // Toggle the favorite status
            const newFavoriteStatus = !currentStory.is_favorite;
            
            const { data, error } = await this.client
                .from('stories')
                .update({
                    is_favorite: newFavoriteStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', storyId)
                .eq('user_id', userId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0], is_favorite: newFavoriteStatus };
        } catch (error) {
            console.error('Toggle favorite error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserStories(userId, limit = 10, offset = 0) {
        try {
            const { data, error } = await this.client
                .from('stories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get user stories error:', error);
            return { success: false, error: error.message };
        }
    }

    async getStory(storyId) {
        try {
            const { data, error } = await this.client
                .from('stories')
                .select('*')
                .eq('id', storyId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get story error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateStory(storyId, updates) {
        try {
            const { data, error } = await this.client
                .from('stories')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', storyId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update story error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteStory(storyId) {
        try {
            const { error } = await this.client
                .from('stories')
                .delete()
                .eq('id', storyId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete story error:', error);
            return { success: false, error: error.message };
        }
    }

    // Favorite Stories Operations
    async addToFavorites(userId, storyId) {
        try {
            const { data, error } = await this.client
                .from('favorite_stories')
                .insert([{
                    user_id: userId,
                    story_id: storyId,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Add to favorites error:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromFavorites(userId, storyId) {
        try {
            const { error } = await this.client
                .from('favorite_stories')
                .delete()
                .eq('user_id', userId)
                .eq('story_id', storyId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Remove from favorites error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserFavorites(userId, limit = 10, offset = 0) {
        try {
            const { data, error } = await this.client
                .from('favorite_stories')
                .select(`
                    *,
                    stories (
                        id,
                        title,
                        content,
                        age_group,
                        genre,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get user favorites error:', error);
            return { success: false, error: error.message };
        }
    }

    // Story Generation Requests
    async saveStoryRequest(requestData) {
        try {
            const { data, error } = await this.client
                .from('story_requests')
                .insert([{
                    user_id: requestData.user_id,
                    prompt: requestData.prompt,
                    parameters: requestData.parameters || {},
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Save story request error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateStoryRequest(requestId, updates) {
        try {
            const { data, error } = await this.client
                .from('story_requests')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update story request error:', error);
            return { success: false, error: error.message };
        }
    }

    // Analytics and Usage Tracking
    async trackStoryGeneration(userId, metadata = {}) {
        try {
            const { data, error } = await this.client
                .from('usage_analytics')
                .insert([{
                    user_id: userId,
                    action: 'story_generated',
                    metadata: metadata,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Track story generation error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserUsageStats(userId) {
        try {
            const { data, error } = await this.client
                .from('usage_analytics')
                .select('*')
                .eq('user_id', userId)
                .eq('action', 'story_generated')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get user usage stats error:', error);
            return { success: false, error: error.message };
        }
    }

    // Public Stories (for browsing)
    async getPublicStories(filters = {}, limit = 10, offset = 0) {
        try {
            let query = this.client
                .from('stories')
                .select(`
                    *,
                    user_profiles (
                        display_name
                    )
                `)
                .eq('is_public', true);

            if (filters.age_group) {
                query = query.eq('age_group', filters.age_group);
            }

            if (filters.genre) {
                query = query.eq('genre', filters.genre);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get public stories error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global database manager instance
window.dbManager = new DatabaseManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
}