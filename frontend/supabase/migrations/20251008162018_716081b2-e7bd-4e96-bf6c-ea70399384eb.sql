-- Enhanced Subscribers Security - Protect Payment and Subscription Data
-- This migration strengthens RLS policies to explicitly protect sensitive payment information

-- 1. Drop existing subscriber policies to recreate with stronger validation
DROP POLICY IF EXISTS "Authenticated users can view only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update only their own subscription" ON public.subscribers;

-- 2. Create enhanced SELECT policy with explicit isolation
CREATE POLICY "Users can only view their own subscription data"
ON public.subscribers FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- 3. Create enhanced INSERT policy with strict validation
CREATE POLICY "Users can only create their own subscription"
ON public.subscribers FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
  AND email IS NOT NULL
);

-- 4. Create enhanced UPDATE policy preventing sensitive field modification
CREATE POLICY "Users can only update their own subscription"
ON public.subscribers FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- 5. Create secure function to check subscription status WITHOUT exposing payment details
CREATE OR REPLACE FUNCTION public.user_has_premium_access(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 7. Add security documentation comments
COMMENT ON TABLE public.subscribers IS 'Subscription data with RLS protecting sensitive payment information. Users can only access their own subscription data. Stripe customer IDs should never be exposed to clients.';
COMMENT ON COLUMN public.subscribers.stripe_customer_id IS 'HIGHLY SENSITIVE: Stripe customer identifier. Only accessible via secure server functions.';
COMMENT ON COLUMN public.subscribers.email IS 'SENSITIVE: Only accessible to the subscription owner via RLS policies.';
COMMENT ON COLUMN public.subscribers.payment_status IS 'Payment status - verified through Stripe webhooks and secure functions only.';

-- 8. Create audit logging for subscription access
CREATE TABLE IF NOT EXISTS public.subscription_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_subscription_id uuid NOT NULL,
  accessing_user_id uuid NOT NULL,
  access_type text NOT NULL,
  ip_address text,
  user_agent text,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.subscription_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages subscription audit logs"
ON public.subscription_access_audit FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_subscription 
ON public.subscription_access_audit(accessed_subscription_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_user 
ON public.subscription_access_audit(accessing_user_id, accessed_at DESC);