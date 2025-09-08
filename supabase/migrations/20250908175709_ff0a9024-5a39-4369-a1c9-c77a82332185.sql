-- Grant Healing Kit to specific user by email
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'matthew.crawford23@aol.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found for email %', 'matthew.crawford23@aol.com';
  ELSE
    -- Insert completed healing kit purchase if not exists
    INSERT INTO public.healing_kit_purchases (user_id, amount, currency, status, purchased_at, created_at)
    VALUES (v_user_id, 399, 'gbp', 'completed', now(), now())
    ON CONFLICT DO NOTHING;

    -- Initialize healing progress if not exists
    INSERT INTO public.user_healing_progress (user_id, current_day, created_at, updated_at)
    VALUES (v_user_id, 1, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
