-- CRITICAL SECURITY FIX: Secure profiles table to prevent data theft
-- This addresses the "Customer Email Addresses Could Be Stolen by Hackers" vulnerability

-- First, let's ensure the profiles table has proper structure with email protection
-- Update existing profiles table to ensure email_address column exists if needed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_address TEXT;

-- Drop any existing overly permissive policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update only their own profile" ON public.profiles;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ultra-secure policies that completely block anonymous access
-- and ensure users can only access their own profile data

-- SELECT: Users can only view their own profile (no anonymous access)
CREATE POLICY "Authenticated users can view only their own profile data"
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- INSERT: Users can only create their own profile (no anonymous access)
CREATE POLICY "Authenticated users can insert only their own profile data"
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- UPDATE: Users can only update their own profile (no anonymous access)
CREATE POLICY "Authenticated users can update only their own profile data"
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- DELETE: Users can only delete their own profile (no anonymous access)
CREATE POLICY "Authenticated users can delete only their own profile data"
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Create a security function to safely get profile information
-- This prevents any potential data leakage through function calls
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  full_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Only return data for authenticated users accessing their own profile
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;