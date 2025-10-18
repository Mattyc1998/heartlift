-- Enhance recovery milestones with detailed reward information
ALTER TABLE public.recovery_milestones 
ADD COLUMN reward_content JSONB DEFAULT '{}',
ADD COLUMN reward_description TEXT,
ADD COLUMN unlock_message TEXT,
ADD COLUMN celebration_message TEXT;

-- Add sample recovery milestones with meaningful rewards
INSERT INTO public.recovery_milestones (day_number, title, description, badge_name, reward_type, reward_description, unlock_message, celebration_message, reward_content) VALUES 
(1, 'First Step Forward', 'You''ve begun your healing journey! Taking the first step is often the hardest part.', 'New Beginning', 'inspirational', 'Unlock a personalized affirmation and motivational quote collection', 'Congratulations! You''ve unlocked your first reward package.', '🎉 Amazing! You''ve started your transformation journey!', '{"quotes": ["Every journey begins with a single step", "You are stronger than you think", "Healing is not linear, and that''s okay"], "affirmations": ["I am worthy of love and healing", "I choose peace over pain", "I am becoming who I''m meant to be"]}'),

(3, 'Building Momentum', 'Three days of commitment! You''re establishing healthy patterns and showing real dedication.', 'Momentum Builder', 'practical', 'Self-care checklist and daily routine planner', 'Your dedication has earned you practical tools for success!', '🌟 You''re building incredible momentum!', '{"checklist": ["Morning meditation (5 minutes)", "Journaling gratitude", "Physical movement", "Healthy meal planning", "Evening reflection"], "routine_tips": ["Set consistent wake/sleep times", "Create tech-free zones", "Practice mindful breathing"]}'),

(7, 'One Week Strong', 'A full week of healing! You''re proving to yourself that change is possible.', 'Week Warrior', 'audio_video', '10-minute guided healing meditation', 'You''ve unlocked a special meditation just for you!', '🧘‍♀️ One week of strength deserves recognition!', '{"meditation_title": "Inner Strength Meditation", "duration": "10 minutes", "focus": "Building confidence and inner peace", "description": "A guided meditation to connect with your inner strength and resilience"}'),

(14, 'Two Week Milestone', 'Fourteen days of consistent growth! You''re developing real resilience and self-awareness.', 'Resilience Master', 'recognition', 'Certificate of Progress and milestone badge', 'Your perseverance has earned you official recognition!', '🏆 Two weeks of transformation - you''re unstoppable!', '{"certificate_text": "This certifies that you have completed 14 days of dedicated healing and personal growth", "badge_design": "Golden compass symbolizing direction and purpose", "achievement_level": "Resilience Master"}'),

(21, 'Three Week Champion', 'Three weeks of dedication! You''re well on your way to lasting positive change.', 'Change Champion', 'practical', 'Advanced journaling prompts and reflection worksheets', 'Unlock deeper self-discovery tools!', '✨ Three weeks of champions deserve champion tools!', '{"prompts": ["What patterns have I noticed in my healing?", "How has my relationship with myself changed?", "What would I tell someone starting this journey?"], "worksheets": ["Values clarification exercise", "Boundary setting guide", "Future self visualization"]}'),

(30, 'One Month Transformation', 'Thirty days of incredible growth! You''ve proven that lasting change is within your reach.', 'Transformation Hero', 'audio_video', 'Exclusive coaching session on maintaining progress', 'A special coaching session awaits you!', '🎯 One month of transformation - you''re a true hero!', '{"session_title": "Sustaining Your Success", "duration": "20 minutes", "topics": ["Maintaining momentum", "Handling setbacks", "Building on your foundation"], "coach_message": "You''ve shown incredible commitment - let''s plan your continued success"}');

-- Create table to track user milestone progress for premium users
CREATE TABLE public.user_milestone_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.recovery_milestones(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT FALSE,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS on user milestone progress
ALTER TABLE public.user_milestone_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user milestone progress
CREATE POLICY "Users can view their own milestone progress"
ON public.user_milestone_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestone progress"
ON public.user_milestone_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestone progress"
ON public.user_milestone_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Update trigger for milestone progress
CREATE TRIGGER update_milestone_progress_updated_at
BEFORE UPDATE ON public.user_milestone_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update recovery milestones RLS policy to allow premium users to view milestones
DROP POLICY IF EXISTS "Users with healing kit can view milestones" ON public.recovery_milestones;

CREATE POLICY "Premium users can view milestones"
ON public.recovery_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscribers 
    WHERE user_id = auth.uid() 
    AND subscribed = true 
    AND plan_type = 'premium' 
    AND payment_status = 'active'
  )
);