-- CRITICAL SECURITY FIX: Remove plaintext password storage
-- Since Supabase Auth handles authentication, storing passwords in plaintext 
-- in the visitors table is a massive security vulnerability

-- Remove the Password column entirely - passwords should NEVER be stored in plaintext
ALTER TABLE public.visitors DROP COLUMN IF EXISTS "Password";

-- Also clean up the email column name (remove spaces for better practices)
ALTER TABLE public.visitors RENAME COLUMN "Email Address" TO email_address;

-- Update the RLS policies to use the renamed column
DROP POLICY IF EXISTS "Users can only view their own visitor records" ON public.visitors;
DROP POLICY IF EXISTS "Users can only insert visitor records with their own email" ON public.visitors;
DROP POLICY IF EXISTS "Users can only update their own visitor records" ON public.visitors;
DROP POLICY IF EXISTS "Users can only delete their own visitor records" ON public.visitors;

-- Recreate policies with proper column name
CREATE POLICY "Users can only view their own visitor records" 
ON public.visitors 
FOR SELECT 
USING (auth.email() = email_address);

CREATE POLICY "Users can only insert visitor records with their own email" 
ON public.visitors 
FOR INSERT 
WITH CHECK (auth.email() = email_address);

CREATE POLICY "Users can only update their own visitor records" 
ON public.visitors 
FOR UPDATE 
USING (auth.email() = email_address);

CREATE POLICY "Users can only delete their own visitor records" 
ON public.visitors 
FOR DELETE 
USING (auth.email() = email_address);