-- Create extensions schema for better security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions to dedicated schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Update the cron job to use the extensions schema
SELECT extensions.cron.unschedule('generate-daily-quiz-questions');

SELECT extensions.cron.schedule(
  'generate-daily-quiz-questions',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT
    extensions.net.http_post(
        url:='https://hmmimemzznsyilxqakty.supabase.co/functions/v1/generate-daily-quiz-questions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU2MjgsImV4cCI6MjA2ODA5MTYyOH0.MrfJUkMzIPk12SFGuxWEtdLCVHq55ZWJLqDwOCIA2ZM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);