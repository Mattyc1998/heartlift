-- Add authorization check to track_premium_feature_usage function
CREATE OR REPLACE FUNCTION public.track_premium_feature_usage(user_uuid uuid, feature_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- SECURITY: Ensure the calling user matches the target user
  IF auth.uid() IS NULL OR auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: cannot track feature usage for other users';
  END IF;

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
$$;

-- Add authorization check to increment_user_usage function
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid uuid, input_coach_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_usage INTEGER;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- SECURITY: Ensure the calling user matches the target user
  IF auth.uid() IS NULL OR auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: cannot increment usage for other users';
  END IF;

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
$$;

-- Add authorization check to insert_conversation_message function (already has some validation)
CREATE OR REPLACE FUNCTION public.insert_conversation_message(
  p_user_id uuid, 
  p_coach_id text, 
  p_message_content text, 
  p_sender text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  -- SECURITY: Ensure the calling user matches the target user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot insert messages for other users';
  END IF;

  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;

  -- Validate sender
  IF p_sender NOT IN ('user', 'assistant', 'coach') THEN
    RAISE EXCEPTION 'Invalid sender type';
  END IF;

  -- Validate message content
  IF p_message_content IS NULL OR TRIM(p_message_content) = '' THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  -- Validate message length
  IF LENGTH(p_message_content) > 10000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length';
  END IF;

  -- Insert the message
  INSERT INTO public.conversation_history (user_id, coach_id, message_content, sender)
  VALUES (p_user_id, p_coach_id, p_message_content, p_sender)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;