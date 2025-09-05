// Supabase client for React app
import { createClient } from '@supabase/supabase-js';

// Get configuration from environment variables
// These are public keys required for client-side use
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

// Check if we're using dummy/test credentials
const isDummySupabase = supabaseUrl.includes('dummy') || supabaseAnonKey === 'dummy-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase configuration. Using mock client for development.');
}

// Create mock Supabase client for development when using dummy credentials
const createMockClient = () => {
  const mockData = {
    profiles: new Map(),
    children: new Map(),
    stories: new Map(),
    subscriptions: new Map()
  };

  return {
    auth: {
      signUp: async () => ({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
      signInWithPassword: async () => ({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { code: 'PGRST116' } }),
          order: () => ({ 
            data: [], 
            error: null,
            limit: () => ({ data: [], error: null })
          })
        }),
        gte: () => ({
          lt: () => ({ data: [], error: null, count: 0 })
        }),
        single: async () => ({ data: null, error: { code: 'PGRST116' } }),
        order: () => ({
          limit: async () => ({ data: [], error: null })
        }),
        limit: async () => ({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'mock-id' }, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'mock-id' }, error: null })
          })
        })
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'mock-id' }, error: null })
        })
      }),
      delete: () => ({
        eq: async () => ({ error: null })
      })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/300' } }),
        remove: async () => ({ error: null })
      })
    },
    channel: () => ({
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} })
    }),
    removeChannel: () => {}
  };
};

// Create Supabase client (use mock if dummy credentials)
export const supabase = isDummySupabase ? createMockClient() : createClient(supabaseUrl, supabaseAnonKey);

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
    const result = await supabase.auth.getUser();
    // Handle both real and mock client response formats
    if (result.data && typeof result.data === 'object' && 'user' in result.data) {
      return result.data.user;
    }
    return null;
  },

  // Get session
  async getSession() {
    const result = await supabase.auth.getSession();
    // Handle both real and mock client response formats
    if (result.data && typeof result.data === 'object' && 'session' in result.data) {
      return result.data.session;
    }
    return null;
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