import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_PASSWORD_RESET_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const { user, email_data } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        site_url: string
      }
    }

    console.log('Processing password reset for:', user.email)

    const resetLink = `${email_data.site_url}/password-reset-form?token_hash=${email_data.token_hash}&type=recovery`

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetLink,
        userEmail: user.email,
      })
    )

    const { error } = await resend.emails.send({
      from: 'HeartLift <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Reset Your HeartLift Password',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Password reset email sent successfully to:', user.email)
  } catch (error) {
    console.error('Error in send-password-reset function:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})