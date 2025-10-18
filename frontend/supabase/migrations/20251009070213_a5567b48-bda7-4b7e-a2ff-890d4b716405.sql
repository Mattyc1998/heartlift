-- Drop ALL existing policies on daily_reflections to ensure clean slate
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'daily_reflections'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_reflections', r.policyname);
    END LOOP;
END
$$;

-- Create strengthened policies with proper null checks and validation

-- SELECT policy: Ensure authenticated users can only view their own reflections
CREATE POLICY "Users can view only their own daily reflections"
ON public.daily_reflections
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id
);

-- INSERT policy: Ensure authenticated users can only create reflections for themselves
CREATE POLICY "Users can create only their own daily reflections"
ON public.daily_reflections
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  auth.uid() = user_id AND
  -- Validate reflection_date is reasonable (not too far in past or future)
  reflection_date >= CURRENT_DATE - INTERVAL '7 days' AND
  reflection_date <= CURRENT_DATE
);

-- UPDATE policy: Ensure users can only update their own reflections and cannot change user_id
CREATE POLICY "Users can update only their own daily reflections"
ON public.daily_reflections
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
  auth.uid() = user_id
);

-- Add a trigger to prevent user_id changes on updates
CREATE OR REPLACE FUNCTION public.prevent_user_id_change_daily_reflections()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id of a daily reflection';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_user_id_change_daily_reflections ON public.daily_reflections;
CREATE TRIGGER prevent_user_id_change_daily_reflections
BEFORE UPDATE ON public.daily_reflections
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change_daily_reflections();