-- Create extensions schema to separate extensions from public schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop existing extensions from public schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Recreate extensions in the dedicated extensions schema
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Reschedule the cron job using the proper schema reference
-- First set search_path to include extensions schema for this session
SET search_path TO extensions, public;

-- Schedule the cron job 
SELECT cron.schedule(
  'generate-daily-quiz-questions',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT
    net.http_post(
        url:='https://hmmimemzznsyilxqakty.supabase.co/functions/v1/generate-daily-quiz-questions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU2MjgsImV4cCI6MjA2ODA5MTYyOH0.MrfJUkMzIPk12SFGuxWEtdLCVHq55ZWJLqDwOCIA2ZM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Reset search_path to default
RESET search_path;