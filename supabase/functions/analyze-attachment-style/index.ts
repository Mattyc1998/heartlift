import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    
    // Generate focused analysis using OpenAI with timeout
    const analysisPrompt = `
    You are an attachment theory expert. For ${attachmentStyle} attachment style, provide a concise analysis in valid JSON format only:

    {
      "detailedBreakdown": {
        "strengths": ["3-4 key strengths for ${attachmentStyle}"],
        "challenges": ["3-4 main challenges for ${attachmentStyle}"],
        "relationshipPatterns": ["3-4 key patterns for ${attachmentStyle}"]
      },
      "healingPath": "Concise healing path for ${attachmentStyle} attachment (100-150 words)",
      "triggers": ["4-5 main triggers for ${attachmentStyle}"],
      "copingTechniques": [
        {
          "technique": "technique name",
          "description": "brief description for ${attachmentStyle}",
          "example": "practical example"
        }
      ],
      "dailyPractices": [
        {
          "practice": "practice name",
          "description": "brief description",
          "frequency": "how often"
        }
      ]
    }
    `;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Faster model
          messages: [
            { role: 'system', content: `You are an attachment theory expert. Provide concise, actionable analysis in valid JSON format only. No markdown formatting.` },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500, // Reduced for faster response
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('OpenAI request timed out, using fallback analysis');
        throw new Error('Analysis timed out');
      }
      throw error;
    }

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
      
      // Use improved fallback analysis
      analysis = {
        detailedBreakdown: {
          strengths: ["Emotional awareness", "Desire for connection", "Capacity for growth"],
          challenges: ["Managing emotions", "Trust issues", "Boundary setting"],
          relationshipPatterns: ["Seeks reassurance", "May appear clingy", "Values security"]
        },
        healingPath: "Focus on building self-awareness through journaling and mindfulness. Practice self-soothing techniques and gradually work on trusting others. Consider therapy for deeper healing.",
        triggers: ["Abandonment fears", "Criticism", "Uncertainty", "Conflict"],
        copingTechniques: [
          {
            "technique": "Breathing exercises",
            "description": "Deep breathing to calm anxiety",
            "example": "4-7-8 breathing technique"
          }
        ],
        dailyPractices: [
          { 
            practice: "Mindfulness meditation", 
            description: "Daily mindfulness practice", 
            frequency: "10 minutes daily" 
          }
        ]
      };
    }

    // Enhanced error handling for timeout cases
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid analysis generated');
    }

    // Save results to database with simplified structure
    const { error } = await supabase
      .from('user_attachment_results')
      .insert({
        user_id: userId,
        attachment_style: attachmentStyle,
        detailed_breakdown: analysis.detailedBreakdown || {},
        healing_path: analysis.healingPath || "Focus on self-awareness and healthy relationships.",
        triggers: analysis.triggers || [],
        coping_techniques: analysis.copingTechniques || [],
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
    'fearful-avoidant': 0
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
    
    // Additional fearful-avoidant indicators (chaotic, unpredictable patterns)
    if (lowerAnswer.includes('unpredictable') || lowerAnswer.includes('chaotic') ||
        lowerAnswer.includes('confused') || lowerAnswer.includes('inconsistent') ||
        lowerAnswer.includes('explosive') || lowerAnswer.includes('trauma') ||
        (lowerAnswer.includes('hot') && lowerAnswer.includes('cold')) ||
        lowerAnswer.includes('doesn\'t make sense')) {
      styleScores['fearful-avoidant'] += 2;
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
    // If anxious and avoidant are tied and high, it's likely fearful-avoidant
    if (styleScores.anxious === styleScores.avoidant && 
        styleScores.anxious > 0) {
      return 'fearful-avoidant';
    }
    
    // Prioritize more specific styles over general ones
    const priorityOrder = ['fearful-avoidant', 'secure', 'anxious', 'avoidant'];
    for (const style of priorityOrder) {
      if (topStyles.some(([s]) => s === style)) {
        return style;
      }
    }
  }
  
  return topStyles[0][0];
}