import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  verificationCode: string
  userEmail: string
}

export const PasswordResetEmail = ({
  verificationCode,
  userEmail,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your HeartLift password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hello,
        </Text>
        
        <Text style={text}>
          We received a request to reset the password for your HeartLift account ({userEmail}).
        </Text>
        
        <Text style={text}>
          Enter this verification code in the app to reset your password:
        </Text>
        
        <Section style={codeSection}>
          <Text style={codeText}>{verificationCode}</Text>
        </Section>
        
        <Text style={smallText}>
          This code will expire in 1 hour for security purposes.
        </Text>
        
        <Text style={text}>
          If you didn't request a password reset, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          Best regards,
          <br />
          The HeartLift Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
}

const codeSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  border: '2px solid #e91e63',
}

const codeText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#e91e63',
  letterSpacing: '4px',
  margin: '0',
  fontFamily: 'monospace',
}
