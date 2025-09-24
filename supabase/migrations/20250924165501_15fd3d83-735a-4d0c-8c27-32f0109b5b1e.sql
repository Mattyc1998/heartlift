-- CRITICAL SECURITY FIX: Strengthen RLS policies for sensitive mental health data
-- This addresses the "Private Therapy Conversations Could Be Exposed" vulnerability

-- 1. Enhanced conversation_history security
DROP POLICY IF EXISTS "Users can view their own conversation history" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can insert their own conversation history" ON public.conversation_history;
DROP POLICY IF EXISTS "Users can delete their own conversation history" ON public.conversation_history;

-- Create secure policies that fail closed and include explicit authentication checks
CREATE POLICY "Authenticated users can view only their own conversation history"
ON public.conversation_history 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own conversation history"
ON public.conversation_history 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Authenticated users can delete only their own conversation history"
ON public.conversation_history 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 2. Enhanced mood_entries security
DROP POLICY IF EXISTS "Users can view their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can insert their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can update their own mood entries" ON public.mood_entries;

CREATE POLICY "Authenticated users can view only their own mood entries"
ON public.mood_entries 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own mood entries"
ON public.mood_entries 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Authenticated users can update only their own mood entries"
ON public.mood_entries 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 3. Enhanced user_attachment_results security
DROP POLICY IF EXISTS "Users can view their own attachment results" ON public.user_attachment_results;
DROP POLICY IF EXISTS "Users can insert their own attachment results" ON public.user_attachment_results;
DROP POLICY IF EXISTS "Users can update their own attachment results" ON public.user_attachment_results;

CREATE POLICY "Authenticated users can view only their own attachment results"
ON public.user_attachment_results 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own attachment results"
ON public.user_attachment_results 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Authenticated users can update only their own attachment results"
ON public.user_attachment_results 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 4. Enhanced conversation_analyses security
DROP POLICY IF EXISTS "Users can view their own conversation analyses" ON public.conversation_analyses;
DROP POLICY IF EXISTS "Users can insert their own conversation analyses" ON public.conversation_analyses;

CREATE POLICY "Authenticated users can view only their own conversation analyses"
ON public.conversation_analyses 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own conversation analyses"
ON public.conversation_analyses 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- 5. Enhanced profiles security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view only their own profile"
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own profile"
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Authenticated users can update only their own profile"
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 6. Enhanced subscribers security
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;

CREATE POLICY "Authenticated users can view only their own subscription"
ON public.subscribers 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own subscription"
ON public.subscribers 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

CREATE POLICY "Authenticated users can update only their own subscription"
ON public.subscribers 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);