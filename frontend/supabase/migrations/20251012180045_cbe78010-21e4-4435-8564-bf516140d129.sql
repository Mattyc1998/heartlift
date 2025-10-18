-- Create table for storing user heart visions
CREATE TABLE public.heart_visions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.heart_visions ENABLE ROW LEVEL SECURITY;

-- Users can view their own heart visions
CREATE POLICY "Users can view their own heart visions"
ON public.heart_visions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own heart visions
CREATE POLICY "Users can insert their own heart visions"
ON public.heart_visions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own heart visions
CREATE POLICY "Users can delete their own heart visions"
ON public.heart_visions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_heart_visions_user_id ON public.heart_visions(user_id);
CREATE INDEX idx_heart_visions_created_at ON public.heart_visions(created_at DESC);