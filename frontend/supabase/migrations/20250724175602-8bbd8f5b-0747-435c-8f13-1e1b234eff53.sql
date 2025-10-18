-- Add default healing kit data
INSERT INTO public.healing_plan_days (day_number, title, content, prompt, challenge, action_item, mindset_reframe) VALUES 
(1, 'Day 1: Acknowledge Your Feelings', 
 'Today is about giving yourself permission to feel whatever emotions are coming up without judgment. Breakups can bring up a complex mix of emotions - sadness, anger, relief, confusion, and everything in between. All of these feelings are valid and normal.',
 'Write about what you''re feeling right now. Don''t censor yourself - let the emotions flow onto the page.',
 'Notice when you try to push away difficult emotions. Instead, try to sit with them for just 60 seconds.',
 'Set up a daily check-in with yourself. Ask: "What am I feeling right now?" and honor whatever comes up.',
 'My feelings are temporary visitors, not permanent residents. I can feel them without being consumed by them.'),

(2, 'Day 2: Creating Your Safe Space', 
 'Recovery requires a sense of safety and comfort. Today we focus on creating physical and emotional spaces where you can heal without distraction or triggers.',
 'Describe your ideal safe space. What does it look like, feel like, smell like? How can you create elements of this space in your real life?',
 'Remove or pack away items that trigger painful memories. You don''t have to throw them away - just create some distance.',
 'Designate one area of your home as your "healing sanctuary" - somewhere you can go to process emotions.',
 'I deserve spaces where I feel safe, calm, and supported in my healing journey.'),

(3, 'Day 3: Understanding Your Attachment Style', 
 'Your attachment style - how you connect with others - plays a huge role in how you experience relationships and breakups. Understanding your patterns is the first step to healing them.',
 'Reflect on your past relationships. What patterns do you notice in how you connect, communicate, and handle conflict?',
 'Take time to research attachment styles (secure, anxious, avoidant, disorganized). Which resonates most with you?',
 'Practice one self-soothing technique when you feel activated or triggered.',
 'My past patterns don''t define my future. I can learn new ways of connecting and loving.');

-- Add daily affirmations
INSERT INTO public.daily_affirmations (text, category) VALUES
('I am worthy of love and respect, especially from myself', 'self-love'),
('Each day I am healing and growing stronger', 'healing'),
('I trust my journey and honor my process', 'trust'),
('I release what no longer serves me with love and gratitude', 'letting-go'),
('I am creating space for new and beautiful experiences', 'growth'),
('My heart is healing and expanding every day', 'healing'),
('I choose to see this experience as an opportunity for growth', 'growth'),
('I am enough, exactly as I am right now', 'self-love'),
('I am building a beautiful relationship with myself', 'self-love'),
('Every ending is a new beginning in disguise', 'hope');

-- Add guided meditations
INSERT INTO public.guided_meditations (title, description, duration_minutes, category) VALUES
('Healing Heart Meditation', 'A gentle meditation to soothe emotional pain and open your heart to healing', 15, 'healing'),
('Releasing Attachment Meditation', 'Learn to let go of what no longer serves you with compassion', 20, 'letting-go'),
('Self-Love and Acceptance', 'Cultivate a deeper relationship with yourself through loving-kindness', 18, 'self-love'),
('Anxiety Release Breathing', 'Simple breathing techniques to calm anxiety and ground yourself', 10, 'anxiety'),
('Morning Intention Setting', 'Start your day with clarity and positive intention', 12, 'morning'),
('Evening Reflection and Gratitude', 'End your day with reflection and appreciation', 14, 'evening');

-- Add journal prompts
INSERT INTO public.journal_prompts (prompt, category, emotional_theme) VALUES
('What lessons is this experience teaching me about myself?', 'growth', 'reflection'),
('Write a letter to your future self who has healed from this', 'healing', 'hope'),
('What qualities do you want to cultivate in yourself?', 'self-development', 'empowerment'),
('Describe three things you''re grateful for today, no matter how small', 'gratitude', 'appreciation'),
('What would you tell a friend going through the same situation?', 'self-compassion', 'kindness'),
('What activities make you feel most like yourself?', 'identity', 'self-discovery'),
('How has this experience changed your perspective on relationships?', 'relationships', 'wisdom'),
('What boundaries do you want to set for yourself going forward?', 'boundaries', 'self-protection'),
('Write about a time when you overcame a difficult challenge', 'resilience', 'strength'),
('What does your ideal life look like one year from now?', 'future', 'vision');