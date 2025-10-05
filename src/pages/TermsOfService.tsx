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
              Last updated: 05/10/2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using HeartLift ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p>
                HeartLift provides relationship wellbeing tools and AI-powered coaching experiences to support users with relationships, 
                breakups, and emotional growth. Features may include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI-powered relationship and emotional wellbeing coaching</li>
                <li>Personalised insights and self-reflection tools</li>
                <li>Emotional wellness resources</li>
                <li>Optional premium features for subscribers</li>
              </ul>
              <p className="mt-3 font-medium text-foreground">
                <strong>Important:</strong> HeartLift's AI coaches are virtual wellbeing companions. They are not licensed therapists 
                or medical professionals. All guidance is for informational and self-development purposes only and should not be 
                considered therapy, counselling, or medical advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Service Limitations and Crisis Support</h2>
              <p className="font-medium text-foreground">
                HeartLift does not provide professional mental health or crisis support. Our AI coaches cannot and do not assist with:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-destructive font-medium">
                <li>Suicide ideation or self-harm</li>
                <li>Child abuse or child safety concerns</li>
                <li>Domestic violence or abuse situations</li>
                <li>Drug or substance misuse</li>
                <li>Clinical mental health conditions requiring treatment</li>
              </ul>
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mt-3">
                <p className="font-semibold mb-2">If you are in crisis or feel unsafe, please do not use HeartLift. Instead, contact your local emergency services or a trusted helpline:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>UK:</strong> 999 (Emergency Services) / Samaritans at 116 123</li>
                  <li><strong>US:</strong> 911 (Emergency Services) / 988 Suicide & Crisis Lifeline (988)</li>
                  <li><strong>Child Protection (UK):</strong> NSPCC – 0808 800 5000</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate, truthful information when using the Service</li>
                <li>Use HeartLift only for lawful, personal, and non-commercial purposes</li>
                <li>Avoid harmful, abusive, or inappropriate behavior</li>
                <li>Respect the limits of our AI wellbeing tools</li>
                <li>Seek professional help when needed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Eligibility</h2>
              <p>
                You must be at least 13 years old to use HeartLift. By using the Service, you confirm that you meet this age requirement.
              </p>
              <p className="mt-2">
                HeartLift is not directed at children under 13, and we do not knowingly collect personal data from anyone under this age. 
                If we become aware that a user under 13 has registered, we will take steps to delete their information promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Payment and Subscriptions</h2>
              <p>
                Certain features of HeartLift require a paid subscription. Payments are securely processed through Apple's In-App Purchase (IAP) system.
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Subscriptions automatically renew unless cancelled at least 24 hours before renewal.</li>
                <li>Renewal charges are applied within 24 hours prior to the end of the current billing period.</li>
                <li>You may manage or cancel your subscription at any time in your device's App Store settings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <p>
                All content, features, designs, and functionality of HeartLift are owned by us or our licensors and are protected by copyright, 
                trademark, and other intellectual property laws. You may not reproduce, distribute, or modify any part of the Service without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p>
                HeartLift provides wellbeing guidance and digital support tools. We make no guarantees regarding accuracy or outcomes 
                and are not liable for any loss, harm, or decision made based on the information provided.
              </p>
              <p className="mt-2">
                The Service is provided "as is" and "as available," without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account, at our discretion and without notice, 
                if you violate these Terms or misuse the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. The latest version will always be posted on this page 
                with a revised "last updated" date. Continued use of the Service after changes are posted constitutes 
                acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the United Kingdom, 
                without regard to its conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
              <p>
                For questions, feedback, or support, please contact us at:{' '}
                <a href="mailto:support@heartliftapp.com" className="text-primary hover:underline">
                  support@heartliftapp.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}