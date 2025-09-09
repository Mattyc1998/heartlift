-- Drop the old guided_meditations table
DROP TABLE IF EXISTS public.guided_meditations;

-- Create visualisation_exercises table
CREATE TABLE public.visualisation_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL CHECK (category IN ('safe_space', 'future_self', 'releasing_emotions')),
  steps TEXT[] NOT NULL,
  reflection_prompts TEXT[] NOT NULL,
  variation_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visualisation_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (all users can see exercises)
CREATE POLICY "Visualisation exercises are viewable by everyone" 
ON public.visualisation_exercises 
FOR SELECT 
USING (true);

-- Create user progress tracking table
CREATE TABLE public.user_visualisation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.visualisation_exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reflection_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, completed_at)
);

-- Enable RLS for progress table
ALTER TABLE public.user_visualisation_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user progress
CREATE POLICY "Users can view their own visualization progress" 
ON public.user_visualisation_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visualization progress" 
ON public.user_visualisation_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visualisation_exercises_updated_at
BEFORE UPDATE ON public.visualisation_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample visualization exercises

-- Safe Space Visualizations (3 variations)
INSERT INTO public.visualisation_exercises (title, description, duration_minutes, category, steps, reflection_prompts, variation_number) VALUES
(
  'Your Personal Sanctuary',
  'Create a mental sanctuary where you feel completely safe, loved, and at peace.',
  12,
  'safe_space',
  ARRAY[
    'Close your eyes and take three deep, calming breaths. With each exhale, let your body relax more deeply.',
    'Imagine yourself standing at the entrance to your perfect safe space. This could be a cozy room, a beautiful garden, a peaceful beach, or anywhere that feels completely secure to you.',
    'Notice the details of this space. What do you see around you? Are there warm colors, soft textures, or beautiful natural elements?',
    'Feel the temperature - is it perfectly warm and comfortable? Notice any gentle sounds that make you feel calm and protected.',
    'Breathe in any scents that bring you comfort - perhaps fresh flowers, warm vanilla, or clean ocean air.',
    'Find a comfortable place to rest in your sanctuary. Feel how supported and safe you are here.',
    'Remind yourself: "This is my sacred space. Here I am completely safe, loved, and free to be myself."',
    'Stay in this feeling of safety and peace for a few moments, knowing you can return here whenever you need.',
    'When ready, take three deep breaths and gently open your eyes, carrying this sense of inner safety with you.'
  ],
  ARRAY[
    'What did your safe space look like? Describe the details that made it feel secure.',
    'How did your body feel when you were in your sanctuary?',
    'What emotions came up for you during this visualization?'
  ],
  1
),
(
  'The Protected Garden',
  'Visualize a secret garden that belongs only to you, where you can heal and grow in complete safety.',
  15,
  'safe_space',
  ARRAY[
    'Begin with slow, deep breathing. Imagine each breath is filling you with calm, healing energy.',
    'Picture yourself walking down a peaceful path towards a beautiful garden that belongs entirely to you.',
    'You approach a gate or entrance that opens only for you. As you step through, feel the immediate sense of protection and belonging.',
    'This garden is surrounded by whatever makes you feel most secure - perhaps tall, gentle trees, a soft mist, or protective golden light.',
    'Explore your garden slowly. Notice the flowers, plants, or trees that grow here. Each one represents something positive about you.',
    'Find a special spot to sit - maybe by a gentle stream, under a favorite tree, or on a comfortable garden bench.',
    'Feel the earth supporting you, the air nurturing you, and the entire garden embracing you with unconditional love.',
    'Listen to the peaceful sounds of your garden - birds singing, water flowing, or simply the gentle quiet.',
    'Know that this garden exists within you always. You can tend to it, visit it, and feel safe here whenever you choose.',
    'Before leaving, pick a small flower or leaf to carry with you as a reminder of your inner sanctuary.',
    'Walk back through your garden gate, knowing you can return anytime, and slowly open your eyes.'
  ],
  ARRAY[
    'What grew in your garden? What did these plants represent to you?',
    'How did it feel to have a space that belonged completely to you?',
    'What would you like to nurture or grow in your inner garden?'
  ],
  2
),
(
  'Castle of Inner Strength',
  'Build a powerful inner fortress that represents your resilience and protection.',
  10,
  'safe_space',
  ARRAY[
    'Take several deep breaths, feeling yourself becoming centered and calm.',
    'Imagine you are standing before a magnificent castle that represents your inner strength and protection.',
    'This castle is built from your courage, your wisdom, and all the challenges you have overcome.',
    'Walk through the castle gates, noticing how strong and beautiful they are. These gates open only for what serves your highest good.',
    'Explore the castle halls, each room representing a different strength you possess - your kindness, your resilience, your wisdom.',
    'Climb to the highest tower where you can see far in all directions, feeling your own power and perspective.',
    'From this tower, you can see that you are safe, that you have weathered storms before, and that you are stronger than you know.',
    'Feel the solid foundation beneath you - this is your unshakeable core, your true self that cannot be diminished.',
    'Rest in the knowledge that this castle of strength is always within you, protecting and empowering you.',
    'Slowly descend from the tower, walk through your castle, and step back outside, carrying this strength with you.',
    'Take three deep breaths and gently return to the present moment.'
  ],
  ARRAY[
    'What did your castle look like? What made it feel strong and protective?',
    'Which room or part of the castle felt most meaningful to you?',
    'How can you remember this inner strength in your daily life?'
  ],
  3
);

