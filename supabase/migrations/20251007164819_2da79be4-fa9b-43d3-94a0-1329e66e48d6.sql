-- Phase 1: Critical Security Improvements (Revised)
-- 1. Fix visitors table email enumeration vulnerability

-- Drop old policies that use email-based access
DROP POLICY IF EXISTS "Users can only view their own visitor records" ON public.visitors;
DROP POLICY IF EXISTS "Users can only insert visitor records with their own email" ON public.visitors;
DROP POLICY IF EXISTS "Users can only update their own visitor records" ON public.visitors;
DROP POLICY IF EXISTS "Users can only delete their own visitor records" ON public.visitors;

-- Add user_id column to visitors table
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create new secure policies using user_id
CREATE POLICY "Users can view their own visitor records"
ON public.visitors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visitor records"
ON public.visitors FOR INSERT
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update their own visitor records"
ON public.visitors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visitor records"
ON public.visitors FOR DELETE
USING (auth.uid() = user_id);

-- 2. Restrict quiz questions to authenticated users only
DROP POLICY IF EXISTS "Anonymous users view current date questions" ON public.daily_quiz_questions;

-- Keep only authenticated access
CREATE POLICY "Authenticated users view quiz questions"
ON public.daily_quiz_questions FOR SELECT
TO authenticated
USING (quiz_date = CURRENT_DATE);

-- 3. Add UPDATE and DELETE protection for healing_kit_purchases
CREATE POLICY "Users cannot update purchase records"
ON public.healing_kit_purchases FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete purchase records"
ON public.healing_kit_purchases FOR DELETE
USING (false);

-- 4. Create rate limiting infrastructure

-- Rate limiting table for API calls
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.rate_limit_log FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint_window 
ON public.rate_limit_log(user_id, endpoint, window_start);

-- Rate limit function (10 requests per minute per endpoint)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _endpoint text,
  _limit integer DEFAULT 10,
  _window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
  window_start_time timestamp with time zone;
BEGIN
  window_start_time := now() - (_window_minutes || ' minutes')::interval;
  
  -- Count recent requests
  SELECT COALESCE(SUM(rl.request_count), 0)
  INTO request_count
  FROM public.rate_limit_log rl
  WHERE rl.user_id = _user_id
    AND rl.endpoint = _endpoint
    AND rl.window_start > window_start_time;
  
  -- If under limit, log this request
  IF request_count < _limit THEN
    INSERT INTO public.rate_limit_log (user_id, endpoint, window_start)
    VALUES (_user_id, _endpoint, now())
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 5. Enhanced access logging for sensitive mental health data

-- Expand conversation_access_audit for comprehensive logging
ALTER TABLE public.conversation_access_audit 
ADD COLUMN IF NOT EXISTS table_name text,
ADD COLUMN IF NOT EXISTS row_id uuid,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create index for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_audit_user_time 
ON public.conversation_access_audit(accessing_user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_target_time 
ON public.conversation_access_audit(target_user_id, accessed_at DESC);

-- Logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  _table_name text,
  _row_id uuid,
  _target_user_id uuid,
  _access_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.conversation_access_audit (
    accessing_user_id,
    target_user_id,
    table_name,
    row_id,
    access_type,
    accessed_at
  )
  VALUES (
    auth.uid(),
    _target_user_id,
    _table_name,
    _row_id,
    _access_type,
    now()
  );
END;
$$;

-- 6. Strengthen RLS policies with enhanced validation

-- Enhanced conversation_history policies
DROP POLICY IF EXISTS "Users can only view their own conversations" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can only insert their own conversations" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can only delete their own conversations" ON public.conversation_history;

CREATE POLICY "Users view own conversations with auth check"
ON public.conversation_history FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL
);

CREATE POLICY "Users insert own conversations with validation"
ON public.conversation_history FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL 
  AND message_content IS NOT NULL 
  AND TRIM(message_content) <> ''
  AND LENGTH(message_content) <= 10000
);

CREATE POLICY "Users delete own conversations with auth check"
ON public.conversation_history FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Enhanced conversation_analyses policies
DROP POLICY IF EXISTS "Authenticated users can view only their own conversation analys" ON public.conversation_analyses;
DROP POLICY IF EXISTS "Authenticated users can insert only their own conversation anal" ON public.conversation_analyses;

CREATE POLICY "Users view own analyses with auth check"
ON public.conversation_analyses FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users insert own analyses with validation"
ON public.conversation_analyses FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND conversation_text IS NOT NULL
);

-- Enhanced mood_entries policies
DROP POLICY IF EXISTS "Authenticated users can view only their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Authenticated users can insert only their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Authenticated users can update only their own mood entries" ON public.mood_entries;

CREATE POLICY "Users view own mood entries with auth check"
ON public.mood_entries FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users insert own mood entries with validation"
ON public.mood_entries FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND mood_level BETWEEN 1 AND 10
);

CREATE POLICY "Users update own mood entries with auth check"
ON public.mood_entries FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Enhanced user_attachment_results policies
DROP POLICY IF EXISTS "Authenticated users can view only their own attachment results" ON public.user_attachment_results;
DROP POLICY IF EXISTS "Authenticated users can insert only their own attachment result" ON public.user_attachment_results;
DROP POLICY IF EXISTS "Authenticated users can update only their own attachment result" ON public.user_attachment_results;

CREATE POLICY "Users view own attachment results with auth check"
ON public.user_attachment_results FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users insert own attachment results with validation"
ON public.user_attachment_results FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND attachment_style IS NOT NULL
);

CREATE POLICY "Users update own attachment results with auth check"
ON public.user_attachment_results FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 7. Create anomaly detection table for suspicious activity

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own security alerts
CREATE POLICY "Users view their own security alerts"
ON public.security_alerts FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all alerts
CREATE POLICY "Service role manages security alerts"
ON public.security_alerts FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_time 
ON public.security_alerts(user_id, created_at DESC);

-- Function to create security alerts
CREATE OR REPLACE FUNCTION public.create_security_alert(
  _user_id uuid,
  _alert_type text,
  _severity text,
  _description text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO public.security_alerts (
    user_id,
    alert_type,
    severity,
    description,
    metadata
  )
  VALUES (
    _user_id,
    _alert_type,
    _severity,
    _description,
    _metadata
  )
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$;