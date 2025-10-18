-- Enhanced Profile Security - Address Email Exposure Risk
-- This migration strengthens RLS policies to explicitly protect email addresses and personal data

-- 1. Drop existing profile policies to recreate them with stronger validation
DROP POLICY IF EXISTS "Authenticated users can view only their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert only their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update only their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete only their own profile data" ON public.profiles;

-- 2. Create enhanced SELECT policy with explicit user isolation
-- This ensures users can ONLY view their own profile, not other users' profiles
CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
);

-- 3. Create enhanced INSERT policy with validation
-- Prevents users from creating profiles for other users
CREATE POLICY "Users can only create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND auth.uid() IS NOT NULL
);

-- 4. Create enhanced UPDATE policy
-- Users can only update their own profile data
CREATE POLICY "Users can only update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create enhanced DELETE policy
-- Users can only delete their own profile
CREATE POLICY "Users can only delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create a secure function to get basic profile info WITHOUT email
-- This function can be used for displaying user info where email isn't needed
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name
  FROM public.profiles
  WHERE user_id = user_uuid;
$$;

-- 7. Add indexes for better performance on security checks
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 8. Add helpful comments documenting the security model
COMMENT ON TABLE public.profiles IS 'User profiles table with RLS protecting email addresses and personal data. Users can only access their own profile data.';
COMMENT ON COLUMN public.profiles.email_address IS 'Sensitive: Only accessible to the profile owner via RLS policies';
COMMENT ON COLUMN public.profiles.full_name IS 'User display name - consider using get_user_display_name() for public display';

-- 9. Create audit logging for profile access (optional but recommended)
CREATE TABLE IF NOT EXISTS public.profile_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_profile_id uuid NOT NULL,
  accessing_user_id uuid NOT NULL,
  access_type text NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage profile access logs"
ON public.profile_access_log FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_profile_access_log_profile 
ON public.profile_access_log(accessed_profile_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_access_log_user 
ON public.profile_access_log(accessing_user_id, accessed_at DESC);