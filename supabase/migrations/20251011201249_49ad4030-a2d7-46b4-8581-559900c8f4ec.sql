-- Drop the old function that has auth.uid() checks
DROP FUNCTION IF EXISTS public.insert_conversation_message(uuid, text, text, text);

-- Create a new version that works with service role from edge functions
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
AS $function$
DECLARE
  v_new_id uuid;
BEGIN
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

  -- Insert the message (service role can bypass RLS)
  INSERT INTO public.conversation_history (user_id, coach_id, message_content, sender)
  VALUES (p_user_id, p_coach_id, p_message_content, p_sender)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$;