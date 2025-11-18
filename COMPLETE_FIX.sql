-- ============================================
-- COMPLETE FIX FOR HEARTLIFT APP
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Click RUN once
-- ============================================

-- ============================================
-- 1. FIX QUIZ_RESULTS TABLE
-- ============================================
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can update own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Service role full access on quiz" ON quiz_results;

CREATE POLICY "Users can view own quiz results" 
ON quiz_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" 
ON quiz_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz results" 
ON quiz_results FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on quiz" 
ON quiz_results FOR ALL 
USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON quiz_results TO authenticated;
GRANT ALL ON quiz_results TO service_role;

-- ============================================
-- 2. FIX CONVERSATION_HISTORY TABLE
-- ============================================
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Service role full access on conversations" ON conversation_history;

CREATE POLICY "Users can view own conversations" 
ON conversation_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
ON conversation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on conversations" 
ON conversation_history FOR ALL 
USING (auth.role() = 'service_role');

GRANT SELECT, INSERT ON conversation_history TO authenticated;
GRANT ALL ON conversation_history TO service_role;

-- ============================================
-- 3. FIX DAILY_REFLECTIONS TABLE
-- ============================================
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON daily_reflections;
DROP POLICY IF EXISTS "Service role full access on reflections" ON daily_reflections;

CREATE POLICY "Users can view own reflections" 
ON daily_reflections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections" 
ON daily_reflections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" 
ON daily_reflections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on reflections" 
ON daily_reflections FOR ALL 
USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON daily_reflections TO authenticated;
GRANT ALL ON daily_reflections TO service_role;

-- ============================================
-- 4. FIX insert_conversation_message RPC
-- ============================================
CREATE OR REPLACE FUNCTION insert_conversation_message(
    p_user_id UUID,
    p_coach_id TEXT,
    p_message_content TEXT,
    p_sender TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO conversation_history (user_id, coach_id, message_content, sender, created_at, updated_at)
    VALUES (p_user_id, p_coach_id, p_message_content, p_sender, NOW(), NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION insert_conversation_message TO authenticated;
GRANT EXECUTE ON FUNCTION insert_conversation_message TO anon;

-- ============================================
-- DONE - YOUR APP SHOULD NOW WORK
-- ============================================
-- ✅ Quiz results will save
-- ✅ You can view past quiz results
-- ✅ Daily reflections will save
-- ✅ Coach conversations will work
-- ============================================
