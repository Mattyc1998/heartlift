import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_PASSWORD_RESET_HOOK_SECRET') as string

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
          email_data: { token_hash, redirect_to, email_action_type },
        } = wh.verify(payload, headers) as {
          user: {
            email: string
          }
          email_data: {
            token_hash: string
            redirect_to: string
            email_action_type: string
          }
        }

        // Only handle password recovery emails
        if (email_action_type !== 'recovery') {
          return new Response('Not a password recovery email', { status: 200, headers: corsHeaders })
        }

        const resetLink = `${redirect_to}password-reset?token=${token_hash}&type=recovery`

        const html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetLink,
            userEmail: user.email,
          })
        )

        const { error } = await resend.emails.send({
          from: 'HeartWise <noreply@resend.dev>',
          to: [user.email],
          subject: 'Reset your HeartWise password',
          html,
        })

        if (error) {
          console.error('Resend error:', error)
          throw error
        }

        console.log('Password reset email sent successfully to:', user.email)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Webhook verification failed:', error)
        return new Response(
          JSON.stringify({
            error: {
              http_code: 401,
              message: 'Webhook verification failed',
            },
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      // If no webhook secret is set, handle as a direct API call
      const body = JSON.parse(payload)
      const { email, resetLink } = body

      if (!email || !resetLink) {
        return new Response(
          JSON.stringify({ error: 'Email and resetLink are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          resetLink,
          userEmail: email,
        })
      )

      const { error } = await resend.emails.send({
        from: 'HeartWise <noreply@resend.dev>',
        to: [email],
        subject: 'Reset your HeartWise password',
        html,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log('Password reset email sent successfully to:', email)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error in send-password-reset function:', error)
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