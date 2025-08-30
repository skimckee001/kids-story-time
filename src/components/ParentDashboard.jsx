import { useState, useEffect } from 'react';
import './ParentDashboard.css';

function ParentDashboard({ onClose }) {
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProfiles, setChildProfiles] = useState([]);
  const [readingStats, setReadingStats] = useState({});
  const [timeFrame, setTimeFrame] = useState('week'); // week, month, all

  useEffect(() => {
    loadChildProfiles();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadReadingStats(selectedChild.id);
    }
  }, [selectedChild, timeFrame]);

  const loadChildProfiles = () => {
    const profiles = localStorage.getItem('childProfiles');
    if (profiles) {
      const parsedProfiles = JSON.parse(profiles);
      setChildProfiles(parsedProfiles);
      if (parsedProfiles.length > 0) {
        setSelectedChild(parsedProfiles[0]);
      }
    }
  };

  const loadReadingStats = (childId) => {
    // Load various stats from localStorage
    const stats = {
      totalStories: 0,
      totalReadingTime: 0,
      averageSessionTime: 0,
      favoriteThemes: {},
      readingStreak: 0,
      achievements: [],
      stars: 0,
      storiesByDay: [],
      progressByLevel: {},
      lastReadDate: null,
      storiesThisWeek: 0,
      storiesThisMonth: 0
    };

    // Load stories
    const stories = JSON.parse(localStorage.getItem(`stories_${childId}`) || '[]');
    stats.totalStories = stories.length;

    // Calculate time-based stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    stories.forEach(story => {
      const storyDate = new Date(story.timestamp || story.createdAt);
      
      if (storyDate > oneWeekAgo) {
        stats.storiesThisWeek++;
      }
      if (storyDate > oneMonthAgo) {
        stats.storiesThisMonth++;
      }

      // Track themes
      if (story.themes) {
        story.themes.forEach(theme => {
          stats.favoriteThemes[theme] = (stats.favoriteThemes[theme] || 0) + 1;
        });
      }

      // Track reading level progress
      if (story.readingLevel) {
        stats.progressByLevel[story.readingLevel] = (stats.progressByLevel[story.readingLevel] || 0) + 1;
      }
    });

    // Get most recent story date
    if (stories.length > 0) {
      const sortedStories = stories.sort((a, b) => 
        new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
      );
      stats.lastReadDate = new Date(sortedStories[0].timestamp || sortedStories[0].createdAt);
    }

    // Load streak data
    const streakData = localStorage.getItem(`readingStreak_${childId}`);
    if (streakData) {
      const streak = JSON.parse(streakData);
      stats.readingStreak = streak.current || 0;
      stats.bestStreak = streak.best || 0;
    }

    // Load achievements
    const achievements = localStorage.getItem(`achievements_${childId}`);
    if (achievements) {
      stats.achievements = JSON.parse(achievements);
    }

    // Load stars
    const stars = localStorage.getItem(`stars_${childId}`);
    if (stars) {
      stats.stars = parseInt(stars);
    }

    // Load reading time (if tracked)
    const readingTime = localStorage.getItem(`readingTime_${childId}`);
    if (readingTime) {
      const timeData = JSON.parse(readingTime);
      stats.totalReadingTime = timeData.total || 0;
      stats.averageSessionTime = timeData.sessions ? 
        Math.round(timeData.total / timeData.sessions) : 0;
    }

    // Generate daily reading chart data for last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStories = stories.filter(story => {
        const storyDate = new Date(story.timestamp || story.createdAt);
        return storyDate.toDateString() === date.toDateString();
      });
      
      dailyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayStories.length
      });
    }
    stats.storiesByDay = dailyData;

    setReadingStats(stats);
  };

  const getTopThemes = () => {
    const themes = Object.entries(readingStats.favoriteThemes || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return themes;
  };

  const getReadingLevelProgress = () => {
    const levels = [
      'pre-reader',
      'early-phonics', 
      'beginning-reader',
      'developing-reader',
      'confident-reader',
      'advanced-reader'
    ];

    return levels.map(level => ({
      level,
      count: readingStats.progressByLevel?.[level] || 0,
      label: level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }));
  };

  const formatReadingTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDaysAgo = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const lastRead = new Date(date);
    const diffTime = Math.abs(now - lastRead);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (!selectedChild) {
    return (
      <div className="parent-dashboard-modal">
        <div className="dashboard-container">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>Parent Dashboard</h2>
          <div className="no-profiles">
            <p>No child profiles found. Please create a profile first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard-modal">
      <div className="dashboard-container">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="dashboard-header">
          <h2>Parent Dashboard</h2>
          
          {/* Child selector */}
          <div className="child-selector">
            <label>Viewing stats for:</label>
            <select 
              value={selectedChild?.id || ''} 
              onChange={(e) => {
                const child = childProfiles.find(p => p.id === e.target.value);
                setSelectedChild(child);
              }}
            >
              {childProfiles.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time frame selector */}
          <div className="timeframe-selector">
            <button 
              className={timeFrame === 'week' ? 'active' : ''}
              onClick={() => setTimeFrame('week')}
            >
              This Week
            </button>
            <button 
              className={timeFrame === 'month' ? 'active' : ''}
              onClick={() => setTimeFrame('month')}
            >
              This Month
            </button>
            <button 
              className={timeFrame === 'all' ? 'active' : ''}
              onClick={() => setTimeFrame('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">📚</div>
            <div className="metric-value">
              {timeFrame === 'week' ? readingStats.storiesThisWeek :
               timeFrame === 'month' ? readingStats.storiesThisMonth :
               readingStats.totalStories}
            </div>
            <div className="metric-label">Stories Read</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔥</div>
            <div className="metric-value">{readingStats.readingStreak || 0}</div>
            <div className="metric-label">Day Streak</div>
            <div className="metric-sublabel">Best: {readingStats.bestStreak || 0} days</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⭐</div>
            <div className="metric-value">{readingStats.stars || 0}</div>
            <div className="metric-label">Stars Earned</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🏆</div>
            <div className="metric-value">{readingStats.achievements?.length || 0}</div>
            <div className="metric-label">Achievements</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-value">
              {formatReadingTime(readingStats.totalReadingTime || 0)}
            </div>
            <div className="metric-label">Reading Time</div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📖</div>
            <div className="metric-value">
              {getDaysAgo(readingStats.lastReadDate)}
            </div>
            <div className="metric-label">Last Story</div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="chart-section">
          <h3>Reading Activity (Last 7 Days)</h3>
          <div className="bar-chart">
            {readingStats.storiesByDay?.map((day, index) => (
              <div key={index} className="bar-column">
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${Math.max(10, day.count * 30)}px`,
                      background: day.count > 0 ? 
                        'linear-gradient(135deg, #667eea, #764ba2)' : 
                        '#e0e0e0'
                    }}
                  >
                    {day.count > 0 && <span className="bar-value">{day.count}</span>}
                  </div>
                </div>
                <div className="bar-label">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Split sections */}
        <div className="insights-grid">
          {/* Favorite Themes */}
          <div className="insight-card">
            <h3>Favorite Themes</h3>
            <div className="theme-list">
              {getTopThemes().length > 0 ? (
                getTopThemes().map(([theme, count], index) => (
                  <div key={theme} className="theme-item">
                    <span className="theme-rank">{index + 1}</span>
                    <span className="theme-name">{theme}</span>
                    <span className="theme-count">{count} stories</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No theme data yet</p>
              )}
            </div>
          </div>

          {/* Reading Level Progress */}
          <div className="insight-card">
            <h3>Reading Level Progress</h3>
            <div className="level-progress">
              {getReadingLevelProgress().map(level => (
                <div key={level.level} className="level-item">
                  <div className="level-label">{level.label}</div>
                  <div className="level-bar-container">
                    <div 
                      className="level-bar" 
                      style={{ 
                        width: `${Math.min(100, level.count * 10)}%`,
                        background: level.count > 0 ? '#4caf50' : '#e0e0e0'
                      }}
                    />
                    <span className="level-count">{level.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        {readingStats.achievements?.length > 0 && (
          <div className="achievements-section">
            <h3>Recent Achievements</h3>
            <div className="achievement-badges">
              {readingStats.achievements.slice(0, 6).map((achievement, index) => (
                <div key={index} className="achievement-badge">
                  <div className="badge-icon">{achievement.icon || '🏆'}</div>
                  <div className="badge-name">{achievement.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="recommendations-section">
          <h3>Recommendations</h3>
          <div className="recommendation-cards">
            {readingStats.readingStreak === 0 && (
              <div className="recommendation">
                <span className="rec-icon">💡</span>
                <p>Start a reading streak! Read at least one story today.</p>
              </div>
            )}
            {readingStats.storiesThisWeek < 3 && (
              <div className="recommendation">
                <span className="rec-icon">📚</span>
                <p>Try to read at least 3 stories this week for consistent progress.</p>
              </div>
            )}
            {readingStats.favoriteThemes && Object.keys(readingStats.favoriteThemes).length < 3 && (
              <div className="recommendation">
                <span className="rec-icon">🎨</span>
                <p>Explore different story themes to find new favorites!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;