// Session Management for Easy Parent Login
// Handles persistent login, device memory, and seamless authentication

export class SessionManager {
  constructor() {
    this.STORAGE_KEYS = {
      REMEMBER_TOKEN: 'kidsstory_remember_token',
      SAVED_EMAIL: 'kidsstory_saved_email',
      LAST_LOGIN: 'kidsstory_last_login',
      DEVICE_ID: 'kidsstory_device_id',
      BIOMETRIC_ID: 'kidsstory_biometric_id',
      QUICK_LOGIN_ENABLED: 'kidsstory_quick_login',
      PARENT_PREFERENCES: 'kidsstory_parent_prefs',
      BEDTIME_REMINDERS: 'kidsstory_bedtime_reminders'
    };
    
    this.initializeDeviceId();
  }

  // Generate or retrieve unique device identifier
  initializeDeviceId() {
    let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  }

  generateDeviceId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Enable persistent login for easy bedtime access
  enableRememberDevice(email, userId) {
    localStorage.setItem(this.STORAGE_KEYS.REMEMBER_TOKEN, 'true');
    localStorage.setItem(this.STORAGE_KEYS.SAVED_EMAIL, email);
    localStorage.setItem(this.STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
    localStorage.setItem(this.STORAGE_KEYS.QUICK_LOGIN_ENABLED, 'true');
    
    // Store device association in a more permanent way
    this.associateDeviceWithUser(userId, email);
  }

  // Associate this device with the user account
  async associateDeviceWithUser(userId, email) {
    const deviceInfo = {
      deviceId: localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      lastLogin: new Date().toISOString(),
      email: email,
      userId: userId,
      trusted: true
    };

    // In production, this would be stored server-side
    // For now, we'll use localStorage with encryption-like encoding
    const encodedDeviceInfo = btoa(JSON.stringify(deviceInfo));
    localStorage.setItem(`device_trust_${userId}`, encodedDeviceInfo);
  }

  // Check if device is trusted for quick login
  isDeviceTrusted(userId) {
    const trustedDevice = localStorage.getItem(`device_trust_${userId}`);
    if (!trustedDevice) return false;

    try {
      const deviceInfo = JSON.parse(atob(trustedDevice));
      const currentDeviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
      
      // Check if device ID matches and login is recent (within 30 days)
      const lastLogin = new Date(deviceInfo.lastLogin);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return deviceInfo.deviceId === currentDeviceId && 
             lastLogin > thirtyDaysAgo && 
             deviceInfo.trusted;
    } catch (error) {
      console.warn('Could not verify device trust:', error);
      return false;
    }
  }

  // Get saved login information
  getSavedLoginInfo() {
    return {
      hasRememberToken: localStorage.getItem(this.STORAGE_KEYS.REMEMBER_TOKEN) === 'true',
      savedEmail: localStorage.getItem(this.STORAGE_KEYS.SAVED_EMAIL),
      lastLogin: localStorage.getItem(this.STORAGE_KEYS.LAST_LOGIN),
      quickLoginEnabled: localStorage.getItem(this.STORAGE_KEYS.QUICK_LOGIN_ENABLED) === 'true',
      hasBiometric: !!localStorage.getItem(this.STORAGE_KEYS.BIOMETRIC_ID)
    };
  }

  // Clear all session data (logout)
  clearSession() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear device trust for all users
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('device_trust_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Partial logout (keep device trusted but clear current session)
  softLogout() {
    const savedEmail = localStorage.getItem(this.STORAGE_KEYS.SAVED_EMAIL);
    const deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    const quickLogin = localStorage.getItem(this.STORAGE_KEYS.QUICK_LOGIN_ENABLED);
    
    // Clear session but keep device trust
    localStorage.removeItem(this.STORAGE_KEYS.REMEMBER_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.LAST_LOGIN);
    
    return { savedEmail, deviceId, quickLogin };
  }

  // Bedtime-specific features
  setBedtimePreferences(preferences) {
    const prefs = {
      bedtimeHour: preferences.bedtimeHour || 20, // 8 PM default
      reminderEnabled: preferences.reminderEnabled || false,
      autoQuietMode: preferences.autoQuietMode || true,
      quickAccessPinned: preferences.quickAccessPinned || false,
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.STORAGE_KEYS.PARENT_PREFERENCES, JSON.stringify(prefs));
  }

  getBedtimePreferences() {
    const saved = localStorage.getItem(this.STORAGE_KEYS.PARENT_PREFERENCES);
    return saved ? JSON.parse(saved) : {
      bedtimeHour: 20,
      reminderEnabled: false,
      autoQuietMode: true,
      quickAccessPinned: false
    };
  }

  // Check if it's around bedtime (for quick access features)
  isBedtimeWindow() {
    const prefs = this.getBedtimePreferences();
    const now = new Date();
    const currentHour = now.getHours();
    const bedtimeHour = prefs.bedtimeHour;
    
    // Consider bedtime window as 1 hour before to 2 hours after
    const windowStart = bedtimeHour - 1;
    const windowEnd = bedtimeHour + 2;
    
    return currentHour >= windowStart && currentHour <= windowEnd;
  }

  // PWA Installation helpers
  canInstallPWA() {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }

  async checkPWAInstallation() {
    if (!this.canInstallPWA()) return false;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      return false;
    }
  }

  // App Store migration preparation
  prepareForAppStore() {
    const migrationData = {
      userEmail: localStorage.getItem(this.STORAGE_KEYS.SAVED_EMAIL),
      deviceId: localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID),
      preferences: this.getBedtimePreferences(),
      childProfiles: this.getChildProfiles(),
      achievements: this.getAchievements(),
      starHistory: this.getStarHistory(),
      migrationTimestamp: new Date().toISOString()
    };

    // Encode for secure transfer
    const encodedData = btoa(JSON.stringify(migrationData));
    return encodedData;
  }

