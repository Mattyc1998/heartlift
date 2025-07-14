-- Create conversation history table
CREATE TABLE public.conversation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  coach_id text NOT NULL,
  message_content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'coach')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conversation history"
ON public.conversation_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation history"
ON public.conversation_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_conversation_history_user_coach ON public.conversation_history(user_id, coach_id, created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_history_updated_at
  BEFORE UPDATE ON public.conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();