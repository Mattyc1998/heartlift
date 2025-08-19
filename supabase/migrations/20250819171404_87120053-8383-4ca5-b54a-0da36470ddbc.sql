-- CRITICAL SECURITY FIX: Secure the visitors table
-- Enable Row Level Security on visitors table
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Create policy to restrict access to authenticated users only
-- Users can only view their own visitor records if they match by email
CREATE POLICY "Users can only view their own visitor records" 
ON public.visitors 
FOR SELECT 
USING (auth.email() = "Email Address");

-- Users can only insert visitor records with their own email
CREATE POLICY "Users can only insert visitor records with their own email" 
ON public.visitors 
FOR INSERT 
WITH CHECK (auth.email() = "Email Address");

-- Users can only update their own visitor records
CREATE POLICY "Users can only update their own visitor records" 
ON public.visitors 
FOR UPDATE 
USING (auth.email() = "Email Address");

-- Users can only delete their own visitor records
CREATE POLICY "Users can only delete their own visitor records" 
ON public.visitors 
FOR DELETE 
USING (auth.email() = "Email Address");

-- IMPORTANT: If this table stores passwords, consider removing the Password column
-- as passwords should be handled by Supabase Auth, not stored in plaintext
-- Uncomment the next line if you want to remove the password column:
-- ALTER TABLE public.visitors DROP COLUMN IF EXISTS "Password";