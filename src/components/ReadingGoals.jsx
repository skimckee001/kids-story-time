import { useState, useEffect } from 'react';
import './ReadingGoals.css';

function ReadingGoals({ childProfile, onGoalComplete }) {
  const [goals, setGoals] = useState([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'stories',
    target: 5,
    period: 'week',
    title: ''
  });

  // Goal templates
  const goalTemplates = [
    { type: 'stories', target: 3, period: 'week', title: 'Read 3 stories this week' },
    { type: 'stories', target: 1, period: 'day', title: 'Daily reading goal' },
    { type: 'streak', target: 7, period: 'once', title: 'Achieve a 7-day streak' },
    { type: 'minutes', target: 30, period: 'day', title: 'Read for 30 minutes daily' },
    { type: 'themes', target: 3, period: 'week', title: 'Explore 3 different themes' },
    { type: 'achievements', target: 5, period: 'month', title: 'Unlock 5 achievements' }
  ];

  useEffect(() => {
    if (childProfile?.id) {
      loadGoals();
    }
  }, [childProfile]);

  const loadGoals = () => {
    if (!childProfile?.id) return;
    
    const savedGoals = localStorage.getItem(`readingGoals_${childProfile.id}`);
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      // Update progress for each goal
      const updatedGoals = parsedGoals.map(goal => ({
        ...goal,
        progress: calculateProgress(goal)
      }));
      setGoals(updatedGoals);
    }
  };

  const calculateProgress = (goal) => {
    const childId = childProfile?.id;
    if (!childId) return 0;

    const now = new Date();
    const goalStart = new Date(goal.createdAt);
    
    switch (goal.type) {
      case 'stories': {
        const stories = JSON.parse(localStorage.getItem(`stories_${childId}`) || '[]');
        let relevantStories = stories;
        
        if (goal.period === 'day') {
          relevantStories = stories.filter(s => {
            const storyDate = new Date(s.timestamp || s.created_at);
            return storyDate.toDateString() === now.toDateString();
          });
        } else if (goal.period === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          relevantStories = stories.filter(s => {
            const storyDate = new Date(s.timestamp || s.created_at);
            return storyDate > oneWeekAgo;
          });
        } else if (goal.period === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          relevantStories = stories.filter(s => {
            const storyDate = new Date(s.timestamp || s.created_at);
            return storyDate > oneMonthAgo;
          });
        }
        
        return Math.min(relevantStories.length, goal.target);
      }
      
      case 'streak': {
        const streakData = localStorage.getItem(`readingStreak_${childId}`);
        if (streakData) {
          const streak = JSON.parse(streakData);
          return Math.min(streak.current || 0, goal.target);
        }
        return 0;
      }
      
      case 'minutes': {
        const timeData = localStorage.getItem(`readingTime_${childId}`);
        if (timeData) {
          const data = JSON.parse(timeData);
          if (goal.period === 'day' && data.history) {
            const todayMinutes = data.history
              .filter(h => new Date(h.date).toDateString() === now.toDateString())
              .reduce((sum, h) => sum + h.duration, 0);
            return Math.min(todayMinutes, goal.target);
          }
          return Math.min(data.total || 0, goal.target);
        }
        return 0;
      }
      
      case 'achievements': {
        const achievements = localStorage.getItem(`achievements_${childId}`);
        if (achievements) {
          const achievementList = JSON.parse(achievements);
          const relevantAchievements = achievementList.filter(a => 
            new Date(a.unlockedAt) > goalStart
          );
          return Math.min(relevantAchievements.length, goal.target);
        }
        return 0;
      }
      
      case 'themes': {
        const stories = JSON.parse(localStorage.getItem(`stories_${childId}`) || '[]');
        const themes = new Set();
        
        let relevantStories = stories;
        if (goal.period === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          relevantStories = stories.filter(s => 
            new Date(s.timestamp || s.created_at) > oneWeekAgo
          );
        }
        
        relevantStories.forEach(story => {
          if (story.themes) {
            story.themes.forEach(theme => themes.add(theme));
          } else if (story.theme) {
            themes.add(story.theme);
          }
        });
        
        return Math.min(themes.size, goal.target);
      }
      
      default:
        return 0;
    }
  };

  const createGoal = () => {
    if (!childProfile?.id) return;
    
    const goal = {
      id: crypto.randomUUID(),
      ...newGoal,
      createdAt: new Date().toISOString(),
      progress: 0,
      completed: false
    };
    
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem(`readingGoals_${childProfile.id}`, JSON.stringify(updatedGoals));
    
    setShowCreateGoal(false);
    setNewGoal({
      type: 'stories',
      target: 5,
      period: 'week',
      title: ''
    });
  };

  const deleteGoal = (goalId) => {
    if (!childProfile?.id) return;
    
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem(`readingGoals_${childProfile.id}`, JSON.stringify(updatedGoals));
  };

  const markGoalComplete = (goal) => {
    if (!childProfile?.id) return;
    
    const updatedGoals = goals.map(g => 
      g.id === goal.id ? { ...g, completed: true, completedAt: new Date().toISOString() } : g
    );
    setGoals(updatedGoals);
    localStorage.setItem(`readingGoals_${childProfile.id}`, JSON.stringify(updatedGoals));
    
    // Award bonus stars for completing goals
    const stars = localStorage.getItem(`stars_${childProfile.id}`);
    const currentStars = parseInt(stars || '0');
    const bonusStars = goal.period === 'day' ? 5 : goal.period === 'week' ? 15 : 25;
    localStorage.setItem(`stars_${childProfile.id}`, (currentStars + bonusStars).toString());
    
    if (onGoalComplete) {
      onGoalComplete(goal, bonusStars);
    }
  };

  const getProgressPercentage = (goal) => {
    const progress = calculateProgress(goal);
    return Math.min(100, (progress / goal.target) * 100);
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'once': return 'One-time';
      default: return period;
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'stories': return '📚';
      case 'streak': return '🔥';
      case 'minutes': return '⏱️';
      case 'achievements': return '🏆';
      case 'themes': return '🎨';
      default: return '🎯';
    }
  };

  if (!childProfile) {
    return (
      <div className="reading-goals-container">
        <div className="no-profile">
          <p>Select a child profile to set reading goals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-goals-container">
      <div className="goals-header">
        <h3>Reading Goals for {childProfile.name}</h3>
        <button 
          className="add-goal-btn"
          onClick={() => setShowCreateGoal(true)}
        >
          + Add Goal
        </button>
      </div>

      {/* Active Goals */}
      <div className="goals-list">
        {goals.filter(g => !g.completed).map(goal => {
          const progress = calculateProgress(goal);
          const percentage = getProgressPercentage(goal);
          const isComplete = progress >= goal.target;
          
          return (
            <div key={goal.id} className={`goal-card ${isComplete ? 'complete' : ''}`}>
              <div className="goal-header">
                <span className="goal-icon">{getGoalIcon(goal.type)}</span>
                <div className="goal-info">
                  <h4>{goal.title || `${goal.type} goal`}</h4>
                  <span className="goal-period">{getPeriodLabel(goal.period)}</span>
                </div>
                <button 
                  className="goal-delete"
                  onClick={() => deleteGoal(goal.id)}
                  title="Delete goal"
                >
                  ×
                </button>
              </div>
              
              <div className="goal-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="progress-text">
                  {progress} / {goal.target}
                  {goal.type === 'stories' && ' stories'}
                  {goal.type === 'minutes' && ' minutes'}
                  {goal.type === 'streak' && ' days'}
                  {goal.type === 'achievements' && ' achievements'}
                  {goal.type === 'themes' && ' themes'}
                </div>
              </div>
              
              {isComplete && !goal.completed && (
                <button 
                  className="complete-goal-btn"
                  onClick={() => markGoalComplete(goal)}
                >
                  🎉 Claim Reward ({goal.period === 'day' ? 5 : goal.period === 'week' ? 15 : 25} ⭐)
                </button>
              )}
            </div>
          );
        })}
        
        {goals.filter(g => !g.completed).length === 0 && (
          <div className="no-goals">
            <p>No active goals. Create one to start tracking progress!</p>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {goals.filter(g => g.completed).length > 0 && (
        <div className="completed-goals">
          <h4>Completed Goals</h4>
          <div className="completed-list">
            {goals.filter(g => g.completed).map(goal => (
              <div key={goal.id} className="completed-goal">
                <span className="goal-icon">{getGoalIcon(goal.type)}</span>
                <span className="goal-title">{goal.title}</span>
                <span className="completed-badge">✓ Complete</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="goal-modal">
          <div className="goal-modal-content">
            <button 
              className="modal-close"
              onClick={() => setShowCreateGoal(false)}
            >
              ×
            </button>
            
            <h3>Create New Reading Goal</h3>
            
            <div className="goal-templates">
              <p>Choose a template or create custom:</p>
              {goalTemplates.map((template, index) => (
                <button
                  key={index}
                  className="template-btn"
                  onClick={() => setNewGoal(template)}
                >
                  {getGoalIcon(template.type)} {template.title}
                </button>
              ))}
            </div>
            
            <div className="goal-form">
              <div className="form-group">
                <label>Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Read every day this week"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                  >
                    <option value="stories">Stories</option>
                    <option value="streak">Streak Days</option>
                    <option value="minutes">Reading Minutes</option>
                    <option value="achievements">Achievements</option>
                    <option value="themes">Different Themes</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Target</label>
                  <input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Period</label>
                  <select
                    value={newGoal.period}
                    onChange={(e) => setNewGoal({...newGoal, period: e.target.value})}
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="once">One-time</option>
                  </select>
                </div>
              </div>
              
              <button className="create-btn" onClick={createGoal}>
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingGoals;