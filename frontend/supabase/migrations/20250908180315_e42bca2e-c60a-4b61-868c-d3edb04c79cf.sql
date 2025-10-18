-- Update guided meditation audio URLs to working examples
UPDATE public.guided_meditations 
SET audio_url = 'https://www.soundjay.com/misc/sounds/meditation.mp3'
WHERE audio_url LIKE '/audio/%';

-- Ensure all purchases are automatically completed (not pending)
UPDATE public.healing_kit_purchases 
SET status = 'completed', purchased_at = COALESCE(purchased_at, now())
WHERE status = 'pending';