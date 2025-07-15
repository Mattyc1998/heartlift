-- Fix the ambiguous column reference in increment_user_usage function
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid uuid, coach_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
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
  -- Use qualified column names to avoid ambiguity
  INSERT INTO public.user_usage (user_id, date, coach_id, message_count, last_message_at)
  VALUES (user_uuid, CURRENT_DATE, increment_user_usage.coach_id, 1, NOW())
  ON CONFLICT (user_id, date, COALESCE(coach_id, ''))
  DO UPDATE SET 
    message_count = public.user_usage.message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$function$;