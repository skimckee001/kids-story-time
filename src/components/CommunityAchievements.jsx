import { useState, useEffect } from 'react';
import { addStarsToChild } from './StarRewardsSystem';
import './CommunityAchievements.css';

// Community-focused achievements
const COMMUNITY_ACHIEVEMENTS = [
  // Sharing Achievements
  { 
    id: 'first_share', 
    name: 'Story Sharer', 
    description: 'Share your first story with friends', 
    icon: '📤', 
    points: 15, 
    category: 'sharing',
    starReward: 10
  },
  { 
    id: 'share_3', 
    name: 'Social Butterfly', 
    description: 'Share 3 stories with friends', 
    icon: '🦋', 
    points: 30, 
    category: 'sharing',
    starReward: 20
  },
  { 
    id: 'share_10', 
    name: 'Community Builder', 
    description: 'Share 10 stories with friends', 
    icon: '🌟', 
    points: 75, 
    category: 'sharing',
    starReward: 50
  },
  { 
    id: 'share_streak_7', 
    name: 'Sharing Champion', 
    description: 'Share stories 7 days in a row', 
    icon: '🏆', 
    points: 100, 
    category: 'sharing',
    starReward: 75
  },
  
  // Family Engagement
  { 
    id: 'family_reader', 
    name: 'Family Reader', 
    description: 'Have 2 or more child profiles active', 
    icon: '👨‍👩‍👧‍👦', 
    points: 25, 
    category: 'family',
    starReward: 25
  },
  { 
    id: 'bedtime_routine', 
    name: 'Bedtime Master', 
    description: 'Read stories during bedtime hours (7-9 PM) for 5 days', 
    icon: '🌙', 
    points: 40, 
    category: 'family',
    starReward: 30
  },
  { 
    id: 'weekend_family', 
    name: 'Weekend Warriors', 
    description: 'Read stories on 4 consecutive weekends', 
    icon: '📅', 
    points: 60, 
    category: 'family',
    starReward: 40
  },
  
  // Community Inspiration
  { 
    id: 'rate_stories', 
    name: 'Story Critic', 
    description: 'Rate 10 stories to help other families', 
    icon: '⭐', 
    points: 20, 
    category: 'community',
    starReward: 15
  },
  { 
    id: 'diverse_themes', 
    name: 'Cultural Explorer', 
    description: 'Try stories from 8 different themes', 
    icon: '🌍', 
    points: 50, 
    category: 'community',
    starReward: 35
  },
  { 
    id: 'reading_mentor', 
    name: 'Reading Mentor', 
    description: 'Share tips with other parents (future feature)', 
    icon: '👩‍🏫', 
    points: 100, 
    category: 'community',
    starReward: 100,
    comingSoon: true
  },
  
  // Platform Engagement
  { 
    id: 'profile_complete', 
    name: 'Profile Master', 
    description: 'Complete child profile with preferences', 
    icon: '✅', 
    points: 15, 
    category: 'engagement',
    starReward: 10
  },
  { 
    id: 'library_organizer', 
    name: 'Library Organizer', 
    description: 'Save 25 stories to your library', 
    icon: '📚', 
    points: 35, 
    category: 'engagement',
    starReward: 25
  },
  { 
    id: 'star_spender', 
    name: 'Reward Explorer', 
    description: 'Spend 100 stars in the reward shop', 
    icon: '🛍️', 
    points: 30, 
    category: 'engagement',
    starReward: 20
  },
  
  // Special Recognition
  { 
    id: 'early_adopter', 
    name: 'Early Adopter', 
    description: 'Join KidsStoryTime.ai in the first month', 
    icon: '🚀', 
    points: 50, 
    category: 'special',
    starReward: 50
  },
  { 
    id: 'feedback_hero', 
    name: 'Feedback Hero', 
    description: 'Provide valuable feedback to improve the platform', 
    icon: '💡', 
    points: 75, 
    category: 'special',
    starReward: 60,
    comingSoon: true
  },
  { 
    id: 'community_champion', 
    name: 'Community Champion', 
    description: 'Help other families discover great stories', 
    icon: '🏅', 
    points: 150, 
    category: 'special',
    starReward: 100,
    comingSoon: true
  }
];

