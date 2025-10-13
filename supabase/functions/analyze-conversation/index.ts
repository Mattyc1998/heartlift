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
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationText, userId } = await req.json();

    // Input validation for security
    if (!conversationText || typeof conversationText !== 'string' || conversationText.length > 10000) {
      throw new Error('Conversation text must be a string and cannot exceed 10000 characters');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const analysisPrompt = `
    Analyze this conversation between two people in a relationship context. Focus on communication patterns, emotional dynamics, and areas for improvement.

    Conversation:
    "${conversationText}"

    Provide analysis in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
    {
      "emotionalTone": {
        "user": "description of user's emotional tone",
        "partner": "description of partner's emotional tone",
        "overall": "overall conversation dynamic"
      },
      "miscommunicationPatterns": [
        {
          "pattern": "pattern name",
          "description": "what went wrong",
          "examples": ["specific examples from text"]
        }
      ],
      "suggestions": [
        {
          "issue": "what could be improved",
          "betterResponse": "suggested better response",
          "explanation": "why this would work better"
        }
      ],
      "overallAssessment": "summary of conversation health and recommendations"
    }
    `;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a relationship counselor specializing in communication analysis. Be empathetic but honest in your assessment. IMPORTANT: Respond with ONLY valid JSON, no markdown formatting, no code blocks, no explanatory text.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    const aiData = await response.json();
    let aiResponse = aiData.choices[0].message.content;
    
    // Clean up response - remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    console.log('Cleaned AI response:', aiResponse);
    
    const analysis = JSON.parse(aiResponse);

    // Save analysis to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabase
      .from('conversation_analyses')
      .insert({
        user_id: userId,
        conversation_text: conversationText,
        emotional_tone: analysis.emotionalTone,
        miscommunication_patterns: analysis.miscommunicationPatterns,
        suggestions: analysis.suggestions,
      });

    if (error) {
      console.error('Database error:', error);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});