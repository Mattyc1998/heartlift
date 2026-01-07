-- ============================================
-- HEALING DAY RESPONSES TABLE
-- ============================================
-- 
-- RUN THIS IN SUPABASE SQL EDITOR
-- This creates a table to store user's responses to healing kit prompts and challenges
-- ============================================

-- Create the healing_day_responses table
CREATE TABLE IF NOT EXISTS public.healing_day_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  prompt_response text DEFAULT '',
  challenge_response text DEFAULT '',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, day_number)
);

-- Enable Row Level Security
ALTER TABLE public.healing_day_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own responses"
  ON public.healing_day_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.healing_day_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.healing_day_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.healing_day_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_healing_day_responses_user_day 
  ON public.healing_day_responses(user_id, day_number);

-- Grant access to authenticated users
GRANT ALL ON public.healing_day_responses TO authenticated;
