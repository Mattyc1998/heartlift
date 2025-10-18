-- Fix security warning: Move extensions to dedicated schema
-- First, unschedule the existing cron job
SELECT cron.unschedule('generate-daily-quiz-questions');

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop existing extensions from public schema
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

-- Install extensions in the extensions schema
CREATE EXTENSION pg_cron WITH SCHEMA extensions;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Set search_path to include extensions schema for the cron job
SELECT extensions.cron.schedule(
  'generate-daily-quiz-questions',
  '0 0 * * *',
  $$
  SELECT
    extensions.net.http_post(
        url:='https://hmmimemzznsyilxqakty.supabase.co/functions/v1/generate-daily-quiz-questions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU2MjgsImV4cCI6MjA2ODA5MTYyOH0.MrfJUkMzIPk12SFGuxWEtdLCVHq55ZWJLqDwOCIA2ZM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);