import { useState, useEffect } from 'react';
import ReadingGoals from './ReadingGoals';
import './AchievementSystem.css';

// Define all achievements
const ACHIEVEMENTS = [
  // Story Milestones
  { id: 'first_story', name: 'First Story', description: 'Read your first story', icon: '📖', points: 10, category: 'milestones' },
  { id: 'stories_5', name: 'Bookworm', description: 'Read 5 stories', icon: '📚', points: 25, category: 'milestones' },
  { id: 'stories_10', name: 'Story Explorer', description: 'Read 10 stories', icon: '🗺️', points: 50, category: 'milestones' },
  { id: 'stories_25', name: 'Reading Champion', description: 'Read 25 stories', icon: '🏆', points: 100, category: 'milestones' },
  { id: 'stories_50', name: 'Story Master', description: 'Read 50 stories', icon: '👑', points: 200, category: 'milestones' },
  { id: 'stories_100', name: 'Legendary Reader', description: 'Read 100 stories', icon: '🌟', points: 500, category: 'milestones' },
  
  // Theme Badges
  { id: 'theme_adventure', name: 'Adventurer', description: 'Read 5 adventure stories', icon: '🗺️', points: 30, category: 'themes' },
  { id: 'theme_animals', name: 'Animal Friend', description: 'Read 5 animal stories', icon: '🦁', points: 30, category: 'themes' },
  { id: 'theme_space', name: 'Space Explorer', description: 'Read 5 space stories', icon: '🚀', points: 30, category: 'themes' },
  { id: 'theme_fairytale', name: 'Fairy Tale Fan', description: 'Read 5 fairy tales', icon: '🏰', points: 30, category: 'themes' },
  { id: 'theme_mystery', name: 'Mystery Solver', description: 'Read 5 mystery stories', icon: '🔍', points: 30, category: 'themes' },
  { id: 'theme_variety', name: 'Theme Explorer', description: 'Try 5 different themes', icon: '🎨', points: 50, category: 'themes' },
  
  // Streak Badges
  { id: 'streak_3', name: 'Getting Started', description: '3 day reading streak', icon: '🔥', points: 20, category: 'streaks' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day reading streak', icon: '🔥', points: 50, category: 'streaks' },
  { id: 'streak_14', name: 'Two Week Champion', description: '14 day reading streak', icon: '🔥', points: 100, category: 'streaks' },
  { id: 'streak_30', name: 'Monthly Master', description: '30 day reading streak', icon: '🔥', points: 200, category: 'streaks' },
  
  // Special Badges
  { id: 'early_bird', name: 'Early Bird', description: 'Read a story before 9 AM', icon: '🌅', points: 15, category: 'special' },
  { id: 'night_owl', name: 'Night Owl', description: 'Read a bedtime story', icon: '🦉', points: 15, category: 'special' },
  { id: 'weekend_reader', name: 'Weekend Reader', description: 'Read stories on Saturday and Sunday', icon: '📅', points: 20, category: 'special' },
  { id: 'star_collector', name: 'Star Collector', description: 'Collect 100 stars', icon: '⭐', points: 50, category: 'special' },
];

function AchievementSystem({ childProfile, onClose, onGoalComplete }) {
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewAchievement, setShowNewAchievement] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, [childProfile]);

  const loadAchievements = () => {
    if (!childProfile) return;
    
    // Load achievements from localStorage
    const savedAchievements = localStorage.getItem(`achievements_${childProfile.id}`);
    const unlocked = savedAchievements ? JSON.parse(savedAchievements) : [];
    setUnlockedAchievements(unlocked);
    
    // Calculate total points
    const points = unlocked.reduce((total, achievementId) => {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      return total + (achievement?.points || 0);
    }, 0);
    setTotalPoints(points);
    
    // Load reading statistics
    const stats = getReadingStats();
    checkForNewAchievements(stats, unlocked);
  };

  const getReadingStats = () => {
    if (!childProfile) return {};
    
    // Get stories from localStorage
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const childStories = stories.filter(s => s.child_name === childProfile.name);
    
    // Get theme counts
    const themeCounts = {};
    const uniqueThemes = new Set();
    childStories.forEach(story => {
      if (story.theme) {
        const theme = story.theme.toLowerCase();
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        uniqueThemes.add(theme);
      }
    });
    
    // Get streak data
    const streakData = JSON.parse(localStorage.getItem(`streak_${childProfile.id}`) || '{}');
    
    return {
      totalStories: childStories.length,
      themeCounts,
      uniqueThemesCount: uniqueThemes.size,
      currentStreak: streakData.current || 0,
      longestStreak: streakData.longest || 0,
      totalStars: localStorage.getItem(`stars_${childProfile.id}`) || 0
    };
  };

  const checkForNewAchievements = (stats, currentUnlocked) => {
    const newAchievements = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      if (currentUnlocked.includes(achievement.id)) return;
      
      let earned = false;
      
      // Check milestones
      if (achievement.id === 'first_story' && stats.totalStories >= 1) earned = true;
      if (achievement.id === 'stories_5' && stats.totalStories >= 5) earned = true;
      if (achievement.id === 'stories_10' && stats.totalStories >= 10) earned = true;
      if (achievement.id === 'stories_25' && stats.totalStories >= 25) earned = true;
      if (achievement.id === 'stories_50' && stats.totalStories >= 50) earned = true;
      if (achievement.id === 'stories_100' && stats.totalStories >= 100) earned = true;
      
      // Check theme achievements
      if (achievement.id === 'theme_adventure' && (stats.themeCounts['adventure'] || 0) >= 5) earned = true;
      if (achievement.id === 'theme_animals' && (stats.themeCounts['animals'] || 0) >= 5) earned = true;
      if (achievement.id === 'theme_space' && (stats.themeCounts['space'] || 0) >= 5) earned = true;
      if (achievement.id === 'theme_fairytale' && (stats.themeCounts['fairytale'] || 0) >= 5) earned = true;
      if (achievement.id === 'theme_mystery' && (stats.themeCounts['mystery'] || 0) >= 5) earned = true;
      if (achievement.id === 'theme_variety' && stats.uniqueThemesCount >= 5) earned = true;
      
      // Check streak achievements
      if (achievement.id === 'streak_3' && stats.longestStreak >= 3) earned = true;
      if (achievement.id === 'streak_7' && stats.longestStreak >= 7) earned = true;
      if (achievement.id === 'streak_14' && stats.longestStreak >= 14) earned = true;
      if (achievement.id === 'streak_30' && stats.longestStreak >= 30) earned = true;
      
      // Check special achievements
      if (achievement.id === 'star_collector' && parseInt(stats.totalStars) >= 100) earned = true;
      
      if (earned) {
        newAchievements.push(achievement.id);
      }
    });
    
    // Save new achievements
    if (newAchievements.length > 0) {
      const updatedUnlocked = [...currentUnlocked, ...newAchievements];
      localStorage.setItem(`achievements_${childProfile.id}`, JSON.stringify(updatedUnlocked));
      setUnlockedAchievements(updatedUnlocked);
      
      // Show achievement notification
      if (newAchievements.length === 1) {
        const achievement = ACHIEVEMENTS.find(a => a.id === newAchievements[0]);
        setShowNewAchievement(achievement);
        setTimeout(() => setShowNewAchievement(null), 5000);
      }
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') return ACHIEVEMENTS;
    if (selectedCategory === 'completed') {
      return ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id));
    }
    return ACHIEVEMENTS.filter(a => a.category === selectedCategory);
  };

  const getProgress = () => {
    const achievements = getFilteredAchievements();
    const total = achievements.length;
    const unlocked = achievements.filter(a => unlockedAchievements.includes(a.id)).length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
  };

  const progress = getProgress();
  const filteredAchievements = getFilteredAchievements();

  return (
    <div className="achievement-system">
      <div className="achievement-content">
        <div className="achievement-header">
          <h2>🏆 Achievements</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Progress Overview */}
        <div className="achievement-overview">
          <div className="achievement-stats">
            <div className="stat-card">
              <span className="stat-value">{progress.unlocked}/{progress.total}</span>
              <span className="stat-label">
                {selectedCategory === 'all' ? 'Achievements' : 
                 selectedCategory === 'completed' ? 'Completed' :
                 selectedCategory === 'milestones' ? 'Milestones' :
                 selectedCategory === 'themes' ? 'Theme Badges' :
                 selectedCategory === 'streaks' ? 'Streak Badges' :
                 'Special Badges'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{totalPoints}</span>
              <span className="stat-label">Total Stars</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{progress.percentage}%</span>
              <span className="stat-label">
                {selectedCategory === 'all' ? 'All Complete' : 
                 selectedCategory === 'completed' ? 'Showing Completed' :
                 selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) + ' Complete'}
              </span>
            </div>
          </div>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="achievement-filters">
          <button 
            className={selectedCategory === 'completed' ? 'active' : ''}
            onClick={() => setSelectedCategory('completed')}
          >
            Completed
          </button>
          <button 
            className={selectedCategory === 'milestones' ? 'active' : ''}
            onClick={() => setSelectedCategory('milestones')}
          >
            Milestones
          </button>
          <button 
            className={selectedCategory === 'themes' ? 'active' : ''}
            onClick={() => setSelectedCategory('themes')}
          >
            Themes
          </button>
          <button 
            className={selectedCategory === 'streaks' ? 'active' : ''}
            onClick={() => setSelectedCategory('streaks')}
          >
            Streaks
          </button>
          <button 
            className={selectedCategory === 'special' ? 'active' : ''}
            onClick={() => setSelectedCategory('special')}
          >
            Special
          </button>
          <button 
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
        </div>

        {/* Achievement Grid */}
        <div className="achievement-grid">
          {filteredAchievements.map(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            return (
              <div 
                key={achievement.id} 
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  <div className="achievement-points">
                    <span className="points-icon">⭐</span>
                    <span>{achievement.points}</span>
                  </div>
                </div>
                {isUnlocked && <div className="achievement-check">✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Achievement Notification */}
      {showNewAchievement && (
        <div className="achievement-notification">
          <div className="notification-content">
            <span className="notification-icon">{showNewAchievement.icon}</span>
            <div className="notification-text">
              <h4>Achievement Unlocked!</h4>
              <p>{showNewAchievement.name}</p>
              <span className="notification-points">+{showNewAchievement.points} ⭐</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Reading Goals Section */}
      <div className="reading-goals-section" style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '1.3rem' }}>Reading Goals</h3>
        <ReadingGoals 
          childProfile={childProfile}
          onGoalComplete={onGoalComplete || ((goal, stars) => {
            console.log(`Goal completed: ${goal.title}, earned ${stars} stars!`);
          })}
        />
      </div>
    </div>
  );
}

export default AchievementSystem;