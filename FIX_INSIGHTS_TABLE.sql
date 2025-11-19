-- Add missing columns to insights_reports table

ALTER TABLE insights_reports 
ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mood_entries_analyzed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attachment_style TEXT DEFAULT 'exploring',
ADD COLUMN IF NOT EXISTS healing_progress_score INTEGER DEFAULT 65;

-- Update any existing reports with default values
UPDATE insights_reports 
SET 
    conversation_count = COALESCE(conversation_count, 0),
    mood_entries_analyzed = COALESCE(mood_entries_analyzed, 0),
    attachment_style = COALESCE(attachment_style, 'exploring'),
    healing_progress_score = COALESCE(healing_progress_score, 65)
WHERE conversation_count IS NULL 
   OR mood_entries_analyzed IS NULL 
   OR attachment_style IS NULL 
   OR healing_progress_score IS NULL;
