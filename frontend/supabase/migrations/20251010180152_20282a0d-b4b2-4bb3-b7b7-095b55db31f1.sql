-- Drop ALL existing policies on user_insights_reports to ensure clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_insights_reports'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_insights_reports', r.policyname);
    END LOOP;
END
$$;

-- Create strengthened policies with comprehensive validation

-- SELECT policy: Strict validation for viewing own insights
CREATE POLICY "Users can view only their own insights reports with validation"
ON public.user_insights_reports
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id
);

-- INSERT policy: Ensure users can only create insights for themselves with data validation
CREATE POLICY "Users can create only their own insights reports with validation"
ON public.user_insights_reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id AND
  -- Validate report_type is valid
  report_type IN ('conversation_analysis', 'mood_analysis', 'healing_progress', 'attachment_analysis') AND
  -- Ensure insights is not null and is valid JSON
  insights IS NOT NULL AND
  -- Validate analysis period dates if provided
  (analysis_period_start IS NULL OR analysis_period_start <= CURRENT_TIMESTAMP) AND
  (analysis_period_end IS NULL OR analysis_period_end <= CURRENT_TIMESTAMP) AND
  (analysis_period_start IS NULL OR analysis_period_end IS NULL OR analysis_period_start <= analysis_period_end)
);

-- UPDATE policy: Strict validation for updating own insights
CREATE POLICY "Users can update only their own insights reports with validation"
ON public.user_insights_reports
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id AND
  -- Ensure report_type remains valid
  report_type IN ('conversation_analysis', 'mood_analysis', 'healing_progress', 'attachment_analysis')
);

-- Add a trigger to prevent user_id changes on updates
CREATE OR REPLACE FUNCTION public.prevent_user_id_change_insights()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent user_id from being changed
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id of an insights report';
  END IF;
  
  -- Log any access to insights reports for audit trail
  INSERT INTO public.conversation_access_audit (
    accessing_user_id,
    target_user_id,
    table_name,
    row_id,
    access_type,
    accessed_at
  ) VALUES (
    auth.uid(),
    NEW.user_id,
    'user_insights_reports',
    NEW.id,
    'update',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_user_id_change_insights ON public.user_insights_reports;
CREATE TRIGGER prevent_user_id_change_insights
BEFORE UPDATE ON public.user_insights_reports
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change_insights();

-- Add a trigger to log insight report access for SELECT operations
CREATE OR REPLACE FUNCTION public.log_insights_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive insights data
  INSERT INTO public.conversation_access_audit (
    accessing_user_id,
    target_user_id,
    table_name,
    row_id,
    access_type,
    accessed_at
  ) VALUES (
    auth.uid(),
    NEW.user_id,
    'user_insights_reports',
    NEW.id,
    'insert',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_insights_access ON public.user_insights_reports;
CREATE TRIGGER log_insights_access
AFTER INSERT ON public.user_insights_reports
FOR EACH ROW
EXECUTE FUNCTION public.log_insights_access();