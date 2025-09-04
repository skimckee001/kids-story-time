// Usage Tracking and Enforcement System
import { supabase } from '../lib/supabase';
import { getTierLimits, canGenerateStory, canUseAIIllustration, canUseNarration } from './subscriptionTiers';

export class UsageTracker {
  constructor() {
    this.cache = new Map();
  }

  // Get current month/year for usage tracking
  getCurrentPeriod() {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  }

  // Load usage stats from database
  async loadUsageStats(userId) {
    if (!userId) return null;

    const cacheKey = `${userId}_${this.getCurrentPeriod().month}_${this.getCurrentPeriod().year}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { month, year } = this.getCurrentPeriod();
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading usage stats:', error);
        return null;
      }

      const usage = data || {
        stories_used: 0,
        ai_illustrations_used: 0,
        narrations_used: 0,
        month,
        year
      };

      // Cache the result
      this.cache.set(cacheKey, usage);
      
      return usage;
    } catch (error) {
      console.error('Error loading usage stats:', error);
      return null;
    }
  }

  // Update usage stats in database
  async updateUsageStats(userId, updates) {
    if (!userId) return false;

    try {
      const { month, year } = this.getCurrentPeriod();
      const cacheKey = `${userId}_${month}_${year}`;

      const { data, error } = await supabase
        .from('user_usage')
        .upsert({
          user_id: userId,
          month,
          year,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, month, year'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating usage stats:', error);
        return false;
      }

      // Update cache
      this.cache.set(cacheKey, data);
      
      return true;
    } catch (error) {
      console.error('Error updating usage stats:', error);
      return false;
    }
  }

  // Check if user can perform action
  async canPerformAction(userId, tier, action) {
    const usage = await this.loadUsageStats(userId);
    const limits = getTierLimits(tier, userId ? { id: userId } : null);

    if (!usage) {
      // If we can't load usage, be conservative and allow for free tier limits
      return true;
    }

    switch (action) {
      case 'generate_story':
        // Check both daily and monthly limits
        const todayUsage = await this.getTodayStoryCount(userId);
        
        if (limits.dailyStories !== 'unlimited' && todayUsage >= limits.dailyStories) {
          return false;
        }
        
        if (limits.monthlyStories !== 'unlimited' && limits.monthlyStories !== null) {
          return usage.stories_used < limits.monthlyStories;
        }
        
        return true;

      case 'ai_illustration':
        if (limits.aiIllustrations === 'unlimited') return true;
        if (limits.aiIllustrations === 0) return false;
        return usage.ai_illustrations_used < limits.aiIllustrations;

      case 'narration':
        if (limits.narrations === 'unlimited') return true;
        if (limits.narrations === 0) return false;
        return usage.narrations_used < limits.narrations;

      default:
        return true;
    }
  }

  // Get today's story count for daily limits
  async getTodayStoryCount(userId) {
    if (!userId) return 0;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error counting today stories:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting today stories:', error);
      return 0;
    }
  }

  // Increment usage counter
  async incrementUsage(userId, type, amount = 1) {
    if (!userId) return false;

    const usage = await this.loadUsageStats(userId);
    if (!usage) return false;

    const updates = {};
    
    switch (type) {
      case 'story':
        updates.stories_used = (usage.stories_used || 0) + amount;
        break;
      case 'ai_illustration':
        updates.ai_illustrations_used = (usage.ai_illustrations_used || 0) + amount;
        break;
      case 'narration':
        updates.narrations_used = (usage.narrations_used || 0) + amount;
        break;
      default:
        return false;
    }

    return await this.updateUsageStats(userId, updates);
  }

  // Get usage summary for display
  async getUsageSummary(userId, tier) {
    const usage = await this.loadUsageStats(userId);
    const limits = getTierLimits(tier, userId ? { id: userId } : null);
    const todayStories = await this.getTodayStoryCount(userId);

    if (!usage) {
      return {
        dailyStories: { used: 0, limit: limits.dailyStories },
        monthlyStories: { used: 0, limit: limits.monthlyStories },
        aiIllustrations: { used: 0, limit: limits.aiIllustrations },
        narrations: { used: 0, limit: limits.narrations }
      };
    }

    return {
      dailyStories: { 
        used: todayStories, 
        limit: limits.dailyStories,
        remaining: limits.dailyStories === 'unlimited' ? 'unlimited' : Math.max(0, limits.dailyStories - todayStories)
      },
      monthlyStories: { 
        used: usage.stories_used || 0, 
        limit: limits.monthlyStories,
        remaining: limits.monthlyStories === 'unlimited' ? 'unlimited' : Math.max(0, limits.monthlyStories - (usage.stories_used || 0))
      },
      aiIllustrations: { 
        used: usage.ai_illustrations_used || 0, 
        limit: limits.aiIllustrations,
        remaining: limits.aiIllustrations === 'unlimited' ? 'unlimited' : Math.max(0, limits.aiIllustrations - (usage.ai_illustrations_used || 0))
      },
      narrations: { 
        used: usage.narrations_used || 0, 
        limit: limits.narrations,
        remaining: limits.narrations === 'unlimited' ? 'unlimited' : Math.max(0, limits.narrations - (usage.narrations_used || 0))
      }
    };
  }

  // Clear cache (useful for testing or when user changes)
  clearCache() {
    this.cache.clear();
  }

  // Get upgrade message based on what limit was hit
  getUpgradeMessage(tier, limitType, action) {
    const messages = {
      'try-now': {
        story: 'Create a free account to get 3 stories per day!',
        ai_illustration: 'Create a free account to unlock AI illustrations!',
        narration: 'Create a free account to unlock voice narrations!'
      },
      'reader-free': {
        story: 'Upgrade to Story Pro for 10 stories per day and 50 per month!',
        ai_illustration: 'Upgrade to Story Pro for 30 AI illustrations per month!',
        narration: 'Upgrade to Story Pro for 3 voice narrations per month!'
      },
      'story-pro': {
        story: 'Upgrade to Read to Me ProMax for 20 stories per day!',
        ai_illustration: 'Upgrade to Read to Me ProMax for 150 AI illustrations per month!',
        narration: 'Upgrade to Read to Me ProMax for 30 voice narrations per month!'
      },
      'read-to-me-promax': {
        story: 'Upgrade to Family Plus for unlimited stories!',
        ai_illustration: 'Upgrade to Family Plus for 250 AI illustrations per month!',
        narration: 'Upgrade to Family Plus for 50 voice narrations per month!'
      },
      'family-plus': {
        story: 'You have unlimited stories! This shouldn\'t happen.',
        ai_illustration: 'You have 250 AI illustrations per month. Contact support if you need more.',
        narration: 'You have 50 voice narrations per month. Contact support if you need more.'
      }
    };

    return messages[tier]?.[limitType] || `Upgrade your plan for more ${action} features!`;
  }
}

// Create singleton instance
export const usageTracker = new UsageTracker();

// Convenience functions for React components
export const useUsageTracker = () => usageTracker;

export default usageTracker;
