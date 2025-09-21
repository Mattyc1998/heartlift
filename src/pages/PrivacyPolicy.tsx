import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, MessageSquare, AlertTriangle } from "lucide-react";
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
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Data Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data Storage & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                HeartLift uses <strong>Supabase</strong>, a secure cloud database platform, to store and manage your data. 
                Your information is stored on secure servers with enterprise-grade security measures.
              </p>
              <div className="space-y-2">
                <p><strong>Data Location:</strong> Your data is stored in secure data centers with full encryption both in transit and at rest.</p>
                <p><strong>Security:</strong> We implement industry-standard security practices including SSL encryption, secure authentication, and regular security audits.</p>
                <p><strong>Access Control:</strong> Only you have access to your personal data through secure authentication. Our system uses Row Level Security (RLS) to ensure your data remains private.</p>
              </div>
            </CardContent>
          </Card>

          {/* Chat Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chat & Conversation Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                When you chat with our AI coaches, your conversations are securely stored to provide continuity and personalised support across sessions.
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">What we store:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Your messages and coach responses</li>
                    <li>Conversation timestamps</li>
                    <li>Selected coach preferences</li>
                    <li>Mood tracking data and insights</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How we protect it:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All conversations are encrypted and tied to your secure user account</li>
                    <li>Chat data is never shared with third parties</li>
                    <li>You can delete your conversation history at any time</li>
                    <li>Data is automatically anonymized for system improvements (no personally identifiable information retained)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coach Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Important Safety Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-amber-600">
                Our AI coaches are designed to provide emotional support and relationship guidance, but they have important limitations:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-amber-800">Our coaches will NOT provide advice or support for:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-amber-700">
                  <li><strong>Suicide or self-harm:</strong> If you're having thoughts of suicide or self-harm, please contact emergency services immediately or call a crisis helpline</li>
                  <li><strong>Drug or substance abuse:</strong> For addiction support, please consult with healthcare professionals or addiction specialists</li>
                  <li><strong>Domestic abuse or violence:</strong> If you're experiencing abuse, please contact local authorities or domestic violence support services</li>
                  <li><strong>Child abuse:</strong> Any concerns about child safety should be reported to appropriate authorities immediately</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-800">Emergency Resources:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>UK Emergency:</strong> 999</li>
                  <li><strong>Samaritans (24/7):</strong> 116 123</li>
                  <li><strong>National Domestic Abuse Helpline:</strong> 0808 2000 247</li>
                  <li><strong>Childline:</strong> 0800 1111</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Data Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have full control over your personal data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Access:</strong> Request a copy of all your stored data</li>
                <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data</li>
                <li><strong>Portability:</strong> Export your data in a readable format</li>
                <li><strong>Correction:</strong> Update or correct any inaccurate information</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a 
                  href="mailto:support@heart-lift.com"
                  className="text-primary hover:text-primary/80 underline"
                >
                  support@heart-lift.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you have any questions about this Privacy Policy or how we handle your data, 
                please don't hesitate to contact us:
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