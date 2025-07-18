import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, messageType, relationship, userMessage } = await req.json();

    const relationshipContext = getRelationshipContext(relationship);
    
    const prompts = {
      closure: `Generate a mature, dignified closure message for someone ending a relationship with their ${relationshipContext}. The message should be respectful, clear, and provide emotional closure without blame.`,
      
      no_contact: `Generate a polite but firm no-contact message for someone who needs boundaries with their ${relationshipContext}. Should be kind but clear about the boundary.`,
      
      boundary: `Generate a message that sets healthy boundaries with ${relationshipContext}. Should be respectful but firm about limits and expectations.`,
      
      miss_you_response: `Generate a thoughtful response to "I miss you" from ${relationshipContext}. Should acknowledge the feeling while maintaining appropriate boundaries based on the situation.`,
      
      custom: `Help rewrite this message to be more emotionally intelligent and effective in a ${relationshipContext} context: "${userMessage}"`
    };

    const systemPrompt = `You are a relationship communication expert. Generate messages that are:
    - Emotionally mature and self-aware
    - Clear and direct but kind
    - Focused on healthy boundaries
    - Non-manipulative and honest
    - Appropriate for the relationship context
    
    IMPORTANT: Always provide exactly 3 different message options with the following format:
    
    Gentle: [gentle tone message here]
    
    Neutral: [neutral tone message here]
    
    Firm: [firm tone message here]
    
    Make sure each message is complete and practical to send.`;

    const selectedPrompt = prompts[messageType as keyof typeof prompts] || prompts.custom;
    
    console.log(`Generating suggestions for ${messageType} with ${relationship} relationship`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: selectedPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.choices || !aiData.choices[0]) {
      throw new Error('Invalid response from OpenAI');
    }
    
    const suggestions = aiData.choices[0].message.content;
    console.log('Raw AI response:', suggestions);

    // Enhanced parsing to handle the specific format we requested
    const options = [];
    const lines = suggestions.split('\n').filter(line => line.trim());
    
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
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
    case 'friend': return 'ex-friend';
    case 'situationship': return 'situationship partner';
    default: return 'ex-partner';
  }
}

function generateFallbackMessages(messageType: string, relationship: string): Array<{tone: string, message: string}> {
  const relationshipContext = getRelationshipContext(relationship);
  
  const fallbacks = {
    closure: [
      { tone: 'gentle', message: `I wanted to reach out to let you know that I've been doing some thinking about us. I believe it's best for both of us if we part ways here. I wish you all the best.` },
      { tone: 'neutral', message: `After careful consideration, I think it's time for us to go our separate ways. I appreciate the time we shared together.` },
      { tone: 'firm', message: `I've decided that this relationship isn't working for me anymore. I think it's best if we end things here.` }
    ],
    no_contact: [
      { tone: 'gentle', message: `I appreciate you reaching out, but I think it's best if we don't communicate for now. I need some space to heal and move forward.` },
      { tone: 'neutral', message: `I've decided to take some time for myself and won't be responding to messages. Please respect this boundary.` },
      { tone: 'firm', message: `Please stop contacting me. I need space and this communication isn't helpful for either of us.` }
    ],
    boundary: [
      { tone: 'gentle', message: `I care about you, but I need to set some boundaries for my own wellbeing. Please respect my need for space.` },
      { tone: 'neutral', message: `I need to establish some clear boundaries between us. Please respect these limits going forward.` },
      { tone: 'firm', message: `I'm setting a clear boundary: please stop contacting me. This is what I need right now.` }
    ],
    miss_you_response: [
      { tone: 'gentle', message: `I understand that feeling, and part of me misses what we had too. But I think it's important we both focus on moving forward.` },
      { tone: 'neutral', message: `I appreciate you sharing that with me. I think it's best if we both focus on our own healing right now.` },
      { tone: 'firm', message: `I understand you miss me, but reaching out like this isn't helpful for either of us. Please respect my boundaries.` }
    ],
    custom: [
      { tone: 'gentle', message: `I hear what you're saying and I want to respond thoughtfully. Let me take some time to process this.` },
      { tone: 'neutral', message: `Thank you for sharing that with me. I appreciate your honesty.` },
      { tone: 'firm', message: `I need to be direct with you about how I'm feeling right now.` }
    ]
  };
  
  return fallbacks[messageType as keyof typeof fallbacks] || fallbacks.custom;
}