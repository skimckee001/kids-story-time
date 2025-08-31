import { useState, useEffect } from 'react';
import './ReadingStreak.css';

function ReadingStreak({ childProfile }) {
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    lastReadDate: null,
    weeklyProgress: [false, false, false, false, false, false, false],
    monthlyCalendar: []
  });

  useEffect(() => {
    if (childProfile) {
      loadStreakData();
    }
  }, [childProfile]);

  const loadStreakData = () => {
    if (!childProfile) return;

    const streakKey = `streak_${childProfile.id}`;
    const savedStreak = localStorage.getItem(streakKey);
    
    if (savedStreak) {
      const data = JSON.parse(savedStreak);
      setStreakData(data);
      
      // Check if streak needs to be reset (missed a day)
      if (data.lastReadDate) {
        const lastRead = new Date(data.lastReadDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastRead.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          // Streak broken - reset current but keep longest
          const updatedData = {
            ...data,
            current: 0,
            weeklyProgress: [false, false, false, false, false, false, false]
          };
          setStreakData(updatedData);
          localStorage.setItem(streakKey, JSON.stringify(updatedData));
        }
      }
    } else {
      // Initialize streak data
      const initialData = {
        current: 0,
        longest: 0,
        lastReadDate: null,
        weeklyProgress: [false, false, false, false, false, false, false],
        monthlyCalendar: generateMonthlyCalendar()
      };
      setStreakData(initialData);
      localStorage.setItem(streakKey, JSON.stringify(initialData));
    }
  };

  const generateMonthlyCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push({
        day: i,
        hasRead: false,
        isToday: i === today.getDate()
      });
    }
    
    return calendar;
  };

  const updateStreak = () => {
    if (!childProfile) return;

    const streakKey = `streak_${childProfile.id}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedData = { ...streakData };
    
    // Check if already read today
    if (updatedData.lastReadDate) {
      const lastRead = new Date(updatedData.lastReadDate);
      lastRead.setHours(0, 0, 0, 0);
      
      if (lastRead.getTime() === today.getTime()) {
        // Already read today
        return;
      }
      
      const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        updatedData.current += 1;
      } else {
        // Streak broken - start new
        updatedData.current = 1;
      }
    } else {
      // First time reading
      updatedData.current = 1;
    }
    
    // Update longest streak
    if (updatedData.current > updatedData.longest) {
      updatedData.longest = updatedData.current;
    }
    
    // Update last read date
    updatedData.lastReadDate = today.toISOString();
    
    // Update weekly progress
    const dayOfWeek = today.getDay();
    updatedData.weeklyProgress[dayOfWeek] = true;
    
    // Update monthly calendar
    const dayOfMonth = today.getDate();
    updatedData.monthlyCalendar = updatedData.monthlyCalendar.map(day => 
      day.day === dayOfMonth ? { ...day, hasRead: true } : day
    );
    
    setStreakData(updatedData);
    localStorage.setItem(streakKey, JSON.stringify(updatedData));
    
    // Check for streak achievements
    checkStreakAchievements(updatedData.current);
  };

  const checkStreakAchievements = (currentStreak) => {
    // This will be called by the achievement system
    const milestones = [3, 7, 14, 30, 60, 100];
    if (milestones.includes(currentStreak)) {
      console.log(`Streak milestone reached: ${currentStreak} days!`);
      // The achievement system will handle the actual achievement unlocking
    }
  };

  const getStreakEmoji = (streak) => {
    if (streak === 0) return '😴';
    if (streak < 3) return '📖';
    if (streak < 7) return '🔥';
    if (streak < 14) return '⚡';
    if (streak < 30) return '🌟';
    if (streak < 60) return '💎';
    return '👑';
  };

  const getMotivationalMessage = (streak) => {
    if (streak === 0) return "Start your reading journey today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 3) return "Building momentum!";
    if (streak < 7) return "You're on fire! One week within reach!";
    if (streak < 14) return "Amazing! Two weeks is your next milestone!";
    if (streak < 30) return "Incredible dedication! One month is in sight!";
    if (streak < 60) return "You're a reading champion!";
    return "Legendary reader! You're inspiring!";
  };

  const getDayName = (index) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  const getMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  };

  // Expose updateStreak method for parent components
  useEffect(() => {
    if (childProfile) {
      window.updateReadingStreak = updateStreak;
    }
    return () => {
      delete window.updateReadingStreak;
    };
  }, [childProfile, streakData]);

  if (!childProfile) {
    return null; // Don't show anything if no profile is selected
  }

  const getNextMilestone = () => {
    const milestones = [3, 7, 14, 30, 60, 100];
    for (const milestone of milestones) {
      if (streakData.current < milestone) {
        return milestone;
      }
    }
    return null;
  };

  const nextMilestone = getNextMilestone();
  const daysToNextMilestone = nextMilestone ? nextMilestone - streakData.current : 0;

  return (
    <div className="reading-streak-compact">
      <div className="streak-summary">
        <div className="streak-item current">
          <span className="streak-emoji">{getStreakEmoji(streakData.current)}</span>
          <div className="streak-details">
            <span className="streak-value">{streakData.current} {streakData.current === 1 ? 'day' : 'days'}</span>
            <span className="streak-label">Current Streak</span>
          </div>
        </div>
        
        <div className="streak-item">
          <span className="streak-icon">🏆</span>
          <div className="streak-details">
            <span className="streak-value">{streakData.longest} {streakData.longest === 1 ? 'day' : 'days'}</span>
            <span className="streak-label">Best Streak</span>
          </div>
        </div>
        
        <div className="streak-item">
          <span className="streak-icon">📅</span>
          <div className="streak-details">
            <span className="streak-value">
              {streakData.weeklyProgress.filter(d => d).length}/7 days
            </span>
            <span className="streak-label">This Week</span>
          </div>
        </div>
        
        {nextMilestone && (
          <div className="streak-item milestone">
            <span className="streak-icon">🎯</span>
            <div className="streak-details">
              <span className="streak-value">{daysToNextMilestone} {daysToNextMilestone === 1 ? 'day' : 'days'} to achieve:</span>
              <span className="streak-label">{nextMilestone}-day milestone</span>
            </div>
          </div>
        )}
      </div>
      
      {streakData.current > 0 && (
        <div className="streak-message">
          {getMotivationalMessage(streakData.current)}
        </div>
      )}
    </div>
  );
}

export default ReadingStreak;