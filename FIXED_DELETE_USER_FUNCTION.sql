-- =====================================================
-- FIXED ACCOUNT DELETION FUNCTION
-- =====================================================
-- Run this in Supabase SQL Editor to REPLACE the old function
-- =====================================================

-- First, drop the old function if it exists
DROP FUNCTION IF EXISTS delete_user();

-- Create the new, working function
CREATE OR REPLACE FUNCTION delete_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_user_id uuid;
BEGIN
  -- Get the current user ID
  deleted_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF deleted_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No authenticated user found'
    );
  END IF;
  
  -- Delete the user from auth.users
  -- This must be done with SECURITY DEFINER privileges
  DELETE FROM auth.users WHERE id = deleted_user_id;
  
  -- Check if deletion was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found or already deleted'
    );
  END IF;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'deleted_user_id', deleted_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return any errors
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Test the function (optional - comment out if not testing)
-- SELECT delete_user();

-- =====================================================
-- Expected output when called:
-- {"success": true, "deleted_user_id": "..."}
-- =====================================================
