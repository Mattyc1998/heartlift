-- Create subscribers table for subscription management
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  plan_type TEXT DEFAULT 'free',
  premium_start_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'inactive',
  last_used_premium_feature TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can insert their own subscription" 
ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Create premium features usage tracking
CREATE TABLE IF NOT EXISTS public.premium_features_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Enable RLS on premium features usage
ALTER TABLE public.premium_features_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for premium features usage
CREATE POLICY "Users can view their own premium usage" 
ON public.premium_features_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own premium usage" 
ON public.premium_features_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium usage" 
ON public.premium_features_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to check if user has premium access
CREATE OR REPLACE FUNCTION public.user_has_premium_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription RECORD;
BEGIN
  SELECT subscribed, plan_type, payment_status
  INTO user_subscription
  FROM public.subscribers
  WHERE user_id = user_uuid;
  
  -- Return true if user has active premium subscription
  RETURN COALESCE(user_subscription.subscribed, false) = true 
    AND COALESCE(user_subscription.plan_type, 'free') = 'premium'
    AND COALESCE(user_subscription.payment_status, 'inactive') = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track premium feature usage
CREATE OR REPLACE FUNCTION public.track_premium_feature_usage(
  user_uuid UUID,
  feature_name TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.premium_features_usage (user_id, feature_name, usage_count, last_used)
  VALUES (user_uuid, feature_name, 1, NOW())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET 
    usage_count = premium_features_usage.usage_count + 1,
    last_used = NOW(),
    updated_at = NOW();
    
  -- Update last used premium feature in subscribers table
  UPDATE public.subscribers 
  SET last_used_premium_feature = NOW(),
      updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscribers timestamps
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for premium features usage timestamps
CREATE TRIGGER update_premium_features_usage_updated_at
BEFORE UPDATE ON public.premium_features_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();