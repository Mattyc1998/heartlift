-- Add rewards for milestones that are missing them
UPDATE recovery_milestones 
SET 
  reward_description = 'Daily motivation booster pack with affirmations and quotes',
  reward_content = '{
    "quotes": [
      "Every ending is a new beginning",
      "You are stronger than you know",
      "Healing begins when you choose yourself"
    ],
    "affirmations": [
      "I am worthy of love and respect",
      "I choose healing over hurt",
      "Every day I grow stronger"
    ]
  }'::jsonb,
  unlock_message = 'Congratulations! You''ve unlocked your daily motivation package.',
  celebration_message = '🎉 Amazing progress! You''ve earned a special reward package!'
WHERE reward_description IS NULL OR reward_description = '' OR celebration_message IS NULL;