  getChildProfiles() {
    const profiles = localStorage.getItem('childProfiles');
    return profiles ? JSON.parse(profiles) : [];
  }

  getAchievements() {
    const achievements = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('achievements_') || key.startsWith('communityAchievements_')) {
        achievements[key] = JSON.parse(localStorage.getItem(key) || '[]');
      }
    });
    return achievements;
  }

  getStarHistory() {
    const starHistory = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('stars_') || key.startsWith('starHistory_')) {
        starHistory[key] = localStorage.getItem(key);
      }
    });
    return starHistory;
  }

  // Import data from migration (for app store version)
  importMigrationData(encodedData) {
    try {
      const migrationData = JSON.parse(atob(encodedData));
      
      // Restore user preferences
      if (migrationData.userEmail) {
        localStorage.setItem(this.STORAGE_KEYS.SAVED_EMAIL, migrationData.userEmail);
      }
      
      if (migrationData.deviceId) {
        localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, migrationData.deviceId);
      }
      
      if (migrationData.preferences) {
        localStorage.setItem(this.STORAGE_KEYS.PARENT_PREFERENCES, JSON.stringify(migrationData.preferences));
      }
      
      // Restore child profiles
      if (migrationData.childProfiles) {
        localStorage.setItem('childProfiles', JSON.stringify(migrationData.childProfiles));
      }
      
      // Restore achievements
      if (migrationData.achievements) {
        Object.entries(migrationData.achievements).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }
      
      // Restore star history
      if (migrationData.starHistory) {
        Object.entries(migrationData.starHistory).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Migration import failed:', error);
      return false;
    }
  }

  // Analytics helpers for understanding login patterns
  trackLoginAttempt(method, success) {
    const attempt = {
      method, // 'password', 'magic-link', 'social', 'biometric'
      success,
      timestamp: new Date().toISOString(),
      deviceId: localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID),
      isBedtimeWindow: this.isBedtimeWindow()
    };

    // Store last 50 login attempts
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
    attempts.push(attempt);
    if (attempts.length > 50) {
      attempts.shift();
    }
    localStorage.setItem('login_attempts', JSON.stringify(attempts));
  }

  getLoginAnalytics() {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
    const bedtimeLogins = attempts.filter(a => a.isBedtimeWindow);
    const successfulLogins = attempts.filter(a => a.success);
    
    return {
      totalAttempts: attempts.length,
      bedtimeAttempts: bedtimeLogins.length,
      successRate: attempts.length > 0 ? (successfulLogins.length / attempts.length) : 0,
      preferredMethod: this.getMostUsedLoginMethod(attempts),
      bedtimeSuccessRate: bedtimeLogins.length > 0 ? 
        (bedtimeLogins.filter(a => a.success).length / bedtimeLogins.length) : 0
    };
  }

  getMostUsedLoginMethod(attempts) {
    const methodCounts = attempts.reduce((acc, attempt) => {
      acc[attempt.method] = (acc[attempt.method] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(methodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'password';
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Utility functions for React components
export const useSessionPersistence = () => {
  return {
    enableRememberDevice: sessionManager.enableRememberDevice.bind(sessionManager),
    getSavedLoginInfo: sessionManager.getSavedLoginInfo.bind(sessionManager),
    isDeviceTrusted: sessionManager.isDeviceTrusted.bind(sessionManager),
    clearSession: sessionManager.clearSession.bind(sessionManager),
    isBedtimeWindow: sessionManager.isBedtimeWindow.bind(sessionManager),
    setBedtimePreferences: sessionManager.setBedtimePreferences.bind(sessionManager),
    getBedtimePreferences: sessionManager.getBedtimePreferences.bind(sessionManager)
  };
};
