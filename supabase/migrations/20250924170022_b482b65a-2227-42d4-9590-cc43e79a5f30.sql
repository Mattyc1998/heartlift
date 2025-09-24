-- SECURITY FIX: Restrict access to proprietary visualization exercises content
-- This addresses the PUBLIC_VISUALIZATION_EXERCISES vulnerability

-- Drop the current policy that allows public access
DROP POLICY IF EXISTS "Visualisation exercises are viewable by everyone" ON public.visualisation_exercises;

-- Create secure policy that restricts access to premium users and healing kit purchasers
CREATE POLICY "Premium users and healing kit owners can view visualization exercises"
ON public.visualisation_exercises 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Allow premium subscribers
    EXISTS (
      SELECT 1 FROM public.subscribers 
      WHERE user_id = auth.uid() 
        AND subscribed = true 
        AND plan_type = 'premium' 
        AND payment_status = 'active'
    )
    OR
    -- Allow healing kit purchasers
    EXISTS (
      SELECT 1 FROM public.healing_kit_purchases 
      WHERE user_id = auth.uid() 
        AND status = 'completed'
    )
  )
);

-- Also secure user_visualisation_progress table to match
DROP POLICY IF EXISTS "Users can create their own visualization progress" ON public.user_visualisation_progress;
DROP POLICY IF EXISTS "Users can view their own visualization progress" ON public.user_visualisation_progress;

CREATE POLICY "Authenticated users can view only their own visualization progress"
ON public.user_visualisation_progress 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can create only their own visualization progress"
ON public.user_visualisation_progress 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);