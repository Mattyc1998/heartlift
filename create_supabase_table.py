"""
Create user_insights_reports table in Supabase
"""
import requests
import json

# Supabase credentials
SUPABASE_URL = "https://hmmimemzznsyilxqakty.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNTYyOCwiZXhwIjoyMDY4MDkxNjI4fQ.aXEa6J0iwphE8VFvodxwooasCf1wQyEAaoxOaEpWCnY"

# SQL to create the table and policies
sql_commands = """
-- Create the user_insights_reports table
CREATE TABLE IF NOT EXISTS user_insights_reports (
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

-- Enable Row Level Security
ALTER TABLE user_insights_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own reports" ON user_insights_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON user_insights_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON user_insights_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON user_insights_reports;

-- Create RLS policies
CREATE POLICY "Users can insert their own reports"
ON user_insights_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
ON user_insights_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON user_insights_reports FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON user_insights_reports FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS user_insights_reports_user_id_idx ON user_insights_reports(user_id);
CREATE INDEX IF NOT EXISTS user_insights_reports_created_at_idx ON user_insights_reports(created_at DESC);
"""

def execute_sql(sql):
    """Execute SQL via Supabase REST API"""
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Use PostgREST to execute SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    # Try alternative method using the database REST API
    # Split commands and execute one by one
    commands = [cmd.strip() for cmd in sql.split(';') if cmd.strip()]
    
    print(f"Executing {len(commands)} SQL commands...")
    
    for i, cmd in enumerate(commands, 1):
        if not cmd:
            continue
            
        print(f"\nCommand {i}/{len(commands)}:")
        print(f"  {cmd[:80]}..." if len(cmd) > 80 else f"  {cmd}")
        
        # Use the SQL endpoint directly
        sql_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
        payload = {"query": cmd}
        
        try:
            response = requests.post(sql_url, headers=headers, json=payload)
            if response.status_code in [200, 201, 204]:
                print(f"  ✓ Success")
            else:
                print(f"  ✗ Status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"  ✗ Error: {e}")

def verify_table():
    """Verify the table was created"""
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/user_insights_reports?select=count"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print("\n✅ Table 'user_insights_reports' exists and is accessible!")
            return True
        else:
            print(f"\n❌ Table verification failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"\n❌ Error verifying table: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Creating user_insights_reports table in Supabase")
    print("=" * 60)
    
    execute_sql(sql_commands)
    
    print("\n" + "=" * 60)
    print("Verifying table creation...")
    print("=" * 60)
    
    if verify_table():
        print("\n🎉 Table created successfully!")
        print("\nYou can now:")
        print("  1. Generate insights in the app")
        print("  2. View past reports")
        print("  3. Track your healing progress over time")
    else:
        print("\n⚠️  Table creation needs manual verification")
        print("\nPlease run this SQL in Supabase SQL Editor:")
        print("\n" + sql_commands)
