import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Text-to-speech function called')
    const { text, voice = 'alloy' } = await req.json()
    console.log('Request parsed, text length:', text?.length, 'voice:', voice)

    // Comprehensive input validation
    if (!text || typeof text !== 'string') {
      throw new Error('VALIDATION_ERROR');
    }
    
    if (text.length < 1 || text.length > 4096) {
      throw new Error('VALIDATION_ERROR');
    }
    
    // Validate voice parameter
    const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (voice && !allowedVoices.includes(voice)) {
      throw new Error('VALIDATION_ERROR');
    }
    
    // Sanitize text - remove control characters
    const sanitizedText = text.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Use sanitized text with length limit
    const maxLength = 3000
    const processedText = sanitizedText.length > maxLength 
      ? sanitizedText.substring(0, maxLength) + '.' 
      : sanitizedText;

    console.log('Processed text length:', processedText.length)

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not found')
      throw new Error('Configuration error');
    }

    console.log('Making request to OpenAI API...')
    
    const requestBody = {
      model: 'tts-1',
      input: processedText,
      voice: voice,
      response_format: 'mp3',
    }

    // Generate speech from text using OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('OpenAI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Converting audio to base64...')
    
    try {
      // Convert audio buffer to base64
      const arrayBuffer = await response.arrayBuffer()
      console.log('Audio buffer size:', arrayBuffer.byteLength)
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio buffer received')
      }
      
      // Use a more memory-efficient approach for base64 conversion
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ''
      const chunkSize = 32768 // Process in chunks to avoid memory issues
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }
      
      const base64Audio = btoa(binaryString)
      console.log('Base64 audio length:', base64Audio.length)

      return new Response(
        JSON.stringify({ audio: base64Audio }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (conversionError) {
      console.error('Audio conversion error:', conversionError)
      return new Response(
        JSON.stringify({ error: `Audio conversion failed: ${(conversionError as Error).message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('[TEXT-TO-SPEECH-ERROR]', error) // Log server-side only
    
    const errorMessage = (error as Error).message;
    let statusCode = 500;
    let clientError = 'An error occurred generating audio.';
    
    if (errorMessage === 'VALIDATION_ERROR') {
      statusCode = 400;
      clientError = 'Invalid input provided.';
    } else if (errorMessage === 'Configuration error') {
      statusCode = 500;
      clientError = 'Service configuration error.';
    }
    
    return new Response(
      JSON.stringify({ error: clientError }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})