-- Future Self Visualizations (3 variations)
INSERT INTO public.visualisation_exercises (title, description, duration_minutes, category, steps, reflection_prompts, variation_number) VALUES
(
  'Meeting Your Healed Self',
  'Connect with the version of yourself that has healed and grown beyond your current challenges.',
  15,
  'future_self',
  ARRAY[
    'Find a comfortable position and breathe deeply, allowing your body to relax completely.',
    'Imagine yourself walking along a peaceful path that represents your healing journey.',
    'As you walk, notice how the path gradually becomes brighter and more beautiful, representing your growth.',
    'In the distance, you see a figure walking toward you. As they get closer, you realize this is your future, healed self.',
    'Look into the eyes of your future self and see the peace, confidence, and joy that radiates from them.',
    'Notice how they carry themselves - their posture, their energy, their smile. This is you, fully healed and thriving.',
    'Your future self speaks to you with love and encouragement. What wisdom do they share about your journey?',
    'Ask your future self: "What helped you heal? What do I need to remember right now?"',
    'Listen with your heart to their gentle, loving response.',
    'Your future self gives you a gift - perhaps a symbol, a feeling, or words of encouragement to carry with you.',
    'Embrace your future self, feeling their strength and peace flowing into your present self.',
    'Watch as your future self continues on their radiant path, knowing that this is where you are headed.',
    'Take three deep breaths, carrying this vision and wisdom back with you to the present moment.'
  ],
  ARRAY[
    'What did your healed future self look like? How did they carry themselves?',
    'What wisdom or advice did they share with you?',
    'What steps can you take today to move toward this version of yourself?'
  ],
  1
),
(
  'Your Thriving Future Life',
  'Experience a day in your future life where you are living with joy, purpose, and fulfillment.',
  18,
  'future_self',
  ARRAY[
    'Close your eyes and breathe deeply, letting go of any stress or worry from today.',
    'Imagine you are waking up in your ideal future life - perhaps 2, 5, or 10 years from now.',
    'Feel yourself waking up naturally, well-rested and excited about the day ahead.',
    'Look around your living space. How does it reflect the person you have become? Notice the beauty, comfort, and personal touches.',
    'As you start your day, notice how confident and at peace you feel. Your past challenges have made you stronger and wiser.',
    'See yourself engaging in work that fulfills you, using your unique gifts and talents to make a positive impact.',
    'Notice the relationships in your life - people who truly see and appreciate you, and whom you love and support in return.',
    'Experience moments throughout this future day: laughing freely, feeling proud of your growth, enjoying simple pleasures.',
    'Notice how you handle any small challenges that arise - with wisdom, calm confidence, and self-compassion.',
    'Feel the deep sense of belonging and purpose that fills your life. You are exactly where and who you are meant to be.',
    'As evening approaches, reflect on how grateful you feel for your journey and all you have learned.',
    'Before going to sleep in this future life, you think back to your past self with compassion and pride.',
    'Slowly bring this feeling of fulfillment and possibility back with you to the present moment.'
  ],
  ARRAY[
    'What was most surprising or meaningful about your future life vision?',
    'How did it feel to experience yourself as fully healed and thriving?',
    'What elements from this vision inspire you to take action today?'
  ],
  2
),
(
  'The Celebration of Your Growth',
  'Witness a celebration honoring all the growth, courage, and healing you have achieved.',
  12,
  'future_self',
  ARRAY[
    'Take several calming breaths and imagine yourself in a beautiful celebration space.',
    'This gathering is in honor of you - celebrating your courage, your healing journey, and your incredible growth.',
    'Look around and see people who love and support you, all here to celebrate your transformation.',
    'Notice how different you feel from when your healing journey began. Feel the strength and wisdom you have gained.',
    'Someone stands up to speak about your journey - they mention specific challenges you overcame with grace and courage.',
    'They talk about how your healing not only transformed you, but inspired and helped others around you.',
    'Feel the warmth and love in the room as people appreciate not just what you achieved, but who you have become.',
    'You are invited to share something about your journey. What would you want to say about your growth?',
    'Notice how proud you feel - not arrogant, but genuinely appreciative of your own courage and perseverance.',
    'Someone presents you with a meaningful gift that symbolizes your transformation and future potential.',
    'As the celebration continues, you realize this joy and recognition is something you can give yourself right now.',
    'Feel the deep satisfaction of knowing you chose healing, you chose growth, and you chose love over fear.',
    'Carry this feeling of celebration and self-appreciation back with you into your current life.'
  ],
  ARRAY[
    'How did it feel to be celebrated for your growth and courage?',
    'What did you realize about your own strength during this visualization?',
    'How can you celebrate your progress more often in your daily life?'
  ],
  3
);

