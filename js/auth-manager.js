// Authentication Manager for Kids Story Time
// File: js/auth-manager.js

class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.authStateCallbacks = [];
        this.demoMode = false; // Enable demo mode for testing
        this.init();
    }

    async init() {
        try {
            // Check for existing session
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session) {
                this.user = session.user;
                this.isAuthenticated = true;
                this.notifyAuthStateChange();
            }

            // Listen for auth state changes
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                
                if (session) {
                    this.user = session.user;
                    this.isAuthenticated = true;
                } else {
                    this.user = null;
                    this.isAuthenticated = false;
                }
                
                this.notifyAuthStateChange();
            });

        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    // Sign up with email and password
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData,
                    emailRedirectTo: undefined // Disable email confirmation for now
                }
            });

            if (error) {
                console.error('Supabase sign up error:', error);
                throw error;
            }

            console.log('Sign up successful:', data);

            // Check if user was created successfully
            if (data.user) {
                if (data.session) {
                    // User is immediately signed in (email confirmation disabled)
                    return { 
                        success: true, 
                        data,
                        message: "Account created and you're now signed in!"
                    };
                } else {
                    // User created but needs verification
                    return { 
                        success: true, 
                        data,
                        needsVerification: true,
                        message: "Account created! Please check your email to verify your account, or try logging in directly."
                    };
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Supabase sign in error:', error);
                
                // Provide better error messages for common issues
                let userFriendlyMessage = error.message;
                if (error.message.includes('Invalid login credentials')) {
                    userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
                } else if (error.message.includes('Email not confirmed')) {
                    userFriendlyMessage = 'Please check your email and click the confirmation link before signing in.';
                } else if (error.message.includes('Too many requests')) {
                    userFriendlyMessage = 'Too many login attempts. Please wait a moment and try again.';
                }
                
                throw new Error(userFriendlyMessage);
            }

            console.log('Sign in successful:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) {
                throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email);

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user profile
    async updateProfile(updates) {
        try {
            const { data, error } = await window.supabaseClient.auth.updateUser({
                data: updates
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Add auth state change callback
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
    }

    // Remove auth state change callback
    removeAuthStateCallback(callback) {
        const index = this.authStateCallbacks.indexOf(callback);
        if (index > -1) {
            this.authStateCallbacks.splice(index, 1);
        }
    }

    // Notify all callbacks of auth state change
    notifyAuthStateChange() {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(this.isAuthenticated, this.user);
            } catch (error) {
                console.error('Auth state callback error:', error);
            }
        });
    }

    // Get user's display name
    getUserDisplayName() {
        if (!this.user) return null;
        
        return this.user.user_metadata?.display_name || 
               this.user.user_metadata?.full_name || 
               this.user.email?.split('@')[0] || 
               'User';
    }

    // Check if user has completed profile
    hasCompleteProfile() {
        if (!this.user) return false;
        
        const metadata = this.user.user_metadata || {};
        return !!(metadata.display_name && metadata.child_age);
    }

    // Get user's subscription status
    async getSubscriptionStatus() {
        if (!this.user) return 'free';
        
        try {
            // Check if this is a test user (for development)
            if (this.user.id && this.user.id.startsWith('test-')) {
                const testTier = this.user.user_metadata?.subscription_type;
                if (testTier) {
                    console.log(`Test user detected with tier: ${testTier}`);
                    return testTier;
                }
            }
            
            // Check user profile for subscription info
            const result = await window.dbManager.getUserProfile(this.user.id);
            if (result.success && result.data.subscription_type) {
                return result.data.subscription_type;
            }
            
            // Check user metadata for subscription info
            const metadata = this.user.user_metadata || {};
            return metadata.subscription_type || 'free';
        } catch (error) {
            console.error('Error getting subscription status:', error);
            return 'free';
        }
    }

    // Check if user has premium access
    async hasPremiumAccess() {
        const status = await this.getSubscriptionStatus();
        return ['premium', 'family', 'lifetime'].includes(status);
    }

    // Get usage limits based on subscription
    getUsageLimits(subscriptionType = 'free') {
        const limits = {
            free: {
                storiesPerDay: 5,
                storiesPerMonth: 20,
                childProfiles: 1,
                storyHistory: false,
                storyRating: true,
                aiReadAloud: 0,
                basicReadAloud: true,
                customPrompts: false,
                storyExport: false,
                storyImages: false,
                customAIImages: false,
                storyPersonalization: false,
                bedtimeIntegration: false,
                educationalThemes: false,
                favoriteCharacters: false,
                priorityGeneration: false
            },
            premium: {
                storiesPerDay: 999, // Unlimited
                storiesPerMonth: 999, // Unlimited
                childProfiles: 1,
                storyHistory: true,
                storyRating: true,
                aiReadAloud: 10, // 10 AI read-aloud stories per month
                basicReadAloud: true,
                customPrompts: true,
                storyExport: true,
                storyImages: true,
                customAIImages: false,
                maxWordsPerStory: 3000,
                storyPersonalization: true,
                bedtimeIntegration: true,
                educationalThemes: true,
                favoriteCharacters: true,
                priorityGeneration: true,
                seasonalContent: true
            },
            family: {
                storiesPerDay: 999, // Unlimited
                storiesPerMonth: 999, // Unlimited
                childProfiles: 6,
                storyHistory: true,
                storyRating: true,
                aiReadAloud: 50, // 50 AI read-aloud stories per month
                basicReadAloud: true,
                customPrompts: true,
                storyExport: true,
                storyImages: true,
                customAIImages: true,
                maxWordsPerStory: 3000,
                storySharing: true,
                parentalControls: true,
                storyPersonalization: true,
                bedtimeIntegration: true,
                educationalThemes: true,
                favoriteCharacters: true,
                priorityGeneration: true,
                seasonalContent: true,
                progressTracking: true,
                storyCollaboration: true,
                parentDashboard: true,
                offlineMode: true,
                ageFiltering: true
            }
        };
        
        return limits[subscriptionType] || limits.free;
    }

    // Check if user can generate a story (based on daily/monthly limits)
    async canGenerateStory() {
        const subscriptionType = await this.getSubscriptionStatus();
        const limits = this.getUsageLimits(subscriptionType);
        
        if (!this.user) {
            // Anonymous users get limited free stories
            return true;
        }
        
        // For test users, always allow story generation
        if (this.user.id && this.user.id.startsWith('test-')) {
            console.log(`Test user - allowing story generation for ${subscriptionType} tier`);
            return true;
        }
        
        try {
            // Get usage stats for current month and today
            const monthlyResult = await window.dbManager.getUserUsageStats(this.user.id);
            const todayResult = await window.dbManager.getUserDailyUsageStats(this.user.id);
            
            if (monthlyResult.success && todayResult.success) {
                const currentMonthUsage = monthlyResult.data.length;
                const todayUsage = todayResult.data.length;
                
                // Check both daily and monthly limits
                const withinDailyLimit = todayUsage < limits.storiesPerDay;
                const withinMonthlyLimit = currentMonthUsage < limits.storiesPerMonth;
                
                return withinDailyLimit && withinMonthlyLimit;
            }
        } catch (error) {
            console.error('Error checking story generation limits:', error);
        }
        
        // Default to allowing for premium users, restricting for free
        return subscriptionType !== 'free';
    }

    // Get remaining stories for current month
    async getRemainingStories() {
        const subscriptionType = await this.getSubscriptionStatus();
        const limits = this.getUsageLimits(subscriptionType);
        
        if (!this.user) return 0;
        
        try {
            const result = await window.dbManager.getUserUsageStats(this.user.id);
            if (result.success) {
                const currentMonthUsage = result.data.length;
                return Math.max(0, limits.storiesPerMonth - currentMonthUsage);
            }
        } catch (error) {
            console.error('Error getting remaining stories:', error);
        }
        
        return limits.storiesPerMonth;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}