import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { SignupVerificationEmail } from './_templates/signup-verification.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  try {
    const payload = await req.json()
    
    const { user, email_data } = payload as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        site_url: string
        email_action_type: string
      }
    }

    console.log('Processing email for:', user.email, 'Type:', email_data.email_action_type)

    let html: string
    let subject: string

    // Route to appropriate template based on email action type
    if (email_data.email_action_type === 'recovery') {
      // Password reset email
      html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          verificationCode: email_data.token,
          userEmail: user.email,
        })
      )
      subject = 'Reset Your HeartLift Password'
      console.log('Sending password reset email')
    } else if (email_data.email_action_type === 'signup') {
      // Signup verification email
      html = await renderAsync(
        React.createElement(SignupVerificationEmail, {
          userEmail: user.email,
          verificationCode: email_data.token,
        })
      )
      subject = 'Verify Your HeartLift Account'
      console.log('Sending signup verification email')
    } else {
      console.error('Unknown email action type:', email_data.email_action_type)
      throw new Error(`Unsupported email action type: ${email_data.email_action_type}`)
    }

    const { error } = await resend.emails.send({
      from: 'HeartLift <support@heart-lift.com>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully to:', user.email)
  } catch (error) {
    console.error('Error in send-email function:', error)
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
