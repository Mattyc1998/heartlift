// Temporarily disabled due to build issues - will fix later
// This function handles password reset emails
/*
import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
// Temporarily comment out problematic import
// import { renderAsync } from 'npm:@react-email/components@0.0.22'
// import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_PASSWORD_RESET_HOOK_SECRET') as string
*/

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
    error: 'Password reset temporarily disabled - contact support' 
  }), {
    status: 501,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})