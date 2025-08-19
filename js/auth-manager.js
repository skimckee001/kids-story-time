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
                    data: userData
                }
            });

            if (error) {
                throw error;
            }

            // For demo: If account created but needs verification, provide helpful message
            if (data.user && !data.session) {
                return { 
                    success: true, 
                    data,
                    needsVerification: true,
                    message: "Account created! You may need to verify your email or it might take a moment to activate. Try logging in with the same credentials."
                };
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
                throw error;
            }

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
                storiesPerDay: 3,
                storiesPerMonth: 10,
                childProfiles: 1,
                storyHistory: false,
                storyRating: true, // Enhanced: Allow ratings for engagement
                aiReadAloud: 0,
                basicReadAloud: true, // Enhanced: Basic device TTS
                customPrompts: false,
                storyExport: false,
                storyImages: false,
                customAIImages: false
            },
            premium: {
                storiesPerDay: 999, // Unlimited
                storiesPerMonth: 999, // Unlimited
                childProfiles: 1,
                storyHistory: true,
                storyRating: true,
                aiReadAloud: 3, // 3 AI read-aloud stories per month
                basicReadAloud: true,
                customPrompts: true,
                storyExport: true, // PDF/print export
                storyImages: true, // Images to accompany stories
                customAIImages: false,
                maxWordsPerStory: 3000
            },
            family: {
                storiesPerDay: 999, // Unlimited
                storiesPerMonth: 999, // Unlimited
                childProfiles: 6, // Up to 6 child profiles
                storyHistory: true,
                storyRating: true,
                aiReadAloud: 30, // 30 AI read-aloud stories per month
                basicReadAloud: true,
                customPrompts: true,
                storyExport: true,
                storyImages: true,
                customAIImages: true, // AI generated images for each story
                maxWordsPerStory: 3000,
                storySharing: true, // Share stories between family members
                parentalControls: true
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