// Enhanced Gamification System for Kids Story Time
// Manages stars, badges, levels, and achievements

import { supabase } from './supabase';

class GamificationSystem {
  constructor() {
    this.userData = {
      stars: 0,
      level: 1,
      xp: 0,
      badges: [],
      achievements: [],
      streaks: {
        daily: 0,
        weekly: 0
      },
      statistics: {
        storiesCreated: 0,
        storiesCompleted: 0,
        wordsRead: 0,
        minutesReading: 0,
        perfectDays: 0
      }
    };

    this.levelThresholds = this.generateLevelThresholds();
    this.badges = this.defineBadges();
    this.achievements = this.defineAchievements();
    this.init();
  }

  async init() {
    await this.loadUserData();
    this.checkDailyReset();
    this.checkAchievements();
  }

  // Level System
  generateLevelThresholds() {
    const thresholds = {};
    let totalXP = 0;
    for (let level = 1; level <= 100; level++) {
      // XP required increases gradually (50 XP for level 1, 55 for level 2, etc.)
      const xpRequired = 50 + (level - 1) * 5;
      totalXP += xpRequired;
      thresholds[level] = totalXP;
    }
    return thresholds;
  }

  getLevelFromXP(xp) {
    for (let level = 100; level >= 1; level--) {
      if (xp >= this.levelThresholds[level]) {
        return level;
      }
    }
    return 1;
  }

  getXPForNextLevel() {
    const nextLevel = this.userData.level + 1;
    if (nextLevel > 100) return 0;
    return this.levelThresholds[nextLevel] - this.userData.xp;
  }

  getLevelProgress() {
    const currentLevelXP = this.levelThresholds[this.userData.level] || 0;
    const nextLevelXP = this.levelThresholds[this.userData.level + 1] || currentLevelXP;
    const levelXPRange = nextLevelXP - currentLevelXP;
    const xpIntoLevel = this.userData.xp - currentLevelXP;
    return (xpIntoLevel / levelXPRange) * 100;
  }

  // Badge Definitions
  defineBadges() {
    return {
      // Story Creation Badges
      firstStory: {
        id: 'first_story',
        name: 'Story Beginner',
        description: 'Create your first story',
        icon: '📖',
        condition: (stats) => stats.storiesCreated >= 1,
        xpReward: 10,
        starReward: 5
      },
      storyExplorer: {
        id: 'story_explorer',
        name: 'Story Explorer',
        description: 'Create 10 stories',
        icon: '🗺️',
        condition: (stats) => stats.storiesCreated >= 10,
        xpReward: 50,
        starReward: 20
      },
      storyMaster: {
        id: 'story_master',
        name: 'Story Master',
        description: 'Create 50 stories',
        icon: '👑',
        condition: (stats) => stats.storiesCreated >= 50,
        xpReward: 200,
        starReward: 100
      },

      // Reading Badges
      bookworm: {
        id: 'bookworm',
        name: 'Bookworm',
        description: 'Read 10,000 words',
        icon: '🐛',
        condition: (stats) => stats.wordsRead >= 10000,
        xpReward: 100,
        starReward: 50
      },
      speedReader: {
        id: 'speed_reader',
        name: 'Speed Reader',
        description: 'Complete a story in under 5 minutes',
        icon: '⚡',
        condition: (stats, context) => context?.readingSpeed === 'fast',
        xpReward: 30,
        starReward: 15
      },

      // Streak Badges
      weekWarrior: {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day reading streak',
        icon: '🔥',
        condition: (stats, context) => context?.streaks?.daily >= 7,
        xpReward: 75,
        starReward: 35
      },
      monthlyChampion: {
        id: 'monthly_champion',
        name: 'Monthly Champion',
        description: '30-day reading streak',
        icon: '🏆',
        condition: (stats, context) => context?.streaks?.daily >= 30,
        xpReward: 300,
        starReward: 150
      },

      // Theme Badges
      animalFriend: {
        id: 'animal_friend',
        name: 'Animal Friend',
        description: 'Complete 5 animal-themed stories',
        icon: '🦁',
        condition: (stats, context) => context?.themeCount?.animals >= 5,
        xpReward: 40,
        starReward: 20
      },
      spaceExplorer: {
        id: 'space_explorer',
        name: 'Space Explorer',
        description: 'Complete 5 space-themed stories',
        icon: '🚀',
        condition: (stats, context) => context?.themeCount?.space >= 5,
        xpReward: 40,
        starReward: 20
      },

      // Special Badges
      perfectDay: {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'Complete daily reading goal',
        icon: '⭐',
        condition: (stats) => stats.perfectDays >= 1,
        xpReward: 25,
        starReward: 10
      },
      sharingHero: {
        id: 'sharing_hero',
        name: 'Sharing Hero',
        description: 'Share 10 stories',
        icon: '💝',
        condition: (stats, context) => context?.sharesCount >= 10,
        xpReward: 60,
        starReward: 30
      }
    };
  }

