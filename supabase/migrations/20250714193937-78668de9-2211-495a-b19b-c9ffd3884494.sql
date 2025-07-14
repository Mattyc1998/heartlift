-- Create healing kit purchase tracking table
CREATE TABLE public.healing_kit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in pence (399 for £3.99)
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create healing plan days content
CREATE TABLE public.healing_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number >= 1 AND day_number <= 30),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT,
  challenge TEXT,
  mindset_reframe TEXT,
  action_item TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create guided meditations
CREATE TABLE public.guided_meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  audio_url TEXT, -- placeholder for now
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily affirmations
CREATE TABLE public.daily_affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create journal prompts
CREATE TABLE public.journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  category TEXT,
  emotional_theme TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recovery milestones
CREATE TABLE public.recovery_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  badge_name TEXT,
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user progress tracking
CREATE TABLE public.user_healing_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  completed_days INTEGER[] DEFAULT '{}',
  no_contact_start_date DATE,
  no_contact_streak_days INTEGER DEFAULT 0,
  last_contact_date DATE,
  journal_entries JSONB DEFAULT '[]',
  completed_milestones INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.healing_kit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_healing_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own purchases" ON healing_kit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON healing_kit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users with healing kit can view plan days" ON healing_plan_days
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM healing_kit_purchases 
    WHERE user_id = auth.uid() AND status = 'completed'
  ));

CREATE POLICY "Users with healing kit can view meditations" ON guided_meditations
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM healing_kit_purchases 
    WHERE user_id = auth.uid() AND status = 'completed'
  ));

CREATE POLICY "Users with healing kit can view affirmations" ON daily_affirmations
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM healing_kit_purchases 
    WHERE user_id = auth.uid() AND status = 'completed'
  ));

CREATE POLICY "Users with healing kit can view journal prompts" ON journal_prompts
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM healing_kit_purchases 
    WHERE user_id = auth.uid() AND status = 'completed'
  ));

CREATE POLICY "Users with healing kit can view milestones" ON recovery_milestones
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM healing_kit_purchases 
    WHERE user_id = auth.uid() AND status = 'completed'
  ));

CREATE POLICY "Users can view their own progress" ON user_healing_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_healing_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_healing_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert placeholder content for 30-day healing plan
INSERT INTO healing_plan_days (day_number, title, content, prompt, challenge, mindset_reframe, action_item) VALUES
(1, 'New Beginning', 'Today marks the start of your healing journey. Acknowledge where you are and commit to your growth.', 'What does healing mean to you right now?', 'Write down 3 things you''re grateful for today', 'This ending is actually a new beginning', 'Set up your healing space with one meaningful object'),
(2, 'Feel Your Feelings', 'It''s okay to feel sad, angry, or confused. These emotions are valid and temporary.', 'What emotions am I avoiding right now?', 'Sit with one difficult emotion for 5 minutes without judgment', 'Feelings are visitors, not permanent residents', 'Practice deep breathing when overwhelming emotions arise'),
(3, 'Self-Compassion', 'Treat yourself with the same kindness you''d show a good friend going through heartbreak.', 'How can I be kinder to myself today?', 'Write yourself a compassionate letter', 'I deserve love and kindness, especially from myself', 'Replace one self-critical thought with a kind one'),
(4, 'No Contact Commitment', 'Today you commit to giving yourself space to heal by maintaining no contact.', 'Why is no contact important for my healing?', 'Delete their number and unfollow on social media', 'Distance creates clarity and allows healing', 'Create a list of activities to do when you want to reach out'),
(5, 'Rediscover Your Identity', 'You are a complete person outside of any relationship. Reconnect with who you are.', 'Who was I before this relationship?', 'Do one activity you loved before you met them', 'I am whole and complete on my own', 'Make plans with a friend who knew you before the relationship');

-- Continue with more days (abbreviated for space)
INSERT INTO healing_plan_days (day_number, title, content, prompt, challenge, mindset_reframe, action_item) VALUES
(10, 'Forgiveness Practice', 'Forgiveness is for you, not them. It''s about releasing the weight you carry.', 'What am I ready to forgive?', 'Write a forgiveness letter you won''t send', 'Forgiveness frees me, not them', 'Practice loving-kindness meditation'),
(15, 'Strength Recognition', 'Look how far you''ve come. You''re stronger than you think.', 'What challenges have I overcome?', 'List 10 ways you''ve grown stronger', 'Every challenge has made me more resilient', 'Celebrate one small victory from this week'),
(21, 'Future Visioning', 'Start imagining the beautiful life you''re creating for yourself.', 'What does my ideal future look like?', 'Create a vision board for your new life', 'My future is bright and full of possibilities', 'Take one action toward a future goal'),
(30, 'Integration & Celebration', 'You''ve done incredible work. Honor your journey and commitment to healing.', 'How have I changed over these 30 days?', 'Write a letter to your future self', 'I have the tools and strength to continue growing', 'Plan a meaningful celebration of your progress');

