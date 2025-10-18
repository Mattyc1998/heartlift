-- Create table for daily AI-generated quiz questions
CREATE TABLE public.daily_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_date DATE NOT NULL UNIQUE,
  questions JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing quiz questions (all authenticated users can view)
CREATE POLICY "Anyone can view daily quiz questions" 
ON public.daily_quiz_questions 
FOR SELECT 
USING (true);

-- Add index for efficient date queries
CREATE INDEX idx_daily_quiz_questions_date ON public.daily_quiz_questions(quiz_date);