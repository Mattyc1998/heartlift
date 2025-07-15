-- Fix the subscribers table constraint issue
-- First, let's make sure email is unique
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique ON public.subscribers (email);

-- Also add a unique constraint on user_id
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_user_id_unique ON public.subscribers (user_id);

-- Update the healing_kit_purchases table to have proper constraints
ALTER TABLE public.healing_kit_purchases 
ADD CONSTRAINT healing_kit_purchases_user_id_unique UNIQUE (user_id);

-- Ensure user_healing_progress has proper constraint
ALTER TABLE public.user_healing_progress 
ADD CONSTRAINT user_healing_progress_user_id_unique UNIQUE (user_id);