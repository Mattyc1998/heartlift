-- Update day 0 milestone with proper reward content
UPDATE public.recovery_milestones 
SET 
  reward_content = '{
    "quotes": [
      "The first step is always the hardest, but you have taken it",
      "Courage is not the absence of fear, but taking action despite it",
      "Every expert was once a beginner"
    ],
    "affirmations": [
      "I am brave enough to begin my healing journey",
      "I deserve love, peace, and happiness",
      "I choose my wellbeing over temporary comfort"
    ]
  }'::jsonb,
  reward_description = 'Welcome package with inspiring quotes and daily affirmations to start your journey',
  unlock_message = 'Welcome to your healing journey! You have unlocked your first inspiration package.',
  celebration_message = '🌟 Welcome! Taking the first step shows incredible courage. You are already on your way to healing!'
WHERE day_number = 0 AND reward_content = '{}'::jsonb;

-- Insert additional day 1 milestone with better rewards (since there are duplicates)
INSERT INTO public.recovery_milestones (
  day_number,
  title,
  description,
  reward_type,
  badge_name,
  reward_content,
  reward_description,
  unlock_message,
  celebration_message
) VALUES (
  1,
  'Momentum Building',
  'You completed your first full day of no contact - the foundation is set!',
  'practical_tool',
  'Day One Champion',
  '{
    "worksheets": [
      {
        "title": "Daily Reflection Journal Template",
        "description": "A structured template to help you process your thoughts and emotions each day",
        "content": "Today I felt...\nWhat challenged me:\nWhat I am grateful for:\nTomorrow I will focus on:"
      },
      {
        "title": "Trigger Identification Worksheet", 
        "description": "Identify your emotional triggers and create healthy responses",
        "content": "My triggers are:\n1.\n2.\n3.\nHealthy responses:\n1.\n2.\n3."
      }
    ],
    "checklists": [
      {
        "title": "Daily Self-Care Checklist",
        "items": [
          "Practiced deep breathing for 5 minutes",
          "Wrote in my journal",
          "Did something kind for myself",
          "Connected with a supportive friend",
          "Celebrated my progress"
        ]
      }
    ]
  }'::jsonb,
  'Practical worksheets and checklists to build healthy daily habits',
  'Congratulations! You have unlocked practical tools to support your daily healing practice.',
  '🎯 One day strong! You have unlocked tools to help structure your healing journey.'
)
ON CONFLICT DO NOTHING;