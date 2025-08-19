-- CRITICAL SECURITY FIX: Remove plaintext password storage from profiles table
-- The profiles table should NEVER store passwords when using Supabase Auth
-- Supabase Auth handles all password management securely

-- Remove the Password column entirely - passwords should NEVER be stored in plaintext
ALTER TABLE public.profiles DROP COLUMN IF EXISTS "Password";

-- Also clean up the email column name (remove spaces for better practices)
ALTER TABLE public.profiles RENAME COLUMN "email address" TO email_address;

-- The existing RLS policies are already correct for the user_id column:
-- - Users can only view their own profile (auth.uid() = user_id)
-- - Users can only insert their own profile (auth.uid() = user_id) 
-- - Users can only update their own profile (auth.uid() = user_id)
-- These policies are secure and properly restrict access