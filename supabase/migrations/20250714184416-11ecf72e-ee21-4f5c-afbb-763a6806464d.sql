-- Create usage tracking table
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage" 
ON public.user_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.user_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
ON public.user_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to get current usage for a user
CREATE OR REPLACE FUNCTION public.get_user_daily_usage(user_uuid UUID)
RETURNS TABLE(
  message_count INTEGER,
  last_message_at TIMESTAMP WITH TIME ZONE,
  can_send_message BOOLEAN,
  hours_until_reset INTEGER
) AS $$
DECLARE
  current_usage INTEGER := 0;
  last_msg_time TIMESTAMP WITH TIME ZONE;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- Get messages sent in the last 24 hours
  SELECT COUNT(*), MAX(last_message_at)
  INTO current_usage, last_msg_time
  FROM public.user_usage
  WHERE user_id = user_uuid 
    AND last_message_at > twenty_four_hours_ago;
  
  -- If no usage found, set defaults
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  RETURN QUERY SELECT 
    current_usage,
    last_msg_time,
    current_usage < 3 AS can_send_message,
    CASE 
      WHEN current_usage >= 3 AND last_msg_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (last_msg_time + INTERVAL '24 hours' - NOW())) / 3600
      ELSE 0
    END::INTEGER AS hours_until_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  twenty_four_hours_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '24 hours';
BEGIN
  -- Check current usage in last 24 hours
  SELECT COUNT(*)
  INTO current_usage
  FROM public.user_usage
  WHERE user_id = user_uuid 
    AND last_message_at > twenty_four_hours_ago;
  
  -- If at limit, don't increment
  IF current_usage >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update usage record
  INSERT INTO public.user_usage (user_id, date, message_count, last_message_at)
  VALUES (user_uuid, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    message_count = user_usage.message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();