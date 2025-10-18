-- Create guided programs tables
CREATE TABLE public.guided_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guided program modules table
CREATE TABLE public.guided_program_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.guided_programs(id),
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  teaching_content TEXT NOT NULL,
  reflection_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, module_number)
);

-- Create user progress table for guided programs
CREATE TABLE public.user_guided_program_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.guided_programs(id),
  current_module INTEGER DEFAULT 1,
  completed_modules INTEGER[] DEFAULT '{}',
  program_completed BOOLEAN DEFAULT false,
  reflection_answers JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- Enable RLS
ALTER TABLE public.guided_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_program_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_guided_program_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for guided_programs
CREATE POLICY "Premium users can view guided programs" 
ON public.guided_programs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM subscribers 
  WHERE user_id = auth.uid() 
    AND subscribed = true 
    AND plan_type = 'premium' 
    AND payment_status = 'active'
));

-- Create policies for guided_program_modules
CREATE POLICY "Premium users can view program modules" 
ON public.guided_program_modules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM subscribers 
  WHERE user_id = auth.uid() 
    AND subscribed = true 
    AND plan_type = 'premium' 
    AND payment_status = 'active'
));

-- Create policies for user_guided_program_progress
CREATE POLICY "Users can view their own guided program progress" 
ON public.user_guided_program_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guided program progress" 
ON public.user_guided_program_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guided program progress" 
ON public.user_guided_program_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_guided_program_progress_updated_at
BEFORE UPDATE ON public.user_guided_program_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the three programs
INSERT INTO public.guided_programs (program_key, title, description, emoji) VALUES 
('finding_inner_security', 'Finding Inner Security', 'Build confidence, calm anxious thoughts, and feel secure within yourself.', '🌱'),
('rebuilding_trust', 'Rebuilding Trust', 'Heal past hurts and rediscover safety in relationships.', '💞'),
('letting_go_moving_forward', 'Letting Go & Moving Forward', 'Release the past and open space for healthier connections.', '🌸');

-- Insert modules for Finding Inner Security
INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 1, 'Understanding My Triggers', 
'Insecurity often stems from past experiences that taught us to question our worth or safety. These experiences create what we call "triggers" - situations, words, or behaviors that instantly activate our defensive responses. Understanding your triggers is the first step toward healing because it helps you recognize when your past is influencing your present.

When we''re triggered, our nervous system goes into survival mode, making it difficult to think clearly or respond rationally. This isn''t your fault - it''s a natural protective mechanism. However, by identifying these patterns, you can begin to separate what''s happening now from what happened before, giving yourself the power to choose your response rather than react automatically.

The goal isn''t to eliminate all triggers - that''s impossible and unnecessary. Instead, we''re building awareness so you can recognize when you''re being triggered and respond to yourself with compassion rather than judgment.',
'Take a moment to reflect: What situations or interactions tend to make you feel most insecure or defensive?'
FROM public.guided_programs WHERE program_key = 'finding_inner_security';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 2, 'Reframing My Inner Voice', 
'The way we talk to ourselves has tremendous power over how we feel and behave. Many of us carry an inner critic that developed during childhood as a way to protect us from making mistakes or being rejected. While this voice may have served a purpose once, it often becomes overly harsh and counterproductive in adulthood.

Self-compassion isn''t about lowering your standards or making excuses - it''s about treating yourself with the same kindness you''d offer a good friend facing similar challenges. Research shows that self-compassion actually increases motivation and resilience because it creates a safe internal environment where growth can happen naturally.

The practice of reframing your inner voice takes time and patience. Start by simply noticing when your inner critic is active, then gently ask yourself: "Would I say this to someone I care about?" Often, this simple question can help you find a more balanced and supportive way to speak to yourself.',
'What would you say to comfort a dear friend who was experiencing the same insecurities you face?'
FROM public.guided_programs WHERE program_key = 'finding_inner_security';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 3, 'Building My Secure Foundation', 
'Security isn''t something that happens to us - it''s something we cultivate within ourselves through consistent, nurturing practices. Think of building security like tending a garden: it requires regular attention, patience, and the right conditions to flourish. Your secure foundation is built from daily choices that reinforce your worth and stability.

This foundation includes practical elements like having routines that ground you, relationships that support you, and activities that bring you joy and peace. It also includes emotional elements like practicing self-acceptance, setting healthy boundaries, and developing trust in your ability to handle life''s challenges.

Remember that building security is not a destination but an ongoing practice. Some days will feel more secure than others, and that''s completely normal. What matters is having tools and practices you can return to that help you reconnect with your inner stability and strength.',
'What daily practices or reminders help you feel most grounded and secure in who you are?'
FROM public.guided_programs WHERE program_key = 'finding_inner_security';

-- Insert modules for Rebuilding Trust
INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 1, 'What Trust Means to Me', 
'Trust is deeply personal and shaped by our unique experiences, values, and needs. What feels trustworthy to one person might not feel the same to another, and that''s okay. Understanding your personal definition of trust is crucial because it helps you communicate your needs clearly and recognize when they''re being met.

Trust isn''t just about big promises or dramatic gestures - it''s built through countless small, consistent actions over time. It''s about feeling safe to be vulnerable, knowing that your feelings will be respected, and believing that someone will follow through on their commitments. Trust also includes trusting yourself - your instincts, your boundaries, and your ability to navigate relationships wisely.

