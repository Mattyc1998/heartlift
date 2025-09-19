import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-background via-muted to-secondary">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="gentle"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-gentle">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using HeartLift ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p>
                HeartLift provides relationship wellbeing coaching and emotional support tools. Our service includes:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI-powered relationship wellbeing coaching</li>
                <li>Emotional wellness tools and resources</li>
                <li>Personalized insights and guidance</li>
                <li>Premium features for subscribers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Service Limitations</h2>
              <p className="font-medium text-foreground">
                IMPORTANT: Our relationship wellbeing coaches are NOT licensed therapists and do NOT provide support for:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-destructive font-medium">
                <li>Suicide ideation or self-harm</li>
                <li>Child abuse or child safety concerns</li>
                <li>Domestic violence or abuse situations</li>
                <li>Drug or substance abuse issues</li>
                <li>Clinical mental health conditions requiring professional treatment</li>
              </ul>
              <p className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <strong>Crisis Situations:</strong> If you are experiencing any of the above situations, please contact emergency services immediately (999 in the UK, 911 in the US) or appropriate crisis helplines such as NSPCC (0808 800 5000) for child abuse concerns.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate and truthful information</li>
                <li>Use the service for its intended purpose</li>
                <li>Not engage in harmful, abusive, or inappropriate behavior</li>
                <li>Respect the limitations of our service</li>
                <li>Seek appropriate professional help when needed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Payment and Subscriptions</h2>
              <p>
                Premium features require a paid subscription. Payments are processed securely through Stripe. 
                You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of HeartLift are owned by us and are protected by copyright, 
                trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p>
                HeartLift provides guidance and support tools but is not a substitute for professional medical, 
                psychological, or therapeutic treatment. We are not liable for any decisions made based on our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at our discretion, without notice, 
                for conduct that we believe violates these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be posted on this page 
                with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:support@heart-lift.com" className="text-primary hover:underline">
                  support@heart-lift.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}