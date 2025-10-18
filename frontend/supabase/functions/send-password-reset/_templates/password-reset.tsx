import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
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
        <Section style={headerSection}>
          <div style={logoContainer}>
            <div style={heartIcon}>💝</div>
            <Heading style={title}>HeartLift</Heading>
          </div>
        </Section>

        <Section style={contentSection}>
          <Heading style={h1}>Reset Your Password</Heading>
          
          <Text style={text}>
            Hi there,
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

          <Hr style={hr} />

          <Text style={smallText}>
            If you didn't request a password reset, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footer}>
            With love and support,<br />
            The HeartLift Team
          </Text>
          <Text style={subfooter}>
            Helping you heal, one step at a time 💚
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#fef7f0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const headerSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
}

const heartIcon = {
  fontSize: '32px',
  lineHeight: '1',
}

const title = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#e91e63',
  margin: '0',
  background: 'linear-gradient(135deg, #e91e63, #f06292)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

const contentSection = {
  padding: '0 24px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const codeSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fff',
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

const hr = {
  borderColor: '#f0f0f0',
  margin: '32px 0',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
}

const linkText = {
  color: '#e91e63',
  fontSize: '14px',
  lineHeight: '22px',
  wordBreak: 'break-all' as const,
  margin: '12px 0',
}

const footerSection = {
  padding: '32px 24px 0',
  textAlign: 'center' as const,
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
}

const subfooter = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
}