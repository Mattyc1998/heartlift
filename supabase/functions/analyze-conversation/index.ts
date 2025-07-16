import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationText, userId } = await req.json();

    const analysisPrompt = `
    Analyze this conversation between two people in a relationship context. Focus on communication patterns, emotional dynamics, and areas for improvement.

    Conversation:
    "${conversationText}"

    Provide analysis in this JSON format:
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a relationship counselor specializing in communication analysis. Be empathetic but honest in your assessment.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});