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

    // Input validation for security
    if (!answers || !Array.isArray(answers) || answers.length > 50) {
      throw new Error('Answers must be an array and cannot exceed 50 items');
    }

    // Validate each answer
    for (const answer of answers) {
      if (typeof answer !== 'string' || answer.length > 500) {
        throw new Error('Each answer must be a string and cannot exceed 500 characters');
      }
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate attachment style
    const attachmentStyle = calculateAttachmentStyle(answers);
    
    // Generate detailed analysis using OpenAI
    const analysisPrompt = `
    Based on the attachment style quiz results showing ${attachmentStyle} attachment style, provide a detailed psychological analysis.
    
    IMPORTANT: The calculated attachment style is ${attachmentStyle}. Your analysis must be consistent with this specific style.
    
    Attachment Style Definitions:
    - secure: Comfortable with intimacy and autonomy
    - anxious: Seeks closeness but fears abandonment
    - avoidant: Values independence, uncomfortable with closeness
    - fearful-avoidant: Wants close relationships but fears getting hurt
    - disorganized: Chaotic, unpredictable relationship patterns, often from trauma
    
    Provide analysis for ${attachmentStyle} attachment style including:

    1. Full breakdown of their ${attachmentStyle} attachment style patterns
    2. Specific triggers they should watch out for in relationships
    3. Personalized healing path recommendations for ${attachmentStyle} style
    4. Practical coping techniques specifically for ${attachmentStyle} attachment
    5. How ${attachmentStyle} attachment affects their relationship patterns

    Format the response as valid JSON only (no markdown formatting) with this structure:
    {
      "detailedBreakdown": {
        "strengths": ["list of strengths specific to ${attachmentStyle}"],
        "challenges": ["list of challenges specific to ${attachmentStyle}"],
        "relationshipPatterns": ["list of patterns specific to ${attachmentStyle}"]
      },
      "healingPath": "Detailed personalized healing path text for ${attachmentStyle} attachment",
      "triggers": ["list of specific triggers to watch for with ${attachmentStyle} attachment"],
      "copingTechniques": [
        {
          "technique": "technique name",
          "description": "how to apply it for ${attachmentStyle} attachment",
          "example": "practical example for someone with ${attachmentStyle} attachment"
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
          { role: 'system', content: `You are a licensed therapist specializing in attachment theory. Provide detailed, empathetic, and scientifically-backed analysis. Always ensure your analysis is consistent with the calculated attachment style. Return only valid JSON without any markdown formatting or code blocks.` },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    let analysisContent = aiData.choices[0].message.content;
    
    // Clean up markdown formatting if present
    if (analysisContent.includes('```json')) {
      analysisContent = analysisContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    }
    
    const analysis = JSON.parse(analysisContent);

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
        quiz_date: new Date().toISOString().slice(0, 10),
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
    'fearful-avoidant': 0,
    disorganized: 0
  };

  // More sophisticated scoring based on attachment theory research
  answers.forEach((answer, index) => {
    const lowerAnswer = answer.toLowerCase();
    
    // Secure attachment indicators
    if (lowerAnswer.includes('comfortable') || lowerAnswer.includes('trust') || 
        lowerAnswer.includes('open') || lowerAnswer.includes('easy') ||
        lowerAnswer.includes('confident') || lowerAnswer.includes('positive') ||
        lowerAnswer.includes('supportive') || lowerAnswer.includes('stable')) {
      styleScores.secure += 2;
    }
    
    // Anxious attachment indicators
    if (lowerAnswer.includes('worry') || lowerAnswer.includes('anxious') || 
        lowerAnswer.includes('clingy') || lowerAnswer.includes('need') ||
        lowerAnswer.includes('fear') && lowerAnswer.includes('abandon') ||
        lowerAnswer.includes('jealous') || lowerAnswer.includes('insecure')) {
      styleScores.anxious += 2;
    }
    
    // Dismissive-avoidant indicators
    if (lowerAnswer.includes('independent') || lowerAnswer.includes('self-reliant') ||
        lowerAnswer.includes('distance') || lowerAnswer.includes('space') ||
        lowerAnswer.includes('uncomfortable') && lowerAnswer.includes('close') ||
        lowerAnswer.includes('prefer') && lowerAnswer.includes('alone')) {
      styleScores.avoidant += 2;
    }
    
    // Fearful-avoidant indicators (wants closeness but fears it)
    if ((lowerAnswer.includes('want') || lowerAnswer.includes('need')) && 
        (lowerAnswer.includes('fear') || lowerAnswer.includes('afraid') || lowerAnswer.includes('scared')) ||
        lowerAnswer.includes('conflicted') || lowerAnswer.includes('mixed feelings') ||
        (lowerAnswer.includes('close') && lowerAnswer.includes('hurt')) ||
        lowerAnswer.includes('push away') && lowerAnswer.includes('want')) {
      styleScores['fearful-avoidant'] += 3;
    }
    
    // Disorganized indicators (chaotic, unpredictable patterns)
    if (lowerAnswer.includes('unpredictable') || lowerAnswer.includes('chaotic') ||
        lowerAnswer.includes('confused') || lowerAnswer.includes('inconsistent') ||
        lowerAnswer.includes('explosive') || lowerAnswer.includes('trauma') ||
        (lowerAnswer.includes('hot') && lowerAnswer.includes('cold')) ||
        lowerAnswer.includes('doesn\'t make sense')) {
      styleScores.disorganized += 2;
    }
    
    // Context-based scoring adjustments
    if (index < 5) { // Early questions about general relationship comfort
      if (lowerAnswer.includes('difficult') || lowerAnswer.includes('hard')) {
        if (lowerAnswer.includes('trust') || lowerAnswer.includes('open')) {
          styleScores['fearful-avoidant'] += 1;
        } else {
          styleScores.avoidant += 1;
        }
      }
    }
  });

  // Find the highest scoring style
  const maxScore = Math.max(...Object.values(styleScores));
  const topStyles = Object.entries(styleScores).filter(([style, score]) => score === maxScore);
  
  // If there's a tie, use specific logic to break it
  if (topStyles.length > 1) {
    // Prioritize fearful-avoidant over disorganized if both are high
    if (styleScores['fearful-avoidant'] === styleScores.disorganized && 
        styleScores['fearful-avoidant'] >= styleScores.anxious && 
        styleScores['fearful-avoidant'] >= styleScores.avoidant) {
      return 'fearful-avoidant';
    }
    
    // If anxious and avoidant are tied and high, it's likely fearful-avoidant
    if (styleScores.anxious === styleScores.avoidant && 
        styleScores.anxious > 0) {
      return 'fearful-avoidant';
    }
  }
  
  return topStyles[0][0];
}