When trust has been broken, it''s natural to question what it means and whether it''s worth the risk to trust again. This questioning isn''t a sign of weakness or dysfunction - it''s your protective system doing its job. By exploring what trust means to you personally, you can make more informed decisions about who and how to trust moving forward.',
'When you think of feeling truly safe and trusting with someone, what specific qualities or behaviors come to mind?'
FROM public.guided_programs WHERE program_key = 'rebuilding_trust';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 2, 'Recognizing Trust Breakers', 
'Understanding what erodes trust is just as important as understanding what builds it. Trust breakers aren''t always dramatic betrayals - they can be subtle patterns of behavior that gradually wear away your sense of safety and security. These might include broken promises, dismissive responses to your concerns, inconsistent behavior, or feeling like you have to hide parts of yourself to maintain the relationship.

Recognizing trust breakers isn''t about becoming suspicious or guarded - it''s about developing healthy discernment. This means paying attention to patterns rather than isolated incidents, trusting your feelings when something doesn''t feel right, and understanding that you have the right to expect basic respect and consistency in your relationships.

It''s also important to recognize that trust breakers exist on a spectrum. Some are deal-breakers that signal the need to end or significantly change a relationship, while others are issues that can be addressed through communication and mutual effort. Learning to distinguish between these categories is key to making wise decisions about your relationships.',
'Reflecting on past relationships, what behaviors or patterns made you feel unsafe or unable to trust?'
FROM public.guided_programs WHERE program_key = 'rebuilding_trust';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 3, 'Steps Toward Reconnection', 
'Rebuilding trust - whether with a specific person or in relationships generally - is a gradual process that requires patience, both with yourself and others. It''s important to understand that rebuilding trust doesn''t mean returning to blind faith or ignoring red flags. Instead, it''s about developing the courage to remain open to connection while maintaining healthy boundaries and standards.

The process often begins with small steps and lower-stakes situations. You might start by sharing something slightly vulnerable with a friend who has proven trustworthy, or by giving someone a second chance on a minor commitment before trusting them with something more significant. Each positive experience builds evidence that trust can be safe and worthwhile.

Remember that rebuilding trust also involves rebuilding trust with yourself - trusting your instincts, your ability to set boundaries, and your resilience in the face of disappointment. This self-trust is the foundation that makes it possible to risk trusting others again.',
'What small, manageable step could you take this week to practice trusting either yourself or someone else?'
FROM public.guided_programs WHERE program_key = 'rebuilding_trust';

-- Insert modules for Letting Go & Moving Forward
INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 1, 'Facing What I''m Holding On To', 
'Letting go begins with honest acknowledgment of what we''re carrying. Often, we hold onto pain, resentment, regret, or fear without fully recognizing the weight of these emotional burdens. This isn''t because we enjoy suffering, but because these feelings can feel familiar and, in a strange way, protective. Anger might feel more powerful than sadness, or worry might feel more helpful than acceptance.

Facing what you''re holding onto requires courage and compassion. It means looking at your emotions without immediately trying to fix them or push them away. Sometimes we hold onto pain because letting go feels like betraying ourselves or the person who hurt us. Other times, we hold onto familiar patterns because change feels scarier than staying stuck.

The goal of this acknowledgment isn''t to judge yourself for what you''re carrying or to force yourself to let go before you''re ready. Instead, it''s about bringing gentle awareness to these patterns so you can begin to understand what purpose they''ve served and whether they''re still serving you now.',
'What thoughts, feelings, or memories do you find yourself returning to again and again, even when they cause you pain?'
FROM public.guided_programs WHERE program_key = 'letting_go_moving_forward';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 2, 'Practicing Release', 
'True release isn''t about forcing yourself to forget or pretending something didn''t matter. It''s about changing your relationship with the experience - moving from being consumed by it to being able to hold it with acceptance and even gratitude for what it taught you. This shift doesn''t happen overnight, and it''s not a linear process.

Practicing release often involves feeling the emotions fully rather than avoiding them. When we resist our feelings, they tend to persist and grow stronger. When we allow them to flow through us with compassion, they naturally begin to transform. This might involve crying, writing, talking to a trusted friend, or simply sitting quietly with whatever arises.

Remember that letting go doesn''t mean you''re "over it" or that it didn''t matter. It means you''re choosing to carry the lessons and wisdom from the experience while releasing the parts that keep you stuck. This is one of the most loving things you can do for yourself - freeing up emotional energy to invest in what truly serves your growth and happiness.',
'What would feel most supportive for you right now as you practice releasing what no longer serves you?'
FROM public.guided_programs WHERE program_key = 'letting_go_moving_forward';

INSERT INTO public.guided_program_modules (program_id, module_number, title, teaching_content, reflection_prompt)
SELECT id, 3, 'Creating My Next Chapter', 
'Moving forward isn''t about forgetting your past or pretending it didn''t shape you - it''s about consciously choosing what you want to carry into your future. Your next chapter gets to be different not because you''re a different person, but because you''re a wiser version of yourself who has learned from every experience, both painful and joyful.

Creating your next chapter involves both releasing old patterns that no longer serve you and actively cultivating new ones that align with who you''re becoming. This might mean setting different boundaries, choosing relationships that reflect your growth, or pursuing interests that bring you genuine joy rather than just distraction from pain.

The beautiful thing about consciously creating your next chapter is that you get to be the author. You can honor your past while writing a future filled with the kind of love, connection, and growth that feels authentic to who you are now. This doesn''t guarantee that everything will be perfect, but it does mean you''ll be living in alignment with your values and your vision for your life.',
'When you imagine your life six months from now, living more freely and authentically, what do you see?'
FROM public.guided_programs WHERE program_key = 'letting_go_moving_forward';