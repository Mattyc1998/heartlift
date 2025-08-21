-- Create a table to store personalized insights reports
CREATE TABLE public.user_insights_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'conversation_analysis',
  insights JSONB NOT NULL DEFAULT '{}',
  conversation_count INTEGER DEFAULT 0,
  mood_entries_analyzed INTEGER DEFAULT 0,
  attachment_style TEXT,
  healing_progress_score INTEGER DEFAULT 0,
  key_patterns JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_insights_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own insights reports" 
ON public.user_insights_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights reports" 
ON public.user_insights_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights reports" 
ON public.user_insights_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_insights_reports_updated_at
BEFORE UPDATE ON public.user_insights_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();