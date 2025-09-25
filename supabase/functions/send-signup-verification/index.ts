// Temporarily disabled due to build issues - will fix later
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Temporarily return not implemented
  return new Response(JSON.stringify({ 
    error: 'Signup verification temporarily disabled - contact support' 
  }), {
    status: 501,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})