-- Releasing Negative Emotions (3 variations)
INSERT INTO public.visualisation_exercises (title, description, duration_minutes, category, steps, reflection_prompts, variation_number) VALUES
(
  'Ocean Wave Release',
  'Use the gentle power of ocean waves to wash away stress, pain, and negative emotions.',
  14,
  'releasing_emotions',
  ARRAY[
    'Close your eyes and breathe deeply, imagining yourself on a peaceful, private beach.',
    'Feel the soft sand beneath your feet and the gentle, warm breeze on your skin.',
    'Bring to mind any stress, sadness, anger, or pain you are carrying. Just acknowledge it without judgment.',
    'Imagine gathering all these difficult feelings into a soft, dissolvable bundle in your hands.',
    'Walk slowly toward the calm, warm ocean. Each step makes you feel lighter and more peaceful.',
    'As you reach the water''s edge, gentle waves lap at your feet, welcoming you with their healing energy.',
    'Hold your bundle of difficult emotions and speak to the ocean: "I am ready to release what no longer serves me."',
    'Gently place the bundle into the warm water. Watch as it begins to dissolve and transform.',
    'Feel the waves gently washing over your feet, carrying away the dissolved emotions out to sea.',
    'With each wave that touches you, feel more lightness, peace, and freedom flowing through your body.',
    'Watch as the ocean transforms your pain into foam and bubbles, then into pure, healing energy.',
    'Stand in the warm water for a moment longer, feeling completely cleansed and renewed.',
    'Walk back to the beach, feeling lighter and more at peace than when you arrived.',
    'Take three deep breaths, carrying this sense of emotional freedom back with you.'
  ],
  ARRAY[
    'What emotions did you release into the ocean? How did it feel to let them go?',
    'How did your body feel different before and after the release?',
    'What positive feelings or qualities did you notice filling the space where the difficult emotions used to be?'
  ],
  1
),
(
  'Healing Light Release',
  'Transform difficult emotions using warm, healing light that converts pain into wisdom and peace.',
  12,
  'releasing_emotions',
  ARRAY[
    'Find a comfortable position and breathe slowly, allowing your body to relax deeply.',
    'Imagine a warm, golden light beginning to glow softly in your heart center.',
    'Think of any emotions you are ready to release - anger, sadness, fear, resentment, or pain.',
    'See these emotions as dark, heavy clouds within your body. Simply observe them with compassion.',
    'Now watch as the golden light in your heart begins to grow brighter and warmer.',
    'This is healing light - it doesn''t fight the darkness, but gently transforms it with love.',
    'See the light slowly expanding, reaching the first cloud of difficult emotion.',
    'Watch with wonder as the light touches the darkness and begins to transform it into something beautiful.',
    'Perhaps the anger becomes strength, the sadness becomes compassion, or the fear becomes wisdom.',
    'Continue breathing as the light expands throughout your entire body, reaching every shadow.',
    'Feel each difficult emotion being lovingly transformed into a positive quality you can use.',
    'See your whole body now glowing with this warm, healing light - peaceful, strong, and free.',
    'Know that this transformative light is always within you, ready to heal and renew.',
    'Take several deep breaths, sealing this healing light within you as you return to awareness.'
  ],
  ARRAY[
    'How did it feel to transform difficult emotions rather than just pushing them away?',
    'What positive qualities emerged from your transformed emotions?',
    'When might you use this healing light technique in your daily life?'
  ],
  2
),
(
  'Butterfly Release Ceremony',
  'Release emotional burdens by transforming them into beautiful butterflies that carry your pain away.',
  16,
  'releasing_emotions',
  ARRAY[
    'Breathe deeply and imagine yourself in a peaceful meadow surrounded by flowers and gentle nature.',
    'In your hands, you hold a small, beautiful box. This box can safely contain any emotions you wish to release.',
    'Think of feelings that have been weighing you down - hurt, disappointment, worry, or any emotional pain.',
    'Speak gently to these feelings: "Thank you for trying to protect me, but I am ready to let you go with love."',
    'Place each difficult emotion into the box, not with force, but with gentle acceptance.',
    'Close the box and hold it against your heart for a moment, sending love to your past pain.',
    'Now imagine the box beginning to glow with soft, transformative light.',
    'Open the box and watch in amazement as each difficult emotion has transformed into a beautiful butterfly.',
    'Each butterfly represents your emotion transformed - pain into wisdom, anger into strength, fear into courage.',
    'One by one, release the butterflies into the warm air, watching them dance and fly freely.',
    'Feel how much lighter you become as each butterfly carries away what you no longer need.',
    'The butterflies circle back to you briefly, as if thanking you, before flying away to their new freedom.',
    'Notice how the empty space inside you fills with lightness, peace, and new possibilities.',
    'Watch the last butterfly disappear into the beautiful sky, taking your burdens and returning them to nature.',
    'Stand in the meadow feeling free, light, and ready for the beauty that life wants to bring you.',
    'Take three grateful breaths and gently return to your present moment.'
  ],
  ARRAY[
    'What did each butterfly look like as it represented your transformed emotion?',
    'How did it feel to release your burdens with love rather than force?',
    'What new feelings or possibilities did you notice in the space where your difficulties used to be?'
  ],
  3
);