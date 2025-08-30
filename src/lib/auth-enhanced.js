// Enhanced Auth Service with Default Profile Creation
import { supabase } from './supabase';
import gamification from './gamification';

export const authEnhanced = {
  // Sign up with automatic default profile creation
  async signUpWithProfile(email, password, parentName = '') {
    try {
      // 1. Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            parent_name: parentName || email.split('@')[0]
          }
        }
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('User creation failed');

      // 2. Create default child profile
      const defaultProfile = {
        id: crypto.randomUUID(),
        parent_id: user.id,
        name: 'My Reader',
        age: 7, // Default to middle age range
        gender: 'neutral',
        reading_level: 'beginningReader',
        favorite_themes: ['adventure', 'animals', 'magic'],
        is_default: true,
        created_at: new Date().toISOString()
      };

      // 3. Save default profile to database
      const { error: profileError } = await supabase
        .from('children')
        .insert([defaultProfile]);

      if (profileError) {
        console.error('Error creating default profile:', profileError);
        // Continue anyway - profile can be created later
      }

      // 4. Initialize gamification for user
      await gamification.init();

      // 5. Store profile locally for immediate use
      localStorage.setItem('defaultChildProfile', JSON.stringify(defaultProfile));
      localStorage.setItem('selectedChildId', defaultProfile.id);

      return {
        user,
        profile: defaultProfile,
        error: null
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, profile: null, error };
    }
  },

  // Get or create default profile for existing users
  async getOrCreateDefaultProfile(userId) {
    try {
      // Check for existing default profile
      const { data: existingProfiles, error: fetchError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .eq('is_default', true)
        .single();

      if (existingProfiles) {
        return existingProfiles;
      }

      // Create default profile if none exists
      const defaultProfile = {
        id: crypto.randomUUID(),
        parent_id: userId,
        name: 'My Reader',
        age: 7,
        gender: 'neutral',
        reading_level: 'beginningReader',
        favorite_themes: ['adventure', 'animals', 'magic'],
        is_default: true,
        created_at: new Date().toISOString()
      };

      const { data: newProfile, error: createError } = await supabase
        .from('children')
        .insert([defaultProfile])
        .select()
        .single();

      if (createError) {
        console.error('Error creating default profile:', createError);
        // Return local version as fallback
        localStorage.setItem('defaultChildProfile', JSON.stringify(defaultProfile));
        return defaultProfile;
      }

      return newProfile;
    } catch (error) {
      console.error('Profile error:', error);
      
      // Fallback to local storage
      const localProfile = localStorage.getItem('defaultChildProfile');
      if (localProfile) {
        return JSON.parse(localProfile);
      }

      // Last resort - return a basic profile
      return {
        id: 'local-' + Date.now(),
        name: 'My Reader',
        age: 7,
        gender: 'neutral',
        reading_level: 'beginningReader',
        is_default: true
      };
    }
  },

  // Enhanced sign in that ensures profile exists
  async signInWithProfile(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('Sign in failed');

      // Get or create default profile
      const profile = await this.getOrCreateDefaultProfile(user.id);

      // Initialize gamification
      await gamification.init();

      return {
        user,
        profile,
        error: null
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, profile: null, error };
    }
  },

  // Get current user with profile
  async getCurrentUserWithProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { user: null, profile: null };
      }

      const profile = await this.getOrCreateDefaultProfile(user.id);
      
      return { user, profile };
    } catch (error) {
      console.error('Error getting user with profile:', error);
      return { user: null, profile: null };
    }
  }
};