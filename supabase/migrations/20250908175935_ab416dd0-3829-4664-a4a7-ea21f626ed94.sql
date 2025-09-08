-- Force insert healing kit purchase for Matthew Crawford
INSERT INTO public.healing_kit_purchases (user_id, amount, currency, status, purchased_at, created_at)
VALUES ('142200f7-6638-47d7-9cae-920a1ed6f9ff', 399, 'gbp', 'completed', now(), now())
ON CONFLICT (user_id) DO UPDATE SET 
  status = 'completed',
  purchased_at = now(),
  updated_at = now();

-- Force insert healing progress
INSERT INTO public.user_healing_progress (user_id, current_day, created_at, updated_at)
VALUES ('142200f7-6638-47d7-9cae-920a1ed6f9ff', 1, now(), now())
ON CONFLICT (user_id) DO UPDATE SET 
  updated_at = now();