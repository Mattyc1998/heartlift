-- Fix Critical Security Issues - Update existing policies

-- 1. Update subscribers table RLS policies to use only user_id for security
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;  
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription by user_id" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription by user_id" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription by user_id" ON public.subscribers;

-- Create secure RLS policies using ONLY user_id (removes email exposure vulnerability)
CREATE POLICY "Users can view own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Secure all database functions with proper search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid uuid, input_coach_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_usage INTEGER;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  SELECT COALESCE(SUM(u.message_count), 0)
  INTO current_usage
  FROM public.user_usage u
  WHERE u.user_id = user_uuid 
    AND u.last_message_at > twenty_four_hours_ago;
  
  IF current_usage >= 10 THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.user_usage (user_id, date, coach_id, message_count, last_message_at)
  VALUES (user_uuid, CURRENT_DATE, input_coach_id, 1, NOW())
  ON CONFLICT (user_id, date, COALESCE(coach_id, ''))
  DO UPDATE SET 
    message_count = public.user_usage.message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_premium_feature_usage(user_uuid uuid, feature_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.premium_features_usage (user_id, feature_name, usage_count, last_used)
  VALUES (user_uuid, feature_name, 1, NOW())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET 
    usage_count = public.premium_features_usage.usage_count + 1,
    last_used = NOW(),
    updated_at = NOW();
    
  UPDATE public.subscribers 
  SET last_used_premium_feature = NOW(),
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$function$;