-- Migration: MongoDB to Supabase
-- Run this SQL in Supabase SQL Editor

-- 1. Daily Reflections Table
CREATE TABLE IF NOT EXISTS daily_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    grateful_for TEXT,
    proud_of TEXT,
    helpful_moment TEXT,
    coaches_chatted_with TEXT[], -- Array of coach names
    conversation_rating INTEGER,
    helpful_moments TEXT,
    areas_for_improvement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reflection_date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON daily_reflections(user_id, reflection_date DESC);

-- 2. Usage Tracking Table (for coach chat analytics)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'coach_chat', etc.
    coach_id TEXT,
    user_id UUID NOT NULL,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    message_length INTEGER,
    response_length INTEGER,
    success BOOLEAN DEFAULT true,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_timestamp ON usage_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_type ON usage_tracking(type);

-- 3. Insights Reports Table
CREATE TABLE IF NOT EXISTS insights_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL DEFAULT 'personalized_insights',
    period_start DATE,
    period_end DATE,
    insights JSONB NOT NULL, -- Stores the entire insights object
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user insights
CREATE INDEX IF NOT EXISTS idx_insights_reports_user ON insights_reports(user_id, created_at DESC);

-- 4. Daily Usage Table (for message limits)
CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for usage checks
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own reflections" ON daily_reflections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections" ON daily_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" ON daily_reflections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON insights_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON daily_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for usage_tracking (service role only)
CREATE POLICY "Service role can manage usage_tracking" ON usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON daily_reflections TO authenticated;
GRANT SELECT ON insights_reports TO authenticated;
GRANT SELECT ON daily_usage TO authenticated;

-- Grant full access to service role
GRANT ALL ON daily_reflections TO service_role;
GRANT ALL ON usage_tracking TO service_role;
GRANT ALL ON insights_reports TO service_role;
GRANT ALL ON daily_usage TO service_role;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_reflections_updated_at BEFORE UPDATE ON daily_reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_usage_updated_at BEFORE UPDATE ON daily_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
