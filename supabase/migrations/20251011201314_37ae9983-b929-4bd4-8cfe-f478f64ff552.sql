-- Fix track_premium_feature_usage to work with service role
DROP FUNCTION IF EXISTS public.track_premium_feature_usage(uuid, text);

CREATE OR REPLACE FUNCTION public.track_premium_feature_usage(
  user_uuid uuid, 
  feature_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;

  INSERT INTO public.premium_features_usage (user_id, feature_name, usage_count, last_used)
  VALUES (user_uuid, feature_name, 1, NOW())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET 
    usage_count = public.premium_features_usage.usage_count + 1,
    last_used = NOW(),
    updated_at = NOW();
    
  UPDATE public.subscribers 
  SET last_used_premium_feature = NOW(),
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$function$;