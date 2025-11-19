-- Fix RLS policies for heart_visions table (for TestFlight)

-- Enable RLS if not already enabled
ALTER TABLE heart_visions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own visions" ON heart_visions;
DROP POLICY IF EXISTS "Users can insert own visions" ON heart_visions;
DROP POLICY IF EXISTS "Users can delete own visions" ON heart_visions;
DROP POLICY IF EXISTS "Service role full access on visions" ON heart_visions;

-- Policy: Users can view their own visions
CREATE POLICY "Users can view own visions" 
ON heart_visions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own visions
CREATE POLICY "Users can insert own visions" 
ON heart_visions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own visions
CREATE POLICY "Users can delete own visions" 
ON heart_visions FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Service role has full access (for backend)
CREATE POLICY "Service role full access on visions" 
ON heart_visions FOR ALL 
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON heart_visions TO authenticated;
GRANT ALL ON heart_visions TO service_role;
