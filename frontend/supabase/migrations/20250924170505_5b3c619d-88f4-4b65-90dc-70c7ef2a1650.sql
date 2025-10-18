-- SECURITY FIX: Restrict daily quiz questions access to current date only
-- This addresses the PUBLIC_QUIZ_DATA vulnerability

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Anyone can view daily quiz questions" ON public.daily_quiz_questions;

-- Create secure policy that only allows viewing current date questions
-- This prevents users from seeing future questions or accessing historical quiz data
CREATE POLICY "Users can view only current date quiz questions"
ON public.daily_quiz_questions 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND quiz_date = CURRENT_DATE
);

-- Also create a policy for anonymous users (if needed for public access to today's quiz)
-- But restrict to current date only to prevent data mining
CREATE POLICY "Anonymous users can view only current date quiz questions"
ON public.daily_quiz_questions 
FOR SELECT 
TO anon 
USING (
  quiz_date = CURRENT_DATE
);

-- Ensure no INSERT/UPDATE/DELETE access for regular users
-- Only the system should be able to manage quiz questions via edge functions
CREATE POLICY "Only system can manage quiz questions"
ON public.daily_quiz_questions 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);