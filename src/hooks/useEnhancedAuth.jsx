// Enhanced Authentication Hook
// Provides easy integration with existing app components

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../utils/sessionManager';

export const useEnhancedAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);
  const [quickLoginAvailable, setQuickLoginAvailable] = useState(false);

  useEffect(() => {
    // Check for mock user first (for dev/testing)
    const mockUserData = localStorage.getItem('mockUser');
    if (mockUserData) {
      try {
        const mockUser = JSON.parse(mockUserData);
        setUser(mockUser);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Invalid mock user data:', e);
      }
    }
    
    // Check current session
    checkCurrentSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Don't override mock user with null session
        const hasMockUser = localStorage.getItem('mockUser');
        if (!hasMockUser) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Track successful login
          sessionManager.trackLoginAttempt('supabase', true);
          
          // Check if user wants to enable device trust
          const loginInfo = sessionManager.getSavedLoginInfo();
          if (!loginInfo.hasRememberToken) {
            // Prompt for device trust on successful login
            promptForDeviceTrust(session.user);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          sessionManager.softLogout();
        }
      }
    );
    
    // Listen for storage events (for mock user changes)
    const handleStorageChange = () => {
      const mockUserData = localStorage.getItem('mockUser');
      if (mockUserData) {
        try {
          const mockUser = JSON.parse(mockUserData);
          setUser(mockUser);
        } catch (e) {
          console.error('Invalid mock user data:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkCurrentSession = async () => {
    try {
      // First check for mock user (for testing)
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        const userData = JSON.parse(mockUser);
        setUser(userData);
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Check if quick login is available
      const loginInfo = sessionManager.getSavedLoginInfo();
      setQuickLoginAvailable(loginInfo.quickLoginEnabled && loginInfo.savedEmail);
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const promptForDeviceTrust = (user) => {
    // Only prompt during bedtime window or after successful login
    const isBedtime = sessionManager.isBedtimeWindow();
    const shouldPrompt = isBedtime || Math.random() < 0.3; // 30% chance otherwise
    
    if (shouldPrompt) {
      setTimeout(() => {
        const enableTrust = window.confirm(
          "🌙 Make bedtime stories even easier! \n\n" +
          "Would you like to enable quick login on this device? " +
          "You'll be able to access stories faster during bedtime routines."
        );
        
        if (enableTrust) {
          sessionManager.enableRememberDevice(user.email, user.id);
          setQuickLoginAvailable(true);
        }
      }, 2000); // Delay so user sees successful login first
    }
  };

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      sessionManager.clearSession();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal(false);
  }, []);

  const handleAuthSuccess = useCallback((user) => {
    setUser(user);
    setAuthModal(false);
    
    // Enable device trust if this is a bedtime login
    if (sessionManager.isBedtimeWindow()) {
      sessionManager.enableRememberDevice(user.email, user.id);
      setQuickLoginAvailable(true);
    }
  }, []);

  const quickLogin = useCallback(async () => {
    const loginInfo = sessionManager.getSavedLoginInfo();
    if (!loginInfo.savedEmail) return false;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: loginInfo.savedEmail,
        options: { shouldCreateUser: false }
      });

      if (error) throw error;

      // Show success message
      alert(`Magic link sent to ${loginInfo.savedEmail}! Check your email to continue.`);
      return true;
    } catch (error) {
      console.error('Quick login failed:', error);
      sessionManager.trackLoginAttempt('quick-login', false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bedtime-specific helpers
  const isBedtimeMode = sessionManager.isBedtimeWindow();
  const bedtimePreferences = sessionManager.getBedtimePreferences();

  return {
    // Core auth state
    user,
    loading,
    
    // Modal management
    authModal,
    openAuthModal,
    closeAuthModal,
    handleAuthSuccess,
    
    // Enhanced features
    quickLoginAvailable,
    quickLogin,
    signOut,
    
    // Bedtime features
    isBedtimeMode,
    bedtimePreferences,
    
    // Session management
    sessionManager,
    
    // Analytics
    getLoginAnalytics: sessionManager.getLoginAnalytics.bind(sessionManager)
  };
};

// Quick integration component for existing auth buttons
export const QuickLoginButton = ({ className = '', children, ...props }) => {
  const { quickLoginAvailable, quickLogin, loading } = useEnhancedAuth();

  if (!quickLoginAvailable) return null;

  return (
    <button 
      className={`quick-login-btn ${className}`}
      onClick={quickLogin}
      disabled={loading}
      {...props}
    >
      {children || (loading ? 'Sending...' : '⚡ Quick Login')}
    </button>
  );
};

// Bedtime mode wrapper
export const BedtimeWrapper = ({ children, className = '' }) => {
  const { isBedtimeMode } = useEnhancedAuth();
  
  return (
    <div className={`${className} ${isBedtimeMode ? 'bedtime-mode' : ''}`}>
      {children}
    </div>
  );
};
