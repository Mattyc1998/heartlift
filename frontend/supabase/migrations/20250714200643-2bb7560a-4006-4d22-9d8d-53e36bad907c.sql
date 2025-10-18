-- Fix ambiguous coach_id column references in database functions

CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid uuid, coach_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_usage INTEGER;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- Check current usage for this coach in last 24 hours
  SELECT COALESCE(SUM(u.message_count), 0)
  INTO current_usage
  FROM public.user_usage u
  WHERE u.user_id = user_uuid 
    AND (increment_user_usage.coach_id IS NULL OR u.coach_id = increment_user_usage.coach_id)
    AND u.last_message_at > twenty_four_hours_ago;
  
  -- If at limit, don't increment
  IF current_usage >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update usage record for this coach
  INSERT INTO public.user_usage (user_id, date, coach_id, message_count, last_message_at)
  VALUES (user_uuid, CURRENT_DATE, increment_user_usage.coach_id, 1, NOW())
  ON CONFLICT (user_id, date, coach_id)
  DO UPDATE SET 
    message_count = user_usage.message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_daily_usage(user_uuid uuid, coach_id text DEFAULT NULL::text)
 RETURNS TABLE(message_count integer, last_message_at timestamp with time zone, can_send_message boolean, hours_until_reset integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_usage INTEGER := 0;
  last_msg_time TIMESTAMP WITH TIME ZONE;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- Get messages sent to this coach (or all coaches if coach_id is null) in the last 24 hours
  IF get_user_daily_usage.coach_id IS NULL THEN
    -- Get total usage across all coaches
    SELECT COALESCE(SUM(u.message_count), 0), MAX(u.last_message_at)
    INTO current_usage, last_msg_time
    FROM public.user_usage u
    WHERE u.user_id = user_uuid 
      AND u.last_message_at > twenty_four_hours_ago;
  ELSE
    -- Get usage for specific coach
    SELECT COALESCE(SUM(u.message_count), 0), MAX(u.last_message_at)
    INTO current_usage, last_msg_time
    FROM public.user_usage u
    WHERE u.user_id = user_uuid 
      AND u.coach_id = get_user_daily_usage.coach_id
      AND u.last_message_at > twenty_four_hours_ago;
  END IF;
  
  -- If no usage found, set defaults
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  RETURN QUERY SELECT 
    current_usage,
    last_msg_time,
    current_usage < 5 AS can_send_message,
    CASE 
      WHEN current_usage >= 5 AND last_msg_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (last_msg_time + INTERVAL '24 hours' - NOW())) / 3600
      ELSE 0
    END::INTEGER AS hours_until_reset;
END;
$function$;