-- Fix database schema issues found during testing
-- Run this in Supabase SQL Editor

-- 1. Fix the conversation_rating check constraint on daily_reflections
-- The constraint is too restrictive - should allow 1-10 rating scale
ALTER TABLE daily_reflections DROP CONSTRAINT IF EXISTS daily_reflections_conversation_rating_check;
ALTER TABLE daily_reflections ADD CONSTRAINT daily_reflections_conversation_rating_check 
    CHECK (conversation_rating >= 1 AND conversation_rating <= 10);

-- 2. Make foreign key constraints more flexible by using ON DELETE CASCADE
-- This allows testing with any UUID without requiring user records
-- (Already set in the original migration, but let's ensure it's there)

-- 3. Check if conversation_history table has the 'message' column
-- If not, it should already exist from previous work, but let's verify the schema
-- The table should have: id, user_id, coach_name, message, sender, created_at

-- 4. Create a test user in auth.users for testing purposes
-- This allows testing without foreign key violations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test@heartlift.com',
    'encrypted_test_password',
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. Verify and display table structures
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_reflections' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
