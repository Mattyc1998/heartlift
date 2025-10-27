
-- Create quiz_results table for HeartLift
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_style TEXT NOT NULL,
  analysis JSONB NOT NULL,
  questions_and_answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can view their own quiz results" ON quiz_results;

-- Create RLS policies
CREATE POLICY "Users can insert their own quiz results"
ON quiz_results FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz results"
ON quiz_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_completed_at_idx ON quiz_results(completed_at DESC);
