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
    
    // Generate comprehensive detailed analysis using OpenAI
    const analysisPrompt = `
    You are a world-renowned attachment theory expert with 20+ years of clinical experience. Based on the attachment style quiz results showing ${attachmentStyle} attachment style, provide an exceptionally detailed psychological analysis.
    
    IMPORTANT: The calculated attachment style is ${attachmentStyle}. Your analysis must be comprehensive and consistent with this specific style.
    
    Attachment Style Definitions:
    - secure: Comfortable with intimacy and autonomy, trusting, communicative
    - anxious: Seeks closeness but fears abandonment, needs constant reassurance
    - avoidant: Values independence, uncomfortable with closeness, self-reliant
    - fearful-avoidant: Wants close relationships but fears getting hurt, push-pull dynamic
    - disorganized: Chaotic, unpredictable relationship patterns, often from trauma
    
    Provide an exceptionally comprehensive analysis for ${attachmentStyle} attachment style including:

    1. DETAILED breakdown with at least 5-7 items in each category
    2. EXTENSIVE list of specific triggers (at least 8-10)
    3. COMPREHENSIVE healing path with multiple stages
    4. PRACTICAL coping techniques with detailed examples (at least 6-8)
    5. DEEP analysis of relationship patterns
    6. CHILDHOOD origins and how they manifest today
    7. COMMUNICATION patterns specific to this style
    8. EMOTIONAL regulation strategies
    9. INTIMACY and vulnerability challenges
    10. GROWTH opportunities and potential
    11. DAILY practices for healing
    12. RED FLAGS to watch for in relationships

    Format the response as valid JSON only (no markdown formatting) with this expanded structure:
    {
      "detailedBreakdown": {
        "strengths": ["comprehensive list of 5-7 strengths specific to ${attachmentStyle}"],
        "challenges": ["comprehensive list of 5-7 challenges specific to ${attachmentStyle}"],
        "relationshipPatterns": ["comprehensive list of 5-7 patterns specific to ${attachmentStyle}"],
        "childhoodOrigins": ["detailed list of 4-5 childhood factors that created this style"],
        "communicationStyle": ["detailed list of 4-5 communication patterns"],
        "emotionalPatterns": ["detailed list of 4-5 emotional regulation patterns"],
        "intimacyChallenges": ["detailed list of 4-5 intimacy-related challenges"]
      },
      "healingPath": "Extremely detailed multi-stage healing path (at least 300 words) for ${attachmentStyle} attachment with specific steps, timeframes, and milestones",
      "triggers": ["comprehensive list of 8-10 specific triggers to watch for with ${attachmentStyle} attachment"],
      "copingTechniques": [
        {
          "technique": "technique name",
          "description": "detailed description of how to apply it for ${attachmentStyle} attachment",
          "example": "specific practical example for someone with ${attachmentStyle} attachment",
          "whenToUse": "specific situations when this technique is most effective"
        }
      ],
      "dailyPractices": [
        {
          "practice": "practice name",
          "description": "detailed description",
          "timeNeeded": "how long it takes",
          "frequency": "how often to do it"
        }
      ],
      "redFlags": ["list of 5-6 red flags in relationships for ${attachmentStyle} attachment"],
      "growthOpportunities": ["list of 5-6 specific areas for growth and potential"],
      "selfCareStrategies": ["list of 6-8 self-care strategies tailored to ${attachmentStyle} attachment"],
      "boundaryGuidance": "Detailed guidance on setting healthy boundaries for ${attachmentStyle} attachment style",
      "relationshipAdvice": "Comprehensive relationship advice tailored specifically to ${attachmentStyle} attachment style"
    }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `You are Dr. Sarah Mitchell, a world-renowned attachment theory expert with 25+ years of clinical experience, published researcher, and specialist in adult attachment patterns. You have helped thousands of clients heal their attachment wounds. Provide exceptionally detailed, empathetic, and scientifically-backed analysis that goes far beyond basic descriptions. Your analysis should be transformative and actionable. Always ensure your analysis is consistent with the calculated attachment style. Return only valid JSON without any markdown formatting or code blocks.` },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const aiData = await response.json();
    let analysisContent = aiData.choices[0].message.content;
    
    console.log('Raw AI response (first 200 chars):', analysisContent.substring(0, 200));
    
    let analysis;
    try {
      // Clean up markdown formatting if present
      if (analysisContent.includes('```json')) {
        analysisContent = analysisContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
      }
      
      // Try to extract JSON from the response
      let cleanResponse = analysisContent.trim();
      
      // Look for JSON object markers
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON (first 100 chars):', cleanResponse.substring(0, 100));
      }
      
      analysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      console.error('Raw response:', analysisContent);
      
      // Use fallback analysis
      analysis = {
        detailedBreakdown: {
          strengths: ["High emotional awareness", "Strong desire for connection"],
          challenges: ["Fear of abandonment", "Difficulty with boundaries"],
          redFlags: ["Dismissive behavior", "Inconsistent communication"],
          growthOpportunities: ["Self-soothing skills", "Healthy boundaries"]
        },
        dailyPractices: [
          { practice: "Mindfulness", frequency: "Daily", description: "Daily mindfulness practice" }
        ],
        healingPath: "Focus on building secure attachment through self-awareness and healthy relationships."
      };
    }

    // Save comprehensive results to database
    const { error } = await supabase
      .from('user_attachment_results')
      .insert({
        user_id: userId,
        attachment_style: attachmentStyle,
        detailed_breakdown: {
          ...analysis.detailedBreakdown,
          dailyPractices: analysis.dailyPractices,
          redFlags: analysis.redFlags,
          growthOpportunities: analysis.growthOpportunities,
          selfCareStrategies: analysis.selfCareStrategies,
          boundaryGuidance: analysis.boundaryGuidance,
          relationshipAdvice: analysis.relationshipAdvice
        },
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
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