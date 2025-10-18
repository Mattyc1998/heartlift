-- Security Enhancement for conversation_history table
-- This migration adds additional validation layers to prevent unauthorized access

-- Step 1: Create a function to validate conversation ownership
CREATE OR REPLACE FUNCTION public.validate_conversation_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user_id is never null
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Validate user_id is a valid UUID and exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: user does not exist';
  END IF;

  -- Validate message_content is not empty
  IF NEW.message_content IS NULL OR TRIM(NEW.message_content) = '' THEN
    RAISE EXCEPTION 'message_content cannot be empty';
  END IF;

  -- Validate sender is either 'user', 'assistant', or 'coach'
  IF NEW.sender NOT IN ('user', 'assistant', 'coach') THEN
    RAISE EXCEPTION 'sender must be user, assistant, or coach';
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Create trigger to validate all inserts
DROP TRIGGER IF EXISTS validate_conversation_insert ON public.conversation_history;
CREATE TRIGGER validate_conversation_insert
  BEFORE INSERT ON public.conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_user();

-- Step 3: Ensure user_id is never null
ALTER TABLE public.conversation_history 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversation_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at timestamp with time zone DEFAULT now(),
  accessing_user_id uuid,
  target_user_id uuid,
  access_type text,
  was_blocked boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on audit table
ALTER TABLE public.conversation_access_audit ENABLE ROW LEVEL SECURITY;

-- Drop and recreate audit policy
DROP POLICY IF EXISTS "Service role can view audit logs" ON public.conversation_access_audit;
CREATE POLICY "Service role can view audit logs" 
ON public.conversation_access_audit 
FOR SELECT 
TO service_role
USING (true);

-- Step 5: Strengthen existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can view only their own conversation histor" ON public.conversation_history;
DROP POLICY IF EXISTS "Authenticated users can insert only their own conversation hist" ON public.conversation_history;
DROP POLICY IF EXISTS "Authenticated users can delete only their own conversation hist" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can only view their own conversations" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can only insert their own conversations" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can only delete their own conversations" ON public.conversation_history;

-- Create new strengthened policies
CREATE POLICY "Users can only view their own conversations" 
ON public.conversation_history 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Users can only insert their own conversations" 
ON public.conversation_history 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND message_content IS NOT NULL
  AND TRIM(message_content) != ''
);

CREATE POLICY "Users can only delete their own conversations" 
ON public.conversation_history 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Step 6: Add performance index
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id_created 
ON public.conversation_history(user_id, created_at DESC);

-- Step 7: Create secure function for edge functions
CREATE OR REPLACE FUNCTION public.insert_conversation_message(
  p_user_id uuid,
  p_coach_id text,
  p_message_content text,
  p_sender text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Insert the message
  INSERT INTO public.conversation_history (user_id, coach_id, message_content, sender)
  VALUES (p_user_id, p_coach_id, p_message_content, p_sender)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

COMMENT ON FUNCTION public.insert_conversation_message IS 
'Secure function for inserting conversation messages. Validates all inputs.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_conversation_message TO authenticated, service_role;