-- Insert guided meditations
INSERT INTO guided_meditations (title, description, duration_minutes, audio_url, category) VALUES
('Letting Go', 'A gentle meditation to help release attachment and find peace with endings', 12, '/audio/letting-go.mp3', 'Release'),
('Self-Worth Reset', 'Reconnect with your inherent value and rebuild self-confidence', 15, '/audio/self-worth.mp3', 'Self-Love'),
('Calm the Attachment Spiral', 'Soothe anxious thoughts and obsessive thinking patterns', 10, '/audio/attachment-calm.mp3', 'Anxiety'),
('Heart Healing Visualization', 'A powerful visualization to mend your emotional wounds', 18, '/audio/heart-healing.mp3', 'Healing'),
('Inner Strength Activation', 'Connect with your resilience and inner power', 14, '/audio/inner-strength.mp3', 'Empowerment');

-- Insert daily affirmations
INSERT INTO daily_affirmations (text, category) VALUES
('I am worthy of love and respect', 'Self-Worth'),
('I choose peace over pain today', 'Peace'),
('My heart is healing more each day', 'Healing'),
('I am strong enough to handle this', 'Strength'),
('I deserve a love that feels easy and natural', 'Love'),
('I trust the process of my healing', 'Trust'),
('I am becoming the person I''m meant to be', 'Growth'),
('I release what no longer serves me', 'Release'),
('I am grateful for the lessons in this experience', 'Gratitude'),
('I choose to focus on my bright future', 'Future'),
('I am complete and whole on my own', 'Wholeness'),
('I attract healthy, loving relationships', 'Attraction'),
('I forgive myself for staying too long', 'Forgiveness'),
('I am proud of my courage to heal', 'Courage'),
('I am creating a beautiful new chapter', 'New Beginnings');

-- Insert journal prompts
INSERT INTO journal_prompts (prompt, category, emotional_theme) VALUES
('What did this relationship teach me about myself?', 'Self-Discovery', 'Reflection'),
('What red flags did I ignore, and why?', 'Awareness', 'Learning'),
('How has this experience changed me for the better?', 'Growth', 'Positive'),
('What qualities do I want in my next relationship?', 'Future', 'Hope'),
('What am I most afraid to let go of?', 'Fear', 'Vulnerable'),
('How can I show myself love today?', 'Self-Care', 'Nurturing'),
('What boundaries do I need to set going forward?', 'Boundaries', 'Empowerment'),
('What parts of myself did I lose in this relationship?', 'Identity', 'Recovery'),
('What am I excited about in my new life?', 'Future', 'Excitement'),
('How do I want to remember this relationship?', 'Closure', 'Peace'),
('What would I tell my younger self about love?', 'Wisdom', 'Compassion'),
('What dreams did I put aside that I can now pursue?', 'Dreams', 'Motivation'),
('How has my definition of love evolved?', 'Love', 'Growth'),
('What am I most proud of in how I''ve handled this?', 'Pride', 'Celebration'),
('What does self-love look like for me?', 'Self-Love', 'Discovery');

-- Insert recovery milestones
INSERT INTO recovery_milestones (day_number, title, description, badge_name, reward_type) VALUES
(1, 'Journey Begins', 'You took the first brave step toward healing', 'First Step', 'badge'),
(7, 'One Week Strong', 'Seven days of commitment to your healing journey', 'Week Warrior', 'badge'),
(14, 'Two Week Champion', 'Fourteen days of consistent self-care and growth', 'Fortnight Fighter', 'badge'),
(21, 'Three Week Hero', 'You''ve built incredible momentum in your healing', 'Triple Week', 'badge'),
(30, 'Healing Graduate', 'You completed the full 30-day healing journey!', 'Healing Master', 'celebration'),
(0, 'No Contact Day 1', 'You started your no-contact journey', 'No Contact Starter', 'badge'),
(3, 'No Contact 3 Days', 'Three days of giving yourself space to heal', 'Space Creator', 'badge'),
(7, 'No Contact Week', 'One full week of no contact - incredible strength!', 'Week of Silence', 'badge'),
(14, 'No Contact Fortnight', 'Two weeks of maintaining your boundaries', 'Boundary Boss', 'badge'),
(30, 'No Contact Month', 'A full month of choosing yourself first', 'Self-Love Champion', 'celebration');

-- Create function to check if user has healing kit
CREATE OR REPLACE FUNCTION public.user_has_healing_kit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.healing_kit_purchases 
    WHERE user_id = user_uuid AND status = 'completed'
  );
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_healing_progress_updated_at
  BEFORE UPDATE ON public.user_healing_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();