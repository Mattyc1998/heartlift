-- Create table for storing user attachment style results
CREATE TABLE public.user_attachment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attachment_style TEXT NOT NULL,
  quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
  detailed_breakdown JSONB,
  healing_path TEXT,
  triggers JSONB,
  coping_techniques JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_attachment_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own attachment results" 
ON public.user_attachment_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachment results" 
ON public.user_attachment_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachment results" 
ON public.user_attachment_results 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for conversation analyses
CREATE TABLE public.conversation_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_text TEXT NOT NULL,
  emotional_tone JSONB,
  miscommunication_patterns JSONB,
  suggestions JSONB,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversation analyses" 
ON public.conversation_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation analyses" 
ON public.conversation_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_user_attachment_results_updated_at
BEFORE UPDATE ON public.user_attachment_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();