  // Achievement Definitions (Reading Level Specific)
  defineAchievements() {
    return {
      preReader: [
        {
          id: 'picture_tapper',
          name: 'Picture Tapper',
          description: 'Tap 100 stars in stories',
          requirement: 100,
          progress: 0,
          icon: '✨'
        },
        {
          id: 'sticker_collector',
          name: 'Sticker Collector',
          description: 'Collect 20 story stickers',
          requirement: 20,
          progress: 0,
          icon: '🌟'
        }
      ],
      earlyPhonics: [
        {
          id: 'rhyme_master',
          name: 'Rhyme Master',
          description: 'Match 50 rhyming pairs',
          requirement: 50,
          progress: 0,
          icon: '🎵'
        },
        {
          id: 'echo_champion',
          name: 'Echo Champion',
          description: 'Repeat 30 story phrases',
          requirement: 30,
          progress: 0,
          icon: '🔊'
        }
      ],
      beginningReader: [
        {
          id: 'sight_word_hunter',
          name: 'Sight Word Hunter',
          description: 'Find 100 sight words',
          requirement: 100,
          progress: 0,
          icon: '🔍'
        },
        {
          id: 'character_friend',
          name: 'Character Friend',
          description: 'Meet 20 story characters',
          requirement: 20,
          progress: 0,
          icon: '👥'
        }
      ],
      developingReader: [
        {
          id: 'problem_solver',
          name: 'Problem Solver',
          description: 'Solve 25 story puzzles',
          requirement: 25,
          progress: 0,
          icon: '🧩'
        },
        {
          id: 'team_leader',
          name: 'Team Leader',
          description: 'Help 15 characters',
          requirement: 15,
          progress: 0,
          icon: '🤝'
        }
      ],
      fluentReader: [
        {
          id: 'vocabulary_wizard',
          name: 'Vocabulary Wizard',
          description: 'Learn 200 new words',
          requirement: 200,
          progress: 0,
          icon: '📚'
        },
        {
          id: 'moral_detective',
          name: 'Moral Detective',
          description: 'Identify 10 story morals',
          requirement: 10,
          progress: 0,
          icon: '🕵️'
        }
      ],
      insightfulReader: [
        {
          id: 'critical_thinker',
          name: 'Critical Thinker',
          description: 'Complete 20 analysis challenges',
          requirement: 20,
          progress: 0,
          icon: '🧠'
        },
        {
          id: 'global_explorer',
          name: 'Global Explorer',
          description: 'Read 15 cultural stories',
          requirement: 15,
          progress: 0,
          icon: '🌍'
        }
      ]
    };
  }

  // Star and XP Management
  async addStars(amount, reason) {
    this.userData.stars += amount;
    await this.saveUserData();
    
    // Trigger notification
    this.notifyReward('stars', amount, reason);
    
    return this.userData.stars;
  }

  async addXP(amount, source) {
    const previousLevel = this.userData.level;
    this.userData.xp += amount;
    
    // Check for level up
    const newLevel = this.getLevelFromXP(this.userData.xp);
    if (newLevel > previousLevel) {
      this.userData.level = newLevel;
      await this.handleLevelUp(previousLevel, newLevel);
    }
    
    await this.saveUserData();
    return { xp: this.userData.xp, level: this.userData.level };
  }

  async handleLevelUp(oldLevel, newLevel) {
    // Award bonus stars for leveling up
    const bonusStars = newLevel * 5;
    await this.addStars(bonusStars, 'level_up');
    
    // Trigger level up notification
    this.notifyLevelUp(oldLevel, newLevel, bonusStars);
    
    // Unlock new features based on level
    this.checkUnlockedFeatures(newLevel);
  }

  // Badge Management
  async checkAndAwardBadges(context = {}) {
    const fullContext = {
      ...this.userData.statistics,
      ...context,
      streaks: this.userData.streaks
    };

    for (const [badgeId, badge] of Object.entries(this.badges)) {
      if (!this.userData.badges.includes(badgeId)) {
        if (badge.condition(this.userData.statistics, fullContext)) {
          await this.awardBadge(badgeId);
        }
      }
    }
  }

  async awardBadge(badgeId) {
    const badge = this.badges[badgeId];
    if (!badge || this.userData.badges.includes(badgeId)) return;

    this.userData.badges.push(badgeId);
    
    // Award XP and stars
    if (badge.xpReward) {
      await this.addXP(badge.xpReward, `badge_${badgeId}`);
    }
    if (badge.starReward) {
      await this.addStars(badge.starReward, `badge_${badgeId}`);
    }
    
    await this.saveUserData();
    
    // Trigger badge notification
    this.notifyBadgeUnlocked(badge);
  }

  // Achievement Progress
  async updateAchievementProgress(readingLevel, achievementId, increment = 1) {
    const levelAchievements = this.achievements[readingLevel];
    if (!levelAchievements) return;

    const achievement = levelAchievements.find(a => a.id === achievementId);
    if (!achievement) return;

    achievement.progress = Math.min(
      achievement.progress + increment,
      achievement.requirement
    );

    // Check if achievement is completed
    if (achievement.progress >= achievement.requirement) {
      await this.completeAchievement(readingLevel, achievementId);
    }

    await this.saveUserData();
  }

