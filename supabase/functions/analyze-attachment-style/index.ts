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
    const { answers, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate attachment style
    const attachmentStyle = calculateAttachmentStyle(answers);
    
    // Generate detailed analysis using OpenAI
    const analysisPrompt = `
    Based on the attachment style quiz results showing ${attachmentStyle} attachment style, provide a detailed psychological analysis including:

    1. Full breakdown of their attachment style patterns
    2. Specific triggers they should watch out for in relationships
    3. Personalized healing path recommendations
    4. Practical coping techniques for their style
    5. How this affects their relationship patterns

    Format the response as JSON with this structure:
    {
      "detailedBreakdown": {
        "strengths": ["list of strengths"],
        "challenges": ["list of challenges"],
        "relationshipPatterns": ["list of patterns"]
      },
      "healingPath": "Detailed personalized healing path text",
      "triggers": ["list of specific triggers to watch for"],
      "copingTechniques": [
        {
          "technique": "technique name",
          "description": "how to apply it",
          "example": "practical example"
        }
      ]
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
          { role: 'system', content: 'You are a licensed therapist specializing in attachment theory. Provide detailed, empathetic, and scientifically-backed analysis.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Save results to database
    const { error } = await supabase
      .from('user_attachment_results')
      .insert({
        user_id: userId,
        attachment_style: attachmentStyle,
        detailed_breakdown: analysis.detailedBreakdown,
        healing_path: analysis.healingPath,
        triggers: analysis.triggers,
        coping_techniques: analysis.copingTechniques,
      });

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save results');
    }

    return new Response(JSON.stringify({
      attachmentStyle,
      analysis
    }), {
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

function calculateAttachmentStyle(answers: string[]): string {
  const styleScores = {
    secure: 0,
    anxious: 0,
    avoidant: 0,
    disorganized: 0
  };

  // Simple scoring logic based on answer patterns
  answers.forEach((answer, index) => {
    if (answer.includes('comfortable') || answer.includes('trust') || answer.includes('open')) {
      styleScores.secure++;
    } else if (answer.includes('worry') || answer.includes('anxious') || answer.includes('clingy')) {
      styleScores.anxious++;
    } else if (answer.includes('independent') || answer.includes('distance') || answer.includes('uncomfortable')) {
      styleScores.avoidant++;
    } else {
      styleScores.disorganized++;
    }
  });

  return Object.entries(styleScores).reduce((a, b) => styleScores[a[0]] > styleScores[b[0]] ? a : b)[0];
}