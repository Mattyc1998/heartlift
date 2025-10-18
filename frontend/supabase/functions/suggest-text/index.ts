import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS configuration
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
    const { messageType, relationship, userMessage } = await req.json();
    
    // Input validation
    if (!messageType || typeof messageType !== 'string' || messageType.length > 100) {
      throw new Error('VALIDATION_ERROR');
    }
    
    if (!relationship || typeof relationship !== 'string' || relationship.length > 100) {
      throw new Error('VALIDATION_ERROR');
    }
    
    // Sanitize userMessage if provided
    let sanitizedUserMessage = '';
    if (userMessage) {
      if (typeof userMessage !== 'string' || userMessage.length > 2000) {
        throw new Error('VALIDATION_ERROR');
      }
      sanitizedUserMessage = userMessage.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    const relationshipContext = getRelationshipContext(relationship);
    
    // Create more specific prompts based on message type and relationship
    const prompts = {
      closure: `Generate 3 mature, dignified closure messages for someone ending things with their ${relationshipContext}. Each should be respectful, clear, and provide emotional closure without blame. Match the formality to the relationship type.`,
      
      no_contact: `Generate 3 polite but firm no-contact messages for someone who needs boundaries with their ${relationshipContext}. Should be kind but absolutely clear about the boundary.`,
      
      boundary: `Generate 3 messages that set healthy boundaries with ${relationshipContext}. Should be respectful but firm about limits and expectations for this specific relationship type.`,
      
      miss_you_response: `Generate 3 thoughtful responses to "I miss you" from ${relationshipContext}. Should acknowledge the feeling while maintaining appropriate boundaries for this relationship stage.`,
      
      apologetic: `Generate 3 sincere apology messages for ${relationshipContext}. Should take responsibility without being overly dramatic or manipulative.`,
      
      rejection: `Generate 3 kind but clear rejection messages for ${relationshipContext}. Should be honest while preserving dignity for both parties.`,
      
      reconciliation: `Generate 3 thoughtful reconciliation attempt messages for ${relationshipContext}. Should be genuine and acknowledge what went wrong without being desperate.`,
      
      angry_response: `Generate 3 messages for responding when upset with ${relationshipContext}. Should express feelings without being destructive or hurtful.`,
      
      moving_on: `Generate 3 messages expressing that you're moving on from ${relationshipContext}. Should be mature and final without being cruel.`,
      
      check_in: `Generate 3 casual check-in messages for ${relationshipContext}. Should be friendly but appropriate for the current relationship status.`,
      
      birthday_holiday: `Generate 3 birthday/holiday messages for ${relationshipContext}. Should be warm but respect current boundaries and relationship status.`,
      
      neutral_reply: `Generate 3 neutral response messages for ${relationshipContext}. Should acknowledge their message without escalating or encouraging further contact.`,
      
      custom: `Help rewrite this message to be more emotionally intelligent and effective in a ${relationshipContext} context: "${sanitizedUserMessage}". Provide 3 different versions with different tones.`
    };

    const systemPrompt = `You are a relationship communication expert specializing in ${relationshipContext} dynamics. Generate messages that are:
    - Emotionally mature and self-aware
    - Appropriate for the specific relationship type and stage
    - Clear and direct but kind
    - Focused on healthy boundaries
    - Non-manipulative and honest
    - Contextually appropriate (formal for exes, casual for talking stage, etc.)
    
    CRITICAL: Respond with EXACTLY this format (no extra text, no explanations):
    
    Gentle: [Complete message here]
    
    Neutral: [Complete message here]
    
    Firm: [Complete message here]
    
    Each message must be complete, practical, and ready to send. Match the tone and formality to the relationship type.`;

    const selectedPrompt = prompts[messageType as keyof typeof prompts] || prompts.custom;
    
    console.log(`Generating suggestions for ${messageType} with ${relationship} relationship`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: selectedPrompt }
        ],
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.choices || !aiData.choices[0]) {
      throw new Error('Invalid response from AI');
    }
    
    const suggestions = aiData.choices[0].message.content;
    console.log('Raw AI response:', suggestions);

    // Enhanced parsing to handle the specific format we requested
    const options = [];
    const lines = suggestions.split('\n').filter((line: string) => line.trim());
    
    let currentTone = '';
    let currentMessage = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^(Gentle|Neutral|Firm):/i)) {
        // Save previous message if exists
        if (currentTone && currentMessage) {
          options.push({
            tone: currentTone.toLowerCase(),
            message: currentMessage.trim()
          });
        }
        // Start new message
        currentTone = trimmed.split(':')[0].toLowerCase();
        currentMessage = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      } else if (currentTone && trimmed) {
        // Continue building current message
        currentMessage += ' ' + trimmed;
      }
    }
    
    // Add the last message
    if (currentTone && currentMessage) {
      options.push({
        tone: currentTone.toLowerCase(),
        message: currentMessage.trim()
      });
    }

    // Fallback: if parsing failed, provide default suggestions
    if (options.length === 0) {
      console.log('Parsing failed, using fallback');
      const fallbackMessages = generateFallbackMessages(messageType, relationship);
      options.push(...fallbackMessages);
    }

    console.log('Final options:', options);

    return new Response(JSON.stringify({ suggestions: options }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SUGGEST-TEXT-ERROR]', error); // Log server-side only
    
    const errorMessage = (error as Error).message;
    let statusCode = 500;
    let clientError = 'An error occurred generating suggestions.';
    
    if (errorMessage === 'VALIDATION_ERROR') {
      statusCode = 400;
      clientError = 'Invalid input provided.';
    }
    
    return new Response(JSON.stringify({ 
      error: clientError 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getRelationshipContext(relationship: string): string {
  switch (relationship) {
    case 'romantic': return 'ex-partner';
    case 'boyfriend': return 'boyfriend';
    case 'girlfriend': return 'girlfriend'; 
    case 'dating': return 'someone you dated';
    case 'talking_stage': return 'someone in the talking stage';
    case 'friend': return 'ex-friend';
    case 'situationship': return 'situationship partner';
    case 'fwb': return 'friends with benefits';
    case 'hookup': return 'casual hookup';
    default: return 'ex-partner';
  }
}

function generateFallbackMessages(messageType: string, relationship: string): Array<{tone: string, message: string}> {
  const relationshipContext = getRelationshipContext(relationship);
  
  // More specific fallbacks based on relationship type
  const getMessages = (type: string) => {
    const baseMessages = {
      closure: {
        boyfriend: [
          { tone: 'gentle', message: `I've been thinking a lot about us, and I think it's time we end our relationship. You mean a lot to me, but I don't think we're right for each other anymore.` },
          { tone: 'neutral', message: `I think we need to break up. This relationship isn't working for me anymore, and I believe it's best for both of us.` },
          { tone: 'firm', message: `I'm ending our relationship. This isn't working for me, and I don't want to continue dating.` }
        ],
        girlfriend: [
          { tone: 'gentle', message: `I care about you deeply, but I think we should end our relationship. We want different things, and I think it's better if we both move on.` },
          { tone: 'neutral', message: `I think we should break up. I don't see this working long-term, and I think it's better to end things now.` },
          { tone: 'firm', message: `I'm breaking up with you. This relationship isn't what I want anymore.` }
        ],
        talking_stage: [
          { tone: 'gentle', message: `Hey, I've enjoyed getting to know you, but I don't think we're a romantic match. I wish you the best!` },
          { tone: 'neutral', message: `I've been thinking, and I don't see this developing into something more. Take care!` },
          { tone: 'firm', message: `I don't think we should continue talking romantically. Good luck with everything.` }
        ]
      },
      no_contact: {
        boyfriend: [
          { tone: 'gentle', message: `I need some space to process everything. Please don't contact me for a while - I'll reach out when I'm ready.` },
          { tone: 'neutral', message: `I'm going no contact for now. Please respect this boundary and don't message me.` },
          { tone: 'firm', message: `Stop contacting me. I need space and this isn't helping either of us.` }
        ],
        talking_stage: [
          { tone: 'gentle', message: `I think it's best if we stop talking. I need to focus on other things right now.` },
          { tone: 'neutral', message: `I'm not interested in continuing our conversations. Please don't message me anymore.` },
          { tone: 'firm', message: `Please stop messaging me. I'm not interested in talking anymore.` }
        ]
      }
    };

    const relationshipKey = relationship === 'romantic' ? 'boyfriend' : relationship;
    return (baseMessages as any)[type]?.[relationshipKey] || (baseMessages as any)[type]?.['boyfriend'] || [
      { tone: 'gentle', message: `I appreciate you reaching out, but I think it's best if we don't communicate right now.` },
      { tone: 'neutral', message: `I need some space. Please respect this boundary.` },
      { tone: 'firm', message: `Please stop contacting me. I need space right now.` }
    ];
  };

  return getMessages(messageType);
}