  async completeAchievement(readingLevel, achievementId) {
    const achievementKey = `${readingLevel}_${achievementId}`;
    if (this.userData.achievements.includes(achievementKey)) return;

    this.userData.achievements.push(achievementKey);
    
    // Award rewards based on reading level
    const levelMultiplier = {
      preReader: 1,
      earlyPhonics: 1.2,
      beginningReader: 1.5,
      developingReader: 2,
      fluentReader: 2.5,
      insightfulReader: 3
    };
    
    const baseXP = 50;
    const baseStars = 25;
    const multiplier = levelMultiplier[readingLevel] || 1;
    
    await this.addXP(Math.floor(baseXP * multiplier), `achievement_${achievementId}`);
    await this.addStars(Math.floor(baseStars * multiplier), `achievement_${achievementId}`);
    
    const achievement = this.achievements[readingLevel].find(a => a.id === achievementId);
    this.notifyAchievementComplete(achievement);
  }

  // Streak Management
  async updateStreak(type = 'daily') {
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem(`lastActivity_${type}`);
    
    if (lastActivity !== today) {
      // Check if streak continues or resets
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActivity === yesterday.toDateString()) {
        this.userData.streaks[type]++;
      } else {
        this.userData.streaks[type] = 1;
      }
      
      localStorage.setItem(`lastActivity_${type}`, today);
      await this.saveUserData();
      
      // Check for streak badges
      await this.checkAndAwardBadges();
    }
  }

  // Story Activity Tracking
  async trackStoryActivity(activity, data = {}) {
    switch (activity) {
      case 'story_created':
        this.userData.statistics.storiesCreated++;
        await this.addXP(10, 'story_creation');
        await this.addStars(1, 'story_creation');
        break;
        
      case 'story_completed':
        this.userData.statistics.storiesCompleted++;
        this.userData.statistics.wordsRead += data.wordCount || 0;
        this.userData.statistics.minutesReading += data.readingTime || 0;
        await this.addXP(20, 'story_completion');
        await this.addStars(3, 'story_completion');
        break;
        
      case 'perfect_day':
        this.userData.statistics.perfectDays++;
        await this.addXP(50, 'perfect_day');
        await this.addStars(10, 'perfect_day');
        break;
    }
    
    await this.updateStreak('daily');
    await this.checkAndAwardBadges(data);
    await this.saveUserData();
  }

  // Notifications
  notifyReward(type, amount, reason) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gamification:reward', {
        detail: { type, amount, reason }
      }));
    }
  }

  notifyLevelUp(oldLevel, newLevel, bonusStars) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gamification:levelup', {
        detail: { oldLevel, newLevel, bonusStars }
      }));
    }
  }

  notifyBadgeUnlocked(badge) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gamification:badge', {
        detail: { badge }
      }));
    }
  }

  notifyAchievementComplete(achievement) {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gamification:achievement', {
        detail: { achievement }
      }));
    }
  }

  // Data Persistence
  async loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load from Supabase
        const { data } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          this.userData = { ...this.userData, ...data };
        }
      } else {
        // Load from localStorage for non-authenticated users
        const localData = localStorage.getItem('gamificationData');
        if (localData) {
          this.userData = { ...this.userData, ...JSON.parse(localData) };
        }
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  }

  async saveUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Save to Supabase
        await supabase
          .from('user_gamification')
          .upsert({
            user_id: user.id,
            ...this.userData,
            updated_at: new Date()
          });
      } else {
        // Save to localStorage
        localStorage.setItem('gamificationData', JSON.stringify(this.userData));
      }
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }

  // Daily Reset
  checkDailyReset() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastDailyReset');
    
    if (lastReset !== today) {
      // Reset daily limits and bonuses
      localStorage.setItem('lastDailyReset', today);
      // Could reset daily challenges, bonus multipliers, etc.
    }
  }

  // Check for newly unlocked features
  checkUnlockedFeatures(level) {
    const unlocks = {
      5: ['custom_themes'],
      10: ['voice_selection'],
      15: ['story_series'],
      20: ['advanced_illustrations'],
      25: ['multiplayer_stories']
    };
    
    return unlocks[level] || [];
  }

  // Check achievements on init
  checkAchievements() {
    // This would check all achievements and update progress
    // Called on initialization to ensure nothing was missed
  }

  // Get user's current status
  getUserStatus() {
    return {
      ...this.userData,
      levelProgress: this.getLevelProgress(),
      xpToNextLevel: this.getXPForNextLevel(),
      unlockedBadges: this.userData.badges.map(id => this.badges[id]),
      availableBadges: Object.values(this.badges).filter(b => !this.userData.badges.includes(b.id))
    };
  }
}

// Create singleton instance
const gamification = new GamificationSystem();

export default gamification;
export { GamificationSystem };