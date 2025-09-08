-- Update Matthew's healing kit status to completed
UPDATE public.healing_kit_purchases 
SET status = 'completed', purchased_at = now()
WHERE user_id = '142200f7-6638-47d7-9cae-920a1ed6f9ff' AND status = 'pending';