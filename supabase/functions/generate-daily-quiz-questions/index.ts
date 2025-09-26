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
      console.log('No OpenAI API key, using fallback questions');
      throw new Error('OpenAI API key not configured - using fallback');
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
      console.error('Database error:', fetchError);
      throw new Error('Database access failed - using fallback');
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
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response structure:', Object.keys(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Invalid OpenAI response structure');
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response (first 200 chars):', aiResponse.substring(0, 200));

    let questionsData;
    try {
      // Try to extract JSON from the response - sometimes AI includes extra text
      let cleanResponse = aiResponse.trim();
      
      // Look for JSON object markers
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON (first 100 chars):', cleanResponse.substring(0, 100));
      }
      
      questionsData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      console.error('Raw response:', aiResponse);
      throw new Error(`JSON parsing failed: ${(parseError as Error).message}`);
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      console.error('Invalid questions format:', questionsData);
      throw new Error('Invalid questions format from AI');
    }

    // Validate questions structure
    const validatedQuestions = questionsData.questions.slice(0, 10).map((q: any, index: number) => ({
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
      console.error('Database insert error:', insertError);
      // Don't throw here - still return the questions even if we can't save them
    }

    console.log('Successfully generated', validatedQuestions.length, 'questions for', today);

    return new Response(
      JSON.stringify({ 
        questions: validatedQuestions,
        isNew: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', (error as Error).message);
    
    // Return comprehensive fallback questions with consistent format
    const fallbackQuestions = [
      {
        id: 1,
        question: "How do you typically approach new relationships?",
        options: [
          "With excitement and openness to connection",
          "With hope but worry about being hurt", 
          "With caution and preference for independence",
          "With confusion about what I want"
        ]
      },
      {
        id: 2,
        question: "When conflict arises in relationships, you tend to:",
        options: [
          "Address issues directly and work toward resolution",
          "Become anxious and seek immediate reassurance",
          "Withdraw and avoid confrontation",
          "Feel overwhelmed and react unpredictably"
        ]
      },
      {
        id: 3,
        question: "Your view of yourself in relationships is generally:",
        options: [
          "Confident and worthy of love",
          "Dependent on others' validation",
          "Self-reliant but emotionally distant", 
          "Inconsistent and self-doubting"
        ]
      },
      {
        id: 4,
        question: "When a partner needs space, you typically:",
        options: [
          "Respect their need while maintaining connection",
          "Feel rejected and seek constant reassurance",
          "Feel relieved and prefer the distance",
          "Feel confused about how to respond appropriately"
        ]
      },
      {
        id: 5,
        question: "Your emotional regulation during stress involves:",
        options: [
          "Processing feelings and seeking appropriate support",
          "Becoming overwhelmed and needing constant comfort",
          "Shutting down emotions and handling things alone",
          "Experiencing intense, conflicting emotions"
        ]
      }
    ];
    
    // ALWAYS return success with questions - never return error status
    return new Response(
      JSON.stringify({ 
        questions: fallbackQuestions,
        isNew: true,
        fallback: true,
        note: 'Using fallback questions: ' + (error as Error).message
      }),
      { 
        status: 200, // Always return 200 so frontend doesn't fail
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});