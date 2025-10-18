-- Simply enable the required extensions in public schema (standard approach)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cron job without schema qualification
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