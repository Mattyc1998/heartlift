-- Fix security vulnerability: Make user_id NOT NULL in subscribers table
-- This ensures all subscriber records are properly protected by RLS policies

-- First, verify all existing records have user_id (they do, confirmed by previous query)
-- Then make the column NOT NULL to prevent future security issues

ALTER TABLE public.subscribers 
ALTER COLUMN user_id SET NOT NULL;

-- Also fix the same issue in other related tables for consistency and security
ALTER TABLE public.user_healing_progress 
ALTER COLUMN user_id SET NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.subscribers.user_id IS 'Required user ID for RLS security - must never be NULL';