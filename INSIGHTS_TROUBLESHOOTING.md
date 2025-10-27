# Personalised Insights - Troubleshooting Guide

## Current Status

**Backend**: ✅ Working correctly
- Endpoint: `POST /api/ai/insights`
- Generating insights successfully
- Returns 200 OK
- Logs show: "Successfully generated personalized insights"

**Frontend**: ⚠️ Issue during save to database

## What's Working

1. ✅ AI generation is successful
2. ✅ Backend endpoint responds with insights
3. ✅ Frontend receives the insights data

## Potential Issues

### Issue 1: Database Table Doesn't Exist
**Symptom**: Error saving to `user_insights_reports` table

**Solution**: The table might not exist in Supabase. Check if:
- Table name: `user_insights_reports`
- Required columns:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `report_type` (text)
  - `insights` (jsonb)
  - `conversation_count` (integer)
  - `mood_entries_analysed` (integer)
  - `attachment_style` (text)
  - `healing_progress_score` (integer)
  - `analysis_period_start` (timestamp)
  - `analysis_period_end` (timestamp)
  - `created_at` (timestamp, default now())

### Issue 2: Column Name Mismatch
**Symptom**: Error about specific column not existing

**Solution**: Check column names match exactly (case-sensitive)

### Issue 3: Permissions Issue
**Symptom**: "permission denied" or "RLS policy" error

**Solution**: Check Supabase RLS (Row Level Security) policies allow:
- INSERT for authenticated users
- SELECT for own records

## How to Debug

1. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for these logs:
     - "Received insights from backend:" - Should show the insights data
     - "Attempting to save report:" - Should show the data being saved
     - "Supabase save error:" - Will show the actual error
     - "Report saved successfully:" - If it works

2. **Check Supabase Dashboard**:
   - Go to your Supabase project
   - Navigate to Table Editor
   - Look for `user_insights_reports` table
   - Check if any records were created

3. **Check Network Tab**:
   - Open DevTools → Network tab
   - Try generating insights
   - Look for the POST request to `/api/ai/insights`
   - Check if it returns 200 OK with data

## Quick Fix Options

### Option A: Create Missing Table
If the table doesn't exist, create it in Supabase:

```sql
CREATE TABLE user_insights_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  insights JSONB NOT NULL,
  conversation_count INTEGER DEFAULT 0,
  mood_entries_analysed INTEGER DEFAULT 0,
  attachment_style TEXT,
  healing_progress_score INTEGER,
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_insights_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reports"
ON user_insights_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
ON user_insights_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Option B: Simplified Version (No Database Save)
If you just want to show insights without saving:

The insights are already generated and returned! The issue is only with saving to the database. You could temporarily display them without saving.

## Testing Commands

Test backend directly:
```bash
curl -X POST http://localhost:8001/api/ai/insights \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-123"}'
```

Should return insights JSON like:
```json
{
  "emotionalPatterns": [...],
  "communicationStyle": "...",
  "relationshipGoals": [...],
  ...
}
```

## Next Steps

1. Try generating insights again
2. Check browser console for the specific error
3. Share the exact error message
4. We can then apply the appropriate fix

The AI generation is working perfectly - we just need to fix the database save step!
