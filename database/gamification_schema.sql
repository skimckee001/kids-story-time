-- Gamification Database Schema for Kids Story Time
-- This schema should be created in your Supabase database

-- ============================================
-- User Gamification Data Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Stats
  stars INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Streaks
  daily_streak INTEGER DEFAULT 0,
  weekly_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Statistics
  stories_created INTEGER DEFAULT 0,
  stories_completed INTEGER DEFAULT 0,
  words_read INTEGER DEFAULT 0,
  minutes_reading INTEGER DEFAULT 0,
  perfect_days INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- User Badges Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100),
  badge_description TEXT,
  badge_icon VARCHAR(10),
  xp_reward INTEGER DEFAULT 0,
  star_reward INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- User Achievements Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100),
  achievement_description TEXT,
  reading_level VARCHAR(20),
  progress INTEGER DEFAULT 0,
  requirement INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- Daily Activity Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(50) NOT NULL, -- story_created, story_completed, game_played, etc.
  activity_data JSONB, -- Flexible data storage for activity details
  
  stars_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_activity_user_date (user_id, timestamp),
  INDEX idx_activity_child_date (child_id, timestamp),
  INDEX idx_activity_type (activity_type)
);

-- ============================================
-- Story Game Results Table
-- ============================================
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  
  game_type VARCHAR(50) NOT NULL, -- star_tapping, sight_word_hunt, rhyming_game, etc.
  reading_level VARCHAR(20),
  
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  stars_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  
  game_data JSONB, -- Flexible storage for game-specific data
  
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_game_user (user_id),
  INDEX idx_game_child (child_id),
  INDEX idx_game_story (story_id)
);

-- ============================================
-- Leaderboard Table (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name VARCHAR(100),
  
  period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, all_time
  metric VARCHAR(50) NOT NULL, -- total_xp, total_stars, stories_read, etc.
  value INTEGER DEFAULT 0,
  rank INTEGER,
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period, metric),
  INDEX idx_leaderboard_period_metric (period, metric, value DESC)
);

-- ============================================
-- Rewards History Table
-- ============================================
CREATE TABLE IF NOT EXISTS rewards_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reward_type VARCHAR(50) NOT NULL, -- stars, xp, badge, achievement, level_up
  reward_amount INTEGER,
  reward_reason VARCHAR(100),
  reward_data JSONB,
  
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_rewards_user_date (user_id, granted_at DESC)
);

-- ============================================
-- Child Reading Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  goal_type VARCHAR(50) NOT NULL, -- daily_minutes, weekly_stories, monthly_words, etc.
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(child_id, goal_type, start_date)
);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple level calculation: level = floor(sqrt(xp / 50))
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.xp::FLOAT / 50)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update level when XP changes
CREATE TRIGGER trigger_update_level
  BEFORE UPDATE OF xp ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_activity DATE;
  days_diff INTEGER;
BEGIN
  -- Get the last activity date
  SELECT last_activity_date INTO last_activity FROM user_gamification WHERE user_id = NEW.user_id;
  
  IF last_activity IS NULL THEN
    -- First activity
    UPDATE user_gamification 
    SET daily_streak = 1, last_activity_date = CURRENT_DATE 
    WHERE user_id = NEW.user_id;
  ELSE
    days_diff := CURRENT_DATE - last_activity;
    
    IF days_diff = 0 THEN
      -- Same day activity, no change
      NULL;
    ELSIF days_diff = 1 THEN
      -- Consecutive day, increment streak
      UPDATE user_gamification 
      SET daily_streak = daily_streak + 1, 
          last_activity_date = CURRENT_DATE,
          longest_streak = GREATEST(longest_streak, daily_streak + 1)
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE user_gamification 
      SET daily_streak = 1, last_activity_date = CURRENT_DATE 
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak on activity
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_streak();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

-- Policies for user_gamification
CREATE POLICY "Users can view own gamification data" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification data" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_badges
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for activity_log
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for game_results
CREATE POLICY "Users can view own game results" ON game_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game results" ON game_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for rewards_history
CREATE POLICY "Users can view own rewards" ON rewards_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON rewards_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for reading_goals (parent can set for their children)
CREATE POLICY "Parents can manage child reading goals" ON reading_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = reading_goals.child_id 
      AND children.parent_id = auth.uid()
    )
  );

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_gamification_user ON user_gamification(user_id);
CREATE INDEX idx_badges_user ON user_badges(user_id);
CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_game_results_date ON game_results(played_at DESC);
CREATE INDEX idx_rewards_date ON rewards_history(granted_at DESC);

-- ============================================
-- Initial Data Setup Function
-- ============================================

CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial gamification record for new user
  INSERT INTO user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize gamification for new users
CREATE TRIGGER trigger_init_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_gamification();