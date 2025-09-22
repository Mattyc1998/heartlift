import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if questions already exist for today
    const today = new Date().toISOString().slice(0, 10);
    console.log('Checking for questions for date:', today);

    const { data: existingQuestions, error: fetchError } = await supabase
      .from('daily_quiz_questions')
      .select('*')
      .eq('quiz_date', today)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing questions:', fetchError);
      throw fetchError;
    }

    // If questions already exist for today, return them
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist for today, returning existing');
      return new Response(
        JSON.stringify({ 
          questions: existingQuestions[0].questions,
          isNew: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new questions using AI
    console.log('Generating new questions for today');
    
    const prompt = `You are a psychology expert specializing in attachment theory. Generate exactly 10 comprehensive, thought-provoking questions for an attachment style quiz that will help identify someone's attachment style (Secure, Anxious-Preoccupied, Dismissive-Avoidant, or Fearful-Avoidant).

Each question should:
- Be unique and different from typical attachment style questions
- Focus on real relationship scenarios and behaviors
- Have exactly 4 answer options that clearly correspond to the 4 attachment styles
- Be deep and insightful, not superficial
- Cover different aspects: emotional regulation, trust, communication, intimacy, conflict resolution, relationship patterns, childhood influences, self-perception, etc.

Return ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": [
        "Option 1 (secure style)",
        "Option 2 (anxious style)", 
        "Option 3 (avoidant style)",
        "Option 4 (fearful-avoidant style)"
      ]
    }
  ]
}

Make sure the questions are fresh, creative, and would provide deep insights into someone's attachment patterns. Avoid cliché questions about texting responses or basic relationship fears.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a world-class psychology expert and quiz designer specializing in attachment theory. Generate creative, insightful questions that reveal deep psychological patterns.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    let questionsData;
    try {
      questionsData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error('Invalid questions format from AI');
    }

    // Validate questions structure
    const validatedQuestions = questionsData.questions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question || `Question ${index + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
        'Default option 1', 'Default option 2', 'Default option 3', 'Default option 4'
      ]
    }));

    // Store in database
    const { error: insertError } = await supabase
      .from('daily_quiz_questions')
      .insert({
        quiz_date: today,
        questions: validatedQuestions,
        generated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error saving questions:', insertError);
      throw insertError;
    }

    console.log('Successfully generated and saved questions for', today);

    return new Response(
      JSON.stringify({ 
        questions: validatedQuestions,
        isNew: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-daily-quiz-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallbackQuestions: [
          {
            id: 1,
            question: "How do you typically approach new relationships?",
            options: [
              "With excitement and openness to connection",
              "With hope but worry about being hurt",
              "With caution and preference for independence", 
              "With confusion about what I want"
            ]
          }
        ]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});