function CommunityAchievements({ childProfile, onClose, onStarsEarned }) {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewAchievement, setShowNewAchievement] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (childProfile) {
      loadAchievements();
      loadStats();
    }
  }, [childProfile]);

  const loadAchievements = () => {
    if (!childProfile) return;
    
    const savedAchievements = localStorage.getItem(`communityAchievements_${childProfile.id}`);
    const unlocked = savedAchievements ? JSON.parse(savedAchievements) : [];
    setUnlockedAchievements(unlocked);
    
    // Calculate total points
    const points = unlocked.reduce((total, achievementId) => {
      const achievement = COMMUNITY_ACHIEVEMENTS.find(a => a.id === achievementId);
      return total + (achievement?.points || 0);
    }, 0);
    setTotalPoints(points);
  };

  const loadStats = () => {
    if (!childProfile) return;
    
    // Get sharing stats
    const shareData = JSON.parse(localStorage.getItem(`shares_${childProfile.id}`) || '{"total": 0, "history": []}');
    
    // Get rating stats
    const ratingData = JSON.parse(localStorage.getItem(`ratings_${childProfile.id}`) || '{"total": 0}');
    
    // Get saved stories count
    const savedStories = JSON.parse(localStorage.getItem('stories') || '[]');
    const childSavedStories = savedStories.filter(s => s.child_name === childProfile.name);
    
    // Get theme variety
    const completions = JSON.parse(localStorage.getItem(`storyCompletions_${childProfile.id}`) || '[]');
    const uniqueThemes = new Set(completions.map(c => c.theme).filter(Boolean));
    
    // Get stars spent
    const rewardHistory = JSON.parse(localStorage.getItem(`starHistory_${childProfile.id}`) || '[]');
    const starsSpent = rewardHistory
      .filter(h => h.type === 'spent')
      .reduce((total, h) => total + Math.abs(h.amount), 0);
    
    // Get bedtime reading count
    const bedtimeReadings = completions.filter(c => {
      const hour = new Date(c.completedAt).getHours();
      return hour >= 19 && hour <= 21; // 7-9 PM
    });
    
    // Get weekend reading streak
    const weekendReadings = completions.filter(c => {
      const day = new Date(c.completedAt).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    // Calculate consecutive sharing days
    const sharingStreak = calculateSharingStreak(shareData.history || []);
    
    setStats({
      totalShares: shareData.total || 0,
      totalRatings: ratingData.total || 0,
      savedStoriesCount: childSavedStories.length,
      uniqueThemesCount: uniqueThemes.size,
      starsSpent,
      bedtimeReadingsCount: bedtimeReadings.length,
      weekendReadingsCount: weekendReadings.length,
      sharingStreak,
      accountAge: getAccountAge()
    });
  };

  const calculateSharingStreak = (shareHistory) => {
    if (!shareHistory.length) return 0;
    
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dayStr = currentDate.toDateString();
      const hasSharedToday = shareHistory.some(share => 
        new Date(share.date).toDateString() === dayStr
      );
      
      if (hasSharedToday) {
        streak++;
      } else if (streak > 0) {
        break; // Streak broken
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const getAccountAge = () => {
    const profileCreated = localStorage.getItem(`profileCreated_${childProfile.id}`);
    if (!profileCreated) return 0;
    
    const createdDate = new Date(profileCreated);
    const now = new Date();
    const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const checkForNewAchievements = () => {
    const newAchievements = [];
    
    COMMUNITY_ACHIEVEMENTS.forEach(achievement => {
      if (unlockedAchievements.includes(achievement.id) || achievement.comingSoon) return;
      
      let earned = false;
      
      // Sharing achievements
      if (achievement.id === 'first_share' && stats.totalShares >= 1) earned = true;
      if (achievement.id === 'share_3' && stats.totalShares >= 3) earned = true;
      if (achievement.id === 'share_10' && stats.totalShares >= 10) earned = true;
      if (achievement.id === 'share_streak_7' && stats.sharingStreak >= 7) earned = true;
      
      // Family achievements
      if (achievement.id === 'bedtime_routine' && stats.bedtimeReadingsCount >= 5) earned = true;
      if (achievement.id === 'weekend_family' && stats.weekendReadingsCount >= 4) earned = true;
      
      // Community achievements
      if (achievement.id === 'rate_stories' && stats.totalRatings >= 10) earned = true;
      if (achievement.id === 'diverse_themes' && stats.uniqueThemesCount >= 8) earned = true;
      
      // Engagement achievements
      if (achievement.id === 'profile_complete' && childProfile.preferences) earned = true;
      if (achievement.id === 'library_organizer' && stats.savedStoriesCount >= 25) earned = true;
      if (achievement.id === 'star_spender' && stats.starsSpent >= 100) earned = true;
      
      // Special achievements
      if (achievement.id === 'early_adopter' && stats.accountAge <= 30) earned = true;
      
      if (earned) {
        newAchievements.push(achievement.id);
      }
    });
    
    // Award achievements
    if (newAchievements.length > 0) {
      const updatedUnlocked = [...unlockedAchievements, ...newAchievements];
      localStorage.setItem(`communityAchievements_${childProfile.id}`, JSON.stringify(updatedUnlocked));
      setUnlockedAchievements(updatedUnlocked);
      
      // Award stars for each achievement
      newAchievements.forEach(achievementId => {
        const achievement = COMMUNITY_ACHIEVEMENTS.find(a => a.id === achievementId);
        if (achievement.starReward) {
          const newTotal = addStarsToChild(childProfile.id, achievement.starReward, `Achievement: ${achievement.name}`);
          if (onStarsEarned) {
            onStarsEarned(newTotal);
          }
        }
      });
      
      // Show first new achievement
      if (newAchievements.length === 1) {
        const achievement = COMMUNITY_ACHIEVEMENTS.find(a => a.id === newAchievements[0]);
        setShowNewAchievement(achievement);
        setTimeout(() => setShowNewAchievement(null), 5000);
      }
    }
  };

  // Check for new achievements when stats change
  useEffect(() => {
    if (Object.keys(stats).length > 0) {
      checkForNewAchievements();
    }
  }, [stats]);

  const categories = [
    { id: 'all', name: 'All Badges', icon: '🏆' },
    { id: 'sharing', name: 'Sharing', icon: '📤' },
    { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'community', name: 'Community', icon: '🌟' },
    { id: 'engagement', name: 'Engagement', icon: '🎯' },
    { id: 'special', name: 'Special', icon: '🎉' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? COMMUNITY_ACHIEVEMENTS 
    : COMMUNITY_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const getProgressText = (achievement) => {
    if (achievement.comingSoon) return 'Coming Soon';
    if (unlockedAchievements.includes(achievement.id)) return 'Unlocked!';
    
    // Return progress for specific achievements
    switch (achievement.id) {
      case 'first_share':
        return `${Math.min(stats.totalShares || 0, 1)}/1 shares`;
      case 'share_3':
        return `${Math.min(stats.totalShares || 0, 3)}/3 shares`;
      case 'share_10':
        return `${Math.min(stats.totalShares || 0, 10)}/10 shares`;
      case 'share_streak_7':
        return `${Math.min(stats.sharingStreak || 0, 7)}/7 day streak`;
      case 'rate_stories':
        return `${Math.min(stats.totalRatings || 0, 10)}/10 ratings`;
      case 'diverse_themes':
        return `${Math.min(stats.uniqueThemesCount || 0, 8)}/8 themes`;
      case 'library_organizer':
        return `${Math.min(stats.savedStoriesCount || 0, 25)}/25 saved`;
      case 'star_spender':
        return `${Math.min(stats.starsSpent || 0, 100)}/100 stars spent`;
      case 'bedtime_routine':
        return `${Math.min(stats.bedtimeReadingsCount || 0, 5)}/5 bedtime reads`;
      case 'weekend_family':
        return `${Math.min(stats.weekendReadingsCount || 0, 4)}/4 weekends`;
      default:
        return 'Keep going!';
    }
  };

  return (
    <div className="community-achievements-modal">
      <div className="achievements-modal-overlay" onClick={onClose}></div>
      <div className="achievements-modal-content">
        <div className="achievements-header">
          <div className="achievements-title">
            <h2>🌟 Community Badges</h2>
            <p>Connect, share, and build our reading community!</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="achievements-stats">
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <span className="stat-label">Badges Earned</span>
            <span className="stat-value">{unlockedAchievements.length}/{COMMUNITY_ACHIEVEMENTS.filter(a => !a.comingSoon).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-label">Community Points</span>
            <span className="stat-value">{totalPoints}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📤</span>
            <span className="stat-label">Stories Shared</span>
            <span className="stat-value">{stats.totalShares || 0}</span>
          </div>
        </div>

        <div className="achievements-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-card ${
                unlockedAchievements.includes(achievement.id) ? 'unlocked' : ''
              } ${achievement.comingSoon ? 'coming-soon' : ''}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <h3 className="achievement-name">{achievement.name}</h3>
                <p className="achievement-description">{achievement.description}</p>
                <div className="achievement-progress">
                  {getProgressText(achievement)}
                </div>
                <div className="achievement-reward">
                  {achievement.starReward && (
                    <span className="star-reward">+{achievement.starReward} ⭐</span>
                  )}
                  <span className="point-reward">{achievement.points} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Achievement Notification */}
        {showNewAchievement && (
          <div className="new-achievement-notification">
            <div className="achievement-celebration">
              <div className="celebration-icon">🎉</div>
              <h3>New Badge Unlocked!</h3>
              <div className="new-achievement-details">
                <span className="new-achievement-icon">{showNewAchievement.icon}</span>
                <div>
                  <h4>{showNewAchievement.name}</h4>
                  <p>{showNewAchievement.description}</p>
                  <span className="reward-text">+{showNewAchievement.starReward} ⭐</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityAchievements;
