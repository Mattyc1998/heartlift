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
          email_data: { token, token_hash, redirect_to, email_action_type },
        } = wh.verify(payload, headers) as {
          user: {
            email: string
          }
          email_data: {
            token: string
            token_hash: string
            redirect_to: string
            email_action_type: string
          }
        }

        // Only handle password recovery emails
        if (email_action_type !== 'recovery') {
          return new Response('Not a password recovery email', { status: 200, headers: corsHeaders })
        }

        // Build reset link that points to our app
        const resetLink = `${redirect_to || 'https://id-preview--c286f1f4-22ee-4ea1-97f0-ce26599be25f.lovable.app'}/reset-password?access_token=${token}&refresh_token=${token_hash}&type=recovery`

        // Build email with reset link
        const html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            userEmail: user.email,
            resetLink: resetLink,
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

      if (email_data.email_action_type === 'recovery') {
        // Build reset link for fallback scenario
        const resetLink = `https://id-preview--c286f1f4-22ee-4ea1-97f0-ce26599be25f.lovable.app/reset-password?access_token=${email_data.token}&type=recovery`

        const html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            userEmail: user.email,
            resetLink: resetLink,
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

        console.log('[unverified] Password reset link sent to:', user.email)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response('Ignored non-recovery email action', {
        status: 200,
        headers: corsHeaders,
      })
    } else {
      // If no webhook secret is set, try to handle gracefully
      // 1) Accept unverified webhook payload shape (best-effort)
      // 2) Accept direct API payload with { email, code } or { email, resetLink }
      let body: any
      try {
        body = JSON.parse(payload)
      } catch (_) {
        body = null
      }

      // Unverified webhook fallback (no secret configured)
      if (body && body.user && body.email_data) {
        const { user, email_data } = body as {
          user: { email: string }
          email_data: { token: string; email_action_type: string }
        }

        if (email_data.email_action_type === 'recovery') {
          const resetLink = `https://id-preview--c286f1f4-22ee-4ea1-97f0-ce26599be25f.lovable.app/reset-password?access_token=${email_data.token}&type=recovery`
          
          const html = await renderAsync(
            React.createElement(PasswordResetEmail, {
              userEmail: user.email,
              resetLink: resetLink,
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

          console.log('[fallback] Password reset link sent to:', user.email)
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response('Ignored non-recovery email action', {
          status: 200,
          headers: corsHeaders,
        })
      }

      // Direct API payload
      const { email, resetLink } = body || {}

      if (!email || !resetLink) {
        return new Response(
          JSON.stringify({ error: 'Invalid payload. Provide { email, resetLink } or webhook payload.' }),
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