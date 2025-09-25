-- Fix RLS policies for daily_quiz_questions to allow service_role access
-- The edge function needs to be able to insert and query questions

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only system can manage quiz questions" ON public.daily_quiz_questions;
DROP POLICY IF EXISTS "Anonymous users can view only current date quiz questions" ON public.daily_quiz_questions;
DROP POLICY IF EXISTS "Users can view only current date quiz questions" ON public.daily_quiz_questions;

-- Create proper policies that allow service_role full access and users limited access

-- Allow service_role (used by edge functions) full access to manage quiz questions
CREATE POLICY "Service role can manage quiz questions"
ON public.daily_quiz_questions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view only current date questions
CREATE POLICY "Authenticated users can view current date questions"
ON public.daily_quiz_questions
FOR SELECT
TO authenticated
USING (quiz_date = CURRENT_DATE);

-- Allow anonymous users to view only current date questions (for public quiz access)
CREATE POLICY "Anonymous users can view current date questions"
ON public.daily_quiz_questions
FOR SELECT
TO anon
USING (quiz_date = CURRENT_DATE);