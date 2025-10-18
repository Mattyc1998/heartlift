-- Fix Critical Security Issues

-- 1. Fix subscribers table RLS policy to prevent data exposure
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Create secure RLS policies using user_id only (not email)
CREATE POLICY "Users can view their own subscription by user_id" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription by user_id" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription by user_id" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Secure all database functions with proper search_path
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
  -- Check current usage across ALL coaches in last 24 hours
  SELECT COALESCE(SUM(u.message_count), 0)
  INTO current_usage
  FROM public.user_usage u
  WHERE u.user_id = user_uuid 
    AND u.last_message_at > twenty_four_hours_ago;
  
  -- If at limit (10 messages total), don't increment
  IF current_usage >= 10 THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update usage record for this coach
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
    
  -- Update last used premium feature in subscribers table
  UPDATE public.subscribers 
  SET last_used_premium_feature = NOW(),
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_premium_access(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_subscription RECORD;
BEGIN
  SELECT subscribed, plan_type, payment_status
  INTO user_subscription
  FROM public.subscribers
  WHERE user_id = user_uuid;
  
  -- Return true if user has active premium subscription
  RETURN COALESCE(user_subscription.subscribed, false) = true 
    AND COALESCE(user_subscription.plan_type, 'free') = 'premium'
    AND COALESCE(user_subscription.payment_status, 'inactive') = 'active';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_daily_usage(user_uuid uuid, coach_id text DEFAULT NULL::text)
RETURNS TABLE(message_count integer, last_message_at timestamp with time zone, can_send_message boolean, hours_until_reset integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_usage INTEGER := 0;
  last_msg_time TIMESTAMP WITH TIME ZONE;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- Get total messages sent across ALL coaches in the last 24 hours
  SELECT COALESCE(SUM(u.message_count), 0), MAX(u.last_message_at)
  INTO current_usage, last_msg_time
  FROM public.user_usage u
  WHERE u.user_id = user_uuid 
    AND u.last_message_at > twenty_four_hours_ago;
  
  -- If no usage found, set defaults
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  RETURN QUERY SELECT 
    current_usage,
    last_msg_time,
    current_usage < 10 AS can_send_message,
    CASE 
      WHEN current_usage >= 10 AND last_msg_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (last_msg_time + INTERVAL '24 hours' - NOW())) / 3600
      ELSE 0
    END::INTEGER AS hours_until_reset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_healing_kit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.healing_kit_purchases 
    WHERE user_id = user_uuid AND status = 'completed'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_mood_entries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;