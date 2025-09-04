import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SignupVerificationEmailProps {
  userEmail: string
  verificationCode: string
}

export const SignupVerificationEmail = ({
  userEmail,
  verificationCode,
}: SignupVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your HeartWise account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>💖 HeartWise</Text>
        </Section>
        
        <Section style={content}>
          <Heading style={h1}>Verify Your Email</Heading>
          
          <Text style={text}>
            Hi there! Welcome to HeartWise. To complete your account setup and start your healing journey, please verify your email address using the code below:
          </Text>
          
          <Section style={codeContainer}>
            <Text style={codeText}>{verificationCode}</Text>
          </Section>
          
          <Text style={text}>
            Enter this 6-digit code in the verification page to activate your account.
          </Text>
          
          <Text style={text}>
            This code will expire in 24 hours. If you didn't create an account with HeartWise, you can safely ignore this email.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            With love,<br />
            The HeartWise Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupVerificationEmail

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 0',
  textAlign: 'center' as const,
}

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
}

const content = {
  padding: '0 48px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const codeContainer = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  margin: '32px 0',
  padding: '24px',
  textAlign: 'center' as const,
}

const codeText = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'monospace',
}

const footer = {
  padding: '32px 48px 0',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}