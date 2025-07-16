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

    const prompts = {
      closure: `Generate a mature, dignified closure message for someone ending a ${relationship} relationship. The message should be respectful, clear, and provide emotional closure without blame.`,
      
      no_contact: `Generate a polite but firm no-contact message for someone who needs boundaries with their ex-${relationship}. Should be kind but clear about the boundary.`,
      
      boundary: `Generate a message that sets healthy boundaries with an ex-${relationship}. Should be respectful but firm about limits and expectations.`,
      
      miss_you_response: `Generate a thoughtful response to "I miss you" from an ex-${relationship}. Should acknowledge the feeling while maintaining appropriate boundaries based on the situation.`,
      
      custom: `Help rewrite this message to be more emotionally intelligent and effective in a ${relationship} context: "${userMessage}"`
    };

    const systemPrompt = `You are a relationship communication expert. Generate messages that are:
    - Emotionally mature and self-aware
    - Clear and direct but kind
    - Focused on healthy boundaries
    - Non-manipulative and honest
    - Appropriate for the relationship context
    
    Provide 3 different options with varying tones (gentle, neutral, firm).`;

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
          { role: 'user', content: prompts[messageType] || prompts.custom }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const suggestions = aiData.choices[0].message.content;

    // Parse the response to extract the 3 options
    const lines = suggestions.split('\n').filter(line => line.trim());
    const options = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\d+\.|Option \d+|Gentle:|Neutral:|Firm:/)) {
        options.push({
          tone: extractTone(lines[i]),
          message: lines[i].replace(/^\d+\.\s*|Option \d+:\s*|Gentle:\s*|Neutral:\s*|Firm:\s*/i, '').trim()
        });
      }
    }

    // If parsing failed, provide default structure
    if (options.length === 0) {
      options.push({
        tone: 'balanced',
        message: suggestions.trim()
      });
    }

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

function extractTone(line: string): string {
  if (line.toLowerCase().includes('gentle')) return 'gentle';
  if (line.toLowerCase().includes('firm')) return 'firm';
  if (line.toLowerCase().includes('neutral')) return 'neutral';
  return 'balanced';
}