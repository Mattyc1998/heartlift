import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Text-to-speech function called')
    const { text, voice = 'nova' } = await req.json()
    console.log('Request parsed, text length:', text?.length, 'voice:', voice)

    if (!text) {
      console.log('No text provided')
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // OpenAI TTS has a 4096 character limit
    const maxLength = 3000 // Even more conservative limit
    let processedText = text
    
    if (text.length > maxLength) {
      console.log('Text too long, truncating from', text.length, 'to', maxLength)
      processedText = text.substring(0, maxLength) + '.'
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not found')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Making request to OpenAI API...')
    
    const requestBody = {
      model: 'tts-1',
      input: processedText,
      voice: voice,
      response_format: 'mp3',
    }
    console.log('Request body:', JSON.stringify(requestBody))

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
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${(error as Error).message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})