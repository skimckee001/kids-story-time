// Supabase client for React app
import { createClient } from '@supabase/supabase-js';

// Get configuration from environment variables
// These are public keys required for client-side use
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  // Sign up new user
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  // Sign in existing user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // User profiles
  profiles: {
    async get(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },

    async update(userId, updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    }
  },

  // Children
  children: {
    async list(userId) {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async create(childData) {
      const user = await auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('children')
        .insert({ ...childData, user_id: user.id })
        .select()
        .single();
      return { data, error };
    },

    async update(childId, updates) {
      const { data, error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', childId)
        .select()
        .single();
      return { data, error };
    },

    async delete(childId) {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);
      return { error };
    }
  },

  // Stories
  stories: {
    async list(childId = null, limit = 20) {
      let query = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (childId) {
        query = query.eq('child_id', childId);
      }
      
      const { data, error } = await query;
      return { data, error };
    },

    async get(storyId) {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      return { data, error };
    },

    async create(storyData) {
      const user = await auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('stories')
        .insert({ ...storyData, user_id: user.id })
        .select()
        .single();
      return { data, error };
    },

    async update(storyId, updates) {
      const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', storyId)
        .select()
        .single();
      return { data, error };
    },

    async delete(storyId) {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
      return { error };
    },

    async toggleFavorite(storyId) {
      const { data: story } = await this.get(storyId);
      if (!story) throw new Error('Story not found');
      
      const { data, error } = await supabase
        .from('stories')
        .update({ is_favorite: !story.is_favorite })
        .eq('id', storyId)
        .select()
        .single();
      return { data, error };
    }
  },

  // Subscriptions
  subscriptions: {
    async get(userId) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      return { data, error };
    },

    async create(subscriptionData) {
      const user = await auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...subscriptionData, user_id: user.id })
        .select()
        .single();
      return { data, error };
    },

    async update(subscriptionId, updates) {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();
      return { data, error };
    }
  }
};

// Storage helpers
export const storage = {
  // Upload image
  async uploadImage(file, path) {
    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(path, file);
    return { data, error };
  },

  // Get public URL for image
  getPublicUrl(path) {
    const { data } = supabase.storage
      .from('story-images')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete image
  async deleteImage(path) {
    const { error } = await supabase.storage
      .from('story-images')
      .remove([path]);
    return { error };
  }
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to story updates
  subscribeToStories(childId, callback) {
    return supabase
      .channel('stories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: childId ? `child_id=eq.${childId}` : undefined
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe
  unsubscribe(subscription) {
    supabase.removeChannel(subscription);
  }
};

export default supabase;