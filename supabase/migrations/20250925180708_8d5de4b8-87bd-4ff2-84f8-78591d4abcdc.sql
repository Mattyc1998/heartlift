-- Check and fix RLS policies for daily_quiz_questions
-- First, let's see what policies exist and drop them all, then recreate properly

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on daily_quiz_questions
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'daily_quiz_questions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.daily_quiz_questions';
    END LOOP;
END $$;

-- Now create the correct policies

-- 1. Service role (used by edge functions) gets full access
CREATE POLICY "Service role full access to quiz questions"
ON public.daily_quiz_questions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view current date questions
CREATE POLICY "Authenticated users view current date questions"
ON public.daily_quiz_questions
FOR SELECT
TO authenticated
USING (quiz_date = CURRENT_DATE);

-- 3. Anonymous users can view current date questions (for public access)
CREATE POLICY "Anonymous users view current date questions"
ON public.daily_quiz_questions
FOR SELECT
TO anon
USING (quiz_date = CURRENT_DATE);