import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'https://c286f1f4-22ee-4ea1-97f0-ce26599be25f.lovableproject.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

serve(async (req) => {
  const origin = getAllowedOrigin(req.headers.get('origin'));
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.log('No Lovable API key, using fallback questions');
      throw new Error('Lovable API key not configured - using fallback');
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
    
    // Create a unique seed for today to ensure different questions
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const themes = [
      'romantic relationships and dating experiences',
      'workplace dynamics and professional relationships',
      'friendships and social circle interactions', 
      'family dynamics and sibling relationships',
      'conflict resolution in everyday situations',
      'communication styles in relationships',
      'trust and vulnerability in connections',
      'work-life balance and personal boundaries',
      'social gatherings and group situations',
      'life transitions and major decisions',
      'daily routines and cohabitation',
      'long-distance relationships and separation'
    ];
    
    const todayTheme = themes[dayOfYear % themes.length];
    
    const prompt = `You are a world-renowned psychology expert specializing in attachment theory. Today is ${today} and I need you to generate exactly 10 completely FRESH and UNIQUE questions for an attachment style quiz.

CRITICAL: These questions must be entirely different from standard attachment questionnaires. Focus specifically on "${todayTheme}" as the primary context for your questions.

IMPORTANT RESTRICTIONS:
- NO questions about health issues, medical conditions, illness, or treatment plans
- Focus ONLY on relationships (romantic, friendships, work), general life situations, emotional patterns, and interpersonal dynamics
- Keep scenarios relatable to everyday life experiences

Requirements:
- Each question explores attachment patterns through the lens of "${todayTheme}"
- Questions should be creative scenarios about relationships and everyday life, not clinical situations
- Include subtle psychological insights about trust, emotional regulation, and connection patterns
- Each question has exactly 4 options representing: Secure, Anxious-Preoccupied, Dismissive-Avoidant, Fearful-Avoidant
- Make options realistic and nuanced, not obvious stereotypes
- Questions should feel natural and conversational, not clinical

Additional variety elements:
- Mix question formats: hypothetical scenarios, preference choices, reaction descriptions
- Include both direct and indirect ways of assessing attachment patterns
- Vary emotional intensity from subtle to more revealing
- Include questions about past experiences and future expectations

Return ONLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": [
        "Secure attachment response",
        "Anxious attachment response", 
        "Avoidant attachment response",
        "Fearful-avoidant attachment response"
      ]
    }
  ]
}

Generate 10 completely fresh questions NOW with "${todayTheme}" as the main context.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a world-class psychology expert and quiz designer specializing in attachment theory. Generate creative, insightful questions that reveal deep psychological patterns.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`Lovable AI failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response structure:', Object.keys(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected Lovable AI response structure:', data);
      throw new Error('Invalid Lovable AI response structure');
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