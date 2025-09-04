-- Migration: Add user_usage table for tracking subscription tier limits
-- This tracks monthly usage for stories, AI illustrations, and narrations

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  stories_used INTEGER DEFAULT 0 CHECK (stories_used >= 0),
  ai_illustrations_used INTEGER DEFAULT 0 CHECK (ai_illustrations_used >= 0),
  narrations_used INTEGER DEFAULT 0 CHECK (narrations_used >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month_year ON user_usage(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_user_usage_created_at ON user_usage(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own usage data
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage data
CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own usage data
CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_updated_at();

-- Function to get or create current month usage record
CREATE OR REPLACE FUNCTION get_or_create_usage(
  p_user_id UUID,
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS user_usage AS $$
DECLARE
  usage_record user_usage;
BEGIN
  -- Try to get existing record
  SELECT * INTO usage_record
  FROM user_usage
  WHERE user_id = p_user_id AND month = p_month AND year = p_year;
  
  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, month, year, stories_used, ai_illustrations_used, narrations_used)
    VALUES (p_user_id, p_month, p_year, 0, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  -- Validate usage type
  IF p_usage_type NOT IN ('stories_used', 'ai_illustrations_used', 'narrations_used') THEN
    RAISE EXCEPTION 'Invalid usage type: %', p_usage_type;
  END IF;
  
  -- Validate amount
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Amount must be non-negative: %', p_amount;
  END IF;
  
  -- Insert or update usage record
  INSERT INTO user_usage (user_id, month, year, stories_used, ai_illustrations_used, narrations_used)
  VALUES (
    p_user_id, 
    current_month, 
    current_year,
    CASE WHEN p_usage_type = 'stories_used' THEN p_amount ELSE 0 END,
    CASE WHEN p_usage_type = 'ai_illustrations_used' THEN p_amount ELSE 0 END,
    CASE WHEN p_usage_type = 'narrations_used' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month, year) 
  DO UPDATE SET
    stories_used = CASE 
      WHEN p_usage_type = 'stories_used' THEN user_usage.stories_used + p_amount
      ELSE user_usage.stories_used
    END,
    ai_illustrations_used = CASE 
      WHEN p_usage_type = 'ai_illustrations_used' THEN user_usage.ai_illustrations_used + p_amount
      ELSE user_usage.ai_illustrations_used
    END,
    narrations_used = CASE 
      WHEN p_usage_type = 'narrations_used' THEN user_usage.narrations_used + p_amount
      ELSE user_usage.narrations_used
    END,
    updated_at = NOW();
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error incrementing usage: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (for scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- This could be called by a scheduled job on the 1st of each month
  -- For now, we'll just archive old data and don't actually reset
  -- (Better to keep historical data for analytics)
  
  -- Count how many active usage records we have
  SELECT COUNT(*) INTO affected_rows
  FROM user_usage
  WHERE month = EXTRACT(MONTH FROM NOW()) 
    AND year = EXTRACT(YEAR FROM NOW());
    
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some helpful comments
COMMENT ON TABLE user_usage IS 'Tracks monthly usage for subscription tier enforcement';
COMMENT ON COLUMN user_usage.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN user_usage.month IS 'Month (1-12) for usage tracking';
COMMENT ON COLUMN user_usage.year IS 'Year for usage tracking';
COMMENT ON COLUMN user_usage.stories_used IS 'Number of stories generated this month';
COMMENT ON COLUMN user_usage.ai_illustrations_used IS 'Number of AI illustrations generated this month';
COMMENT ON COLUMN user_usage.narrations_used IS 'Number of voice narrations used this month';

-- Insert initial data for testing (remove in production)
-- This creates a usage record for the current month with some test data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Only insert test data if we're in development
    IF current_setting('app.environment', true) = 'development' THEN
      INSERT INTO user_usage (user_id, month, year, stories_used, ai_illustrations_used, narrations_used)
      SELECT 
        id as user_id,
        EXTRACT(MONTH FROM NOW()) as month,
        EXTRACT(YEAR FROM NOW()) as year,
        0 as stories_used,
        0 as ai_illustrations_used,
        0 as narrations_used
      FROM profiles
      WHERE NOT EXISTS (
        SELECT 1 FROM user_usage 
        WHERE user_usage.user_id = profiles.id 
          AND month = EXTRACT(MONTH FROM NOW())
          AND year = EXTRACT(YEAR FROM NOW())
      )
      LIMIT 5; -- Only add for first 5 users in development
    END IF;
  END IF;
END $$;
