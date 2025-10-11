import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS configuration - restrict to known origins
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com',
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionsAndAnswers, userId } = await req.json();

    // Comprehensive input validation
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers)) {
      throw new Error('VALIDATION_ERROR');
    }
    
    if (questionsAndAnswers.length === 0 || questionsAndAnswers.length > 50) {
      throw new Error('VALIDATION_ERROR');
    }

    // Validate and sanitize each question/answer pair
    const sanitizedQA = [];
    const sanitizedAnswers = [];
    for (const qa of questionsAndAnswers) {
      if (!qa || typeof qa !== 'object' || typeof qa.question !== 'string' || typeof qa.answer !== 'string') {
        throw new Error('VALIDATION_ERROR');
      }
      if (qa.question.length > 1000 || qa.answer.length > 1000) {
        throw new Error('VALIDATION_ERROR');
      }
      // Remove control characters and trim
      const cleanQuestion = qa.question.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      const cleanAnswer = qa.answer.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      sanitizedQA.push({ question: cleanQuestion, answer: cleanAnswer });
      sanitizedAnswers.push(cleanAnswer);
    }

    if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('VALIDATION_ERROR');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate attachment style using sanitized answers
    const attachmentStyle = calculateAttachmentStyle(sanitizedAnswers);
    
    // Generate focused analysis using OpenAI with timeout
    const styleDescriptions: Record<string, string> = {
      'secure': 'classic secure attachment with balanced view of self and others',
      'anxious': 'anxious-preoccupied attachment with fear of abandonment',
      'avoidant': 'dismissive-avoidant attachment valuing independence',
      'compassionate-connector': 'secure attachment with exceptional empathy and ability to create emotional safety',
      'independent-secure': 'secure attachment with strong emphasis on autonomy and personal space',
      'recovering-anxious': 'healing from anxious attachment patterns toward secure attachment',
      'guarded-growing': 'moving from avoidant patterns toward secure attachment',
      'relationship-focused': 'secure attachment with high investment in partnerships',
      'self-sufficient-secure': 'secure attachment with comfort in solitude and selective relationships',
      'emotionally-aware': 'secure attachment with exceptional emotional intelligence and self-awareness'
    };

    // Format questions and answers for the prompt
    const qaContext = sanitizedQA.map((qa, i) => 
      `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
    ).join('\n\n');

    const analysisPrompt = `
    You are an attachment theory expert. Based on the user's answers to today's specific questions, analyze their ${attachmentStyle} attachment style (${styleDescriptions[attachmentStyle] || 'unique attachment pattern'}).
    
    Here are the questions they answered and their responses:
    ${qaContext}
    
    Provide a concise, encouraging analysis SPECIFIC TO THESE QUESTIONS AND ANSWERS in valid JSON format only:

    {
      "detailedBreakdown": {
        "strengths": ["3-4 specific strengths based on their actual answers"],
        "challenges": ["3-4 growth areas revealed by their responses"],
        "relationshipPatterns": ["3-4 patterns evident from their answers"]
      },
      "healingPath": "Actionable healing path directly addressing patterns in their answers (100-150 words, reference specific responses)",
      "triggers": ["4-5 triggers evident from their answers"],
      "copingTechniques": [
        {
          "technique": "specific technique name",
          "description": "how it helps based on their responses",
          "example": "concrete example relevant to their answers"
        }
      ],
      "dailyPractices": [
        {
          "practice": "practice name",
          "description": "brief description addressing their specific patterns",
          "frequency": "recommended frequency"
        }
      ]
    }
    
    CRITICAL: Your analysis must be directly relevant to their specific answers. Reference what they said, don't give generic attachment style information.
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
    console.error('[ANALYZE-ATTACHMENT-ERROR]', error); // Log server-side only
    
    const errorMessage = (error as Error).message;
    let statusCode = 500;
    let clientError = 'An error occurred during analysis.';
    
    if (errorMessage === 'VALIDATION_ERROR') {
      statusCode = 400;
      clientError = 'Invalid input provided.';
    } else if (errorMessage.includes('timed out')) {
      statusCode = 504;
      clientError = 'Analysis timed out. Please try again.';
    }
    
    return new Response(JSON.stringify({ 
      error: clientError 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateAttachmentStyle(answers: string[]): string {
  const styleScores: Record<string, number> = {
    secure: 0,
    anxious: 0,
    avoidant: 0,
    'compassionate-connector': 0,
    'independent-secure': 0,
    'recovering-anxious': 0,
    'guarded-growing': 0,
    'relationship-focused': 0,
    'self-sufficient-secure': 0,
    'emotionally-aware': 0
  };

  // Sophisticated scoring across 10 attachment style variations
  answers.forEach((answer, index) => {
    const lowerAnswer = answer.toLowerCase();
    
    // Secure attachment - classic indicators
    if (lowerAnswer.includes('comfortable') && lowerAnswer.includes('express')) {
      styleScores.secure += 3;
    }
    if (lowerAnswer.includes('trust') || lowerAnswer.includes('open') || 
        lowerAnswer.includes('confident') || lowerAnswer.includes('stable')) {
      styleScores.secure += 2;
    }
    
    // Anxious attachment - fear and reassurance seeking
    if (lowerAnswer.includes('worry') || lowerAnswer.includes('anxious')) {
      styleScores.anxious += 3;
    }
    if (lowerAnswer.includes('fear') && lowerAnswer.includes('abandon') ||
        lowerAnswer.includes('reassurance') || lowerAnswer.includes('insecure')) {
      styleScores.anxious += 2;
    }
    
    // Avoidant attachment - independence and distance
    if (lowerAnswer.includes('independent') || lowerAnswer.includes('self-reliant')) {
      styleScores.avoidant += 3;
    }
    if (lowerAnswer.includes('distance') || lowerAnswer.includes('space') ||
        lowerAnswer.includes('alone') && !lowerAnswer.includes('comfortable')) {
      styleScores.avoidant += 2;
    }
    
    // Compassionate Connector - empathy and support focus
    if (lowerAnswer.includes('support') && lowerAnswer.includes('understand') ||
        lowerAnswer.includes('empathy') || lowerAnswer.includes('listen')) {
      styleScores['compassionate-connector'] += 3;
    }
    if (lowerAnswer.includes('safe') || lowerAnswer.includes('caring')) {
      styleScores['compassionate-connector'] += 1;
    }
    
    // Independent Secure - autonomy within security
    if ((lowerAnswer.includes('independent') || lowerAnswer.includes('autonomy')) && 
        (lowerAnswer.includes('comfortable') || lowerAnswer.includes('confident'))) {
      styleScores['independent-secure'] += 3;
    }
    if (lowerAnswer.includes('balance') && lowerAnswer.includes('space')) {
      styleScores['independent-secure'] += 2;
    }
    
    // Recovering Anxious - healing journey
    if (lowerAnswer.includes('working on') || lowerAnswer.includes('learning to') ||
        lowerAnswer.includes('trying to') || lowerAnswer.includes('developing')) {
      styleScores['recovering-anxious'] += 3;
    }
    if (lowerAnswer.includes('aware') && lowerAnswer.includes('patterns')) {
      styleScores['recovering-anxious'] += 2;
    }
    
    // Guarded Growing - opening from avoidance
    if (lowerAnswer.includes('gradually') || lowerAnswer.includes('slowly opening') ||
        lowerAnswer.includes('cautiously')) {
      styleScores['guarded-growing'] += 3;
    }
    if (lowerAnswer.includes('recogniz') && lowerAnswer.includes('value')) {
      styleScores['guarded-growing'] += 2;
    }
    
    // Relationship-Focused - partnership priority
    if (lowerAnswer.includes('partner') && lowerAnswer.includes('together') ||
        lowerAnswer.includes('we') || lowerAnswer.includes('us')) {
      styleScores['relationship-focused'] += 3;
    }
    if (lowerAnswer.includes('committed') || lowerAnswer.includes('quality time') ||
        lowerAnswer.includes('prioritize') && lowerAnswer.includes('relationship')) {
      styleScores['relationship-focused'] += 2;
    }
    
    // Self-Sufficient Secure - content alone
    if (lowerAnswer.includes('alone') && lowerAnswer.includes('content') ||
        lowerAnswer.includes('solitude') || lowerAnswer.includes('self-contained')) {
      styleScores['self-sufficient-secure'] += 3;
    }
    if (lowerAnswer.includes('fulfilled') && lowerAnswer.includes('own company')) {
      styleScores['self-sufficient-secure'] += 2;
    }
    
    // Emotionally Aware - high emotional intelligence
    if (lowerAnswer.includes('aware') || lowerAnswer.includes('reflect') ||
        lowerAnswer.includes('understand') && lowerAnswer.includes('emotion')) {
      styleScores['emotionally-aware'] += 3;
    }
    if (lowerAnswer.includes('intentional') || lowerAnswer.includes('mindful')) {
      styleScores['emotionally-aware'] += 2;
    }

    // Positive indicators boost multiple secure variants
    if (lowerAnswer.includes('healthy') || lowerAnswer.includes('clear boundaries')) {
      styleScores.secure += 1;
      styleScores['independent-secure'] += 1;
      styleScores['emotionally-aware'] += 1;
    }
  });

  // Find the highest scoring style
  const maxScore = Math.max(...Object.values(styleScores));
  
  // If max score is 0, default to secure
  if (maxScore === 0) return 'secure';
  
  const topStyles = Object.entries(styleScores).filter(([_, score]) => score === maxScore);
  
  // If there's a tie, use priority order
  if (topStyles.length > 1) {
    const priorityOrder = [
      'compassionate-connector',
      'emotionally-aware', 
      'secure',
      'independent-secure',
      'recovering-anxious',
      'guarded-growing',
      'relationship-focused',
      'self-sufficient-secure',
      'anxious',
      'avoidant'
    ];
    
    for (const style of priorityOrder) {
      if (topStyles.some(([s]) => s === style)) {
        return style;
      }
    }
  }
  
  return topStyles[0][0];
}