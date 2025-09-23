-- Fix security warning: Move extensions to dedicated schema using wrapper function approach
-- First, unschedule any existing cron job
SELECT cron.unschedule('generate-daily-quiz-questions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-quiz-questions'
);

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop existing extensions from public schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Install extensions in the extensions schema
CREATE EXTENSION pg_cron WITH SCHEMA extensions;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;

-- Create a wrapper function in public schema
CREATE OR REPLACE FUNCTION public.generate_daily_quiz_wrapper()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM extensions.net.http_post(
    url:='https://hmmimemzznsyilxqakty.supabase.co/functions/v1/generate-daily-quiz-questions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU2MjgsImV4cCI6MjA2ODA5MTYyOH0.MrfJUkMzIPk12SFGuxWEtdLCVHq55ZWJLqDwOCIA2ZM"}'::jsonb,
    body:='{}'::jsonb
  );
END;
$$;

-- Schedule the cron job using extensions.cron.schedule
SELECT extensions.cron.schedule(
  'generate-daily-quiz-questions',
  '0 0 * * *',
  'SELECT public.generate_daily_quiz_wrapper();'
);