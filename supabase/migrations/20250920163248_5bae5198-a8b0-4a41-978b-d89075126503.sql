-- Create daily reflections table to store user reflections and enable coach memory
CREATE TABLE public.daily_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coaches_chatted_with TEXT[] NOT NULL DEFAULT '{}',
  conversation_rating INTEGER CHECK (conversation_rating >= 1 AND conversation_rating <= 5),
  helpful_moments TEXT,
  areas_for_improvement TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one reflection per user per day
  UNIQUE(user_id, reflection_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own daily reflections" 
ON public.daily_reflections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily reflections" 
ON public.daily_reflections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily reflections" 
ON public.daily_reflections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_reflections_updated_at
BEFORE UPDATE ON public.daily_reflections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();