import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupVerificationEmail } from './_templates/signup-verification.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_SIGNUP_VERIFICATION_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // If we have a webhook secret, verify the webhook
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      try {
        const {
          user,
          email_data: { token, email_action_type },
        } = wh.verify(payload, headers) as {
          user: {
            email: string
          }
          email_data: {
            token: string
            email_action_type: string
          }
        }

        // Only handle signup confirmation emails
        if (email_action_type !== 'signup') {
          return new Response('Not a signup confirmation email', { status: 200, headers: corsHeaders })
        }

        // Build email with 6-digit code
        const html = await renderAsync(
          React.createElement(SignupVerificationEmail, {
            userEmail: user.email,
            verificationCode: token,
          })
        )

        const { error } = await resend.emails.send({
          from: 'HeartWise <noreply@resend.dev>',
          to: [user.email],
          subject: 'Verify your HeartWise email',
          html,
        })

        if (error) {
          console.error('Resend error:', error)
          throw error
        }

        console.log('Signup verification email sent successfully to:', user.email)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Webhook verification failed:', error)
        // Fall through to unverified handling
      }
    }
    
    // Handle unverified webhook payload (fallback when webhook secret verification fails)
    let body: any
    try {
      body = JSON.parse(payload)
    } catch (_) {
      return new Response('Invalid JSON payload', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Check if this is a webhook payload structure
    if (body && body.user && body.email_data) {
      const { user, email_data } = body as {
        user: { email: string }
        email_data: { token: string; email_action_type: string }
      }

      if (email_data.email_action_type === 'signup') {
        const html = await renderAsync(
          React.createElement(SignupVerificationEmail, {
            userEmail: user.email,
            verificationCode: email_data.token,
          })
        )

        const { error } = await resend.emails.send({
          from: 'HeartWise <noreply@resend.dev>',
          to: [user.email],
          subject: 'Verify your HeartWise email',
          html,
        })

        if (error) {
          console.error('Resend error:', error)
          throw error
        }

        console.log('[unverified] Signup verification code sent to:', user.email)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response('Ignored non-signup email action', {
        status: 200,
        headers: corsHeaders,
      })
    }

    return new Response(
      JSON.stringify({ error: 'Invalid payload format' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in send-signup-verification function:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: error.message || 'Internal server error',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})