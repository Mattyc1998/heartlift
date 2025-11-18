-- Fix RLS policies for frontend access
-- The frontend uses authenticated user tokens, needs access to own data

-- ============================================
-- 1. CONVERSATION_HISTORY TABLE
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Service role full access" ON conversation_history;

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view own conversations" 
ON conversation_history
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" 
ON conversation_history
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access (for backend)
CREATE POLICY "Service role full access on conversations" 
ON conversation_history
FOR ALL 
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON conversation_history TO authenticated;
GRANT ALL ON conversation_history TO service_role;

-- ============================================
-- 2. DAILY_REFLECTIONS TABLE
-- ============================================

-- RLS should already be enabled from migration, but ensure it
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies with correct names
DROP POLICY IF EXISTS "Users can view own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Service role full access on reflections" ON daily_reflections;

-- Policy: Users can view their own reflections
CREATE POLICY "Users can view own reflections" 
ON daily_reflections
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own reflections
CREATE POLICY "Users can insert own reflections" 
ON daily_reflections
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reflections
CREATE POLICY "Users can update own reflections" 
ON daily_reflections
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Service role has full access (for backend API)
CREATE POLICY "Service role full access on reflections" 
ON daily_reflections
FOR ALL 
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON daily_reflections TO authenticated;
GRANT ALL ON daily_reflections TO service_role;

-- ============================================
-- 3. VERIFY insert_conversation_message RPC
-- ============================================

-- Recreate the RPC function to ensure it exists and works correctly
CREATE OR REPLACE FUNCTION insert_conversation_message(
    p_user_id UUID,
    p_coach_id TEXT,
    p_message_content TEXT,
    p_sender TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run as function owner (bypasses RLS)
AS $$
BEGIN
    INSERT INTO conversation_history (user_id, coach_id, message_content, sender, created_at, updated_at)
    VALUES (p_user_id, p_coach_id, p_message_content, p_sender, NOW(), NOW());
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_conversation_message TO authenticated;
GRANT EXECUTE ON FUNCTION insert_conversation_message TO anon;

-- ============================================
-- 4. INSIGHTS_REPORTS & DAILY_USAGE
-- ============================================

-- Ensure these also have proper RLS for frontend access

-- Insights Reports
DROP POLICY IF EXISTS "Service role full access on insights" ON insights_reports;
CREATE POLICY "Service role full access on insights" 
ON insights_reports
FOR ALL 
USING (auth.role() = 'service_role');

-- Daily Usage
DROP POLICY IF EXISTS "Service role full access on daily_usage" ON daily_usage;
CREATE POLICY "Service role full access on daily_usage" 
ON daily_usage
FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================
-- SUMMARY
-- ============================================
-- After running this script:
-- ✅ Authenticated users can read/write their own conversation_history
-- ✅ Authenticated users can read/write/update their own daily_reflections
-- ✅ insert_conversation_message RPC works for all authenticated users
-- ✅ Backend (service_role) has full access to all tables
-- ✅ Frontend can save reflections and chat with coaches
