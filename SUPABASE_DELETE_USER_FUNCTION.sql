-- =====================================================
-- SUPABASE SQL FUNCTION: delete_user()
-- =====================================================
-- This function must be created in Supabase Dashboard
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: SQL Editor → New Query
-- 3. Copy and paste this entire SQL code
-- 4. Click "Run" to create the function
--
-- What it does:
-- - Allows authenticated users to delete their own auth account
-- - Runs with elevated privileges (SECURITY DEFINER)
-- - Called from the app when user clicks "Delete Account"
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the authenticated user from auth.users table
  -- auth.uid() returns the ID of the currently authenticated user
  DELETE FROM auth.users WHERE id = auth.uid();
  
  -- Log the deletion (optional, for debugging)
  RAISE NOTICE 'User % has been deleted', auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- =====================================================
-- TESTING THE FUNCTION
-- =====================================================
-- After creating the function, test it:
--
-- 1. Create a test account in your app
-- 2. Use the "Delete Account" button
-- 3. Try to log back in → Should fail (account doesn't exist)
-- 4. Check Supabase Auth dashboard → User should be gone
--
-- =====================================================
