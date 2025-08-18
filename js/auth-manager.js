// Authentication Manager for Kids Story Time
// File: js/auth-manager.js

class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.authStateCallbacks = [];
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

    // Get user's subscription status (placeholder for future implementation)
    getSubscriptionStatus() {
        // This would integrate with your subscription system
        return 'free'; // 'free', 'premium', 'family', etc.
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}