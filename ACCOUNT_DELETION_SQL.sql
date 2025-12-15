-- ============================================
-- HEARTLIFT ACCOUNT DELETION SQL FUNCTION
-- ============================================
-- 
-- RUN THIS IN SUPABASE SQL EDITOR:
-- 1. Go to your Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Paste this entire script
-- 4. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)
--
-- This function accepts the user_id as a parameter, which fixes the
-- "No authenticated user" error that occurred when auth.uid() was NULL.
-- ============================================

-- Step 1: Drop the old function if it exists
DROP FUNCTION IF EXISTS delete_user();
DROP FUNCTION IF EXISTS delete_user_by_id(uuid);

-- Step 2: Create the new function that accepts user_id as parameter
CREATE OR REPLACE FUNCTION delete_user_by_id(user_id_to_delete uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id uuid;
BEGIN
  -- Verify the user exists in auth.users
  SELECT id INTO deleted_id FROM auth.users WHERE id = user_id_to_delete;
  
  IF deleted_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found in auth.users');
  END IF;
  
  -- Delete the user from auth.users
  -- This permanently removes their authentication credentials
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  -- Return success response
  RETURN json_build_object('success', true, 'deleted_user_id', user_id_to_delete);
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details if something goes wrong
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Step 3: Grant execute permission to authenticated users
-- This allows logged-in users to call this function
GRANT EXECUTE ON FUNCTION delete_user_by_id(uuid) TO authenticated;

-- ============================================
-- VERIFICATION: Run this to check the function exists
-- ============================================
-- SELECT proname, proargnames FROM pg_proc WHERE proname = 'delete_user_by_id';
