import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, MessageSquare, AlertTriangle, User, Lock, Globe, Calendar, Cookie, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <div className="space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-lg">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">HeartLift Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Your privacy and emotional wellbeing are our top priorities
            </p>
            <p className="text-sm text-muted-foreground">
              Effective Date: 29/10/2025 | Last Updated: 29/10/2025
            </p>
          </div>

          {/* Data We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Name, email, and password (stored via Supabase authentication)</li>
                    <li>User preferences and selected AI coach</li>
                    <li>Premium subscription status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Chat & Conversation Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Your messages and AI coach responses (stored in Supabase)</li>
                    <li>Conversation timestamps and session IDs</li>
                    <li>Selected coach preferences and conversation history</li>
                    <li>Messages persist across sessions until you refresh or start a new day</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Daily Reflections & Personal Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Daily reflection entries (stored in MongoDB)</li>
                    <li>Coaches chatted with, conversation ratings, helpful moments, areas for improvement</li>
                    <li>Used by AI coaches to personalize future conversations</li>
                    <li>You can view and access all past reflections anytime</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Quiz & Assessment Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Attachment style quiz responses and results (stored in Supabase)</li>
                    <li>Quiz analysis, attachment style classifications, and personalized recommendations</li>
                    <li>Quiz completion dates and historical results</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Tracking Data (Free Users)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Daily message count to enforce 10 message limit (stored in MongoDB)</li>
                    <li>Automatically resets at midnight UTC</li>
                    <li>Retained for 7 days, then automatically deleted</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technical Data</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Device information, operating system, app version</li>
                    <li>IP address and usage analytics (for improving service)</li>
                    <li>Error logs and performance metrics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Provide personalised AI coaching:</strong> Your daily reflections are accessed by AI coaches to tailor conversations to what you want to explore and work on</li>
                <li><strong>Track attachment styles:</strong> Quiz results help provide personalized insights and recommendations</li>
                <li><strong>Enforce usage limits:</strong> Track message counts for free users (10 messages/day, resets at midnight UTC)</li>
                <li><strong>Improve our app and AI systems:</strong> Only anonymized data is used for service improvements</li>
                <li><strong>Communicate important updates:</strong> Security alerts, policy changes, and feature announcements</li>
                <li><strong>Provide crisis support:</strong> AI coaches detect sensitive topics and redirect to appropriate helplines (UK Samaritans, National Domestic Abuse Helpline, etc.)</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="font-semibold text-amber-800">Important Note on Personalization:</p>
                <p className="text-sm text-amber-700 mt-2">
                  When you fill out daily reflections, your AI coaches can access your last 3 reflections to personalize 
                  conversations based on what you want to explore. This helps coaches naturally weave in topics you're 
                  working on without you having to repeat yourself.
                </p>
              </div>
              <p className="font-semibold text-primary mt-4">
                Your chat data and reflections will NEVER be shared with third parties, sold, or used for advertising.
              </p>
            </CardContent>
          </Card>

          {/* Data Storage & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data Storage & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p><strong>Platform:</strong> We use Supabase, a secure cloud database, to store and manage data.</p>
                <p><strong>Encryption:</strong> Data is encrypted both in transit and at rest.</p>
                <p><strong>Access Control:</strong> Only you can access your account via secure authentication. Row Level Security (RLS) ensures data privacy.</p>
                <p><strong>Password Protection:</strong> Leaked password protection is enabled to prevent the use of compromised passwords.</p>
                <p><strong>Security Practices:</strong> SSL encryption, secure authentication, and regular security audits.</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Chat & mood data:</strong> Retained 12–24 months to allow continuity and mood tracking. After this period, data is either deleted or anonymized for system improvement.</p>
              <p><strong>Account information:</strong> Retained until you delete your account. After deletion, all personal data is permanently removed within 30 days.</p>
              <p><strong>Technical & analytics data:</strong> Retained 6–12 months, anonymized where possible.</p>
              <p className="font-semibold text-primary mt-4">
                Users can request deletion of any data at any time.
              </p>
            </CardContent>
          </Card>

          {/* International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                By using HeartLift, you consent to your data being stored and processed in the United Kingdom, 
                which may have different data protection laws than your location.
              </p>
            </CardContent>
          </Card>

          {/* Age Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Age Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                HeartLift is intended for users <strong>13 years and older</strong>. We do not knowingly collect 
                personal data from children under 13.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have full control over your personal data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Access:</strong> Request a copy of your stored data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and all data</li>
                <li><strong>Portability:</strong> Export your data in a readable format</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                To exercise these rights, contact us at{" "}
                <a 
                  href="mailto:support@heart-lift.com"
                  className="text-primary hover:text-primary/80 underline"
                >
                  support@heart-lift.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Sensitive Data & Safety */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Sensitive Data & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">
                Our AI coaches provide guidance but cannot replace professional help. They do NOT provide support for:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="list-disc pl-6 space-y-1 text-sm text-amber-700">
                  <li>Suicide or self-harm</li>
                  <li>Drug or substance abuse</li>
                  <li>Domestic abuse or violence</li>
                  <li>Child abuse</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-800">Emergency Resources (UK):</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>999</strong> for emergencies</li>
                  <li><strong>Samaritans:</strong> 116 123</li>
                  <li><strong>National Domestic Abuse Helpline:</strong> 0808 2000 247</li>
                  <li><strong>Childline:</strong> 0800 1111</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookies & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-primary" />
                Cookies & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We may use cookies and analytics to improve your experience. This data is anonymized and 
                cannot identify you personally.
              </p>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We may update this Privacy Policy occasionally. Significant changes will be communicated via 
                in-app notifications or email. We encourage you to review this page periodically.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                For questions about this Privacy Policy or your data:
              </p>
              <p className="mt-2">
                <strong>Email:</strong>{" "}
                <a 
                  href="mailto:support@heart-lift.com"
                  className="text-primary hover:text-primary/80 underline"
                >
                  support@heart-lift.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};