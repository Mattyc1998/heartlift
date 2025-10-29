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
              Last updated: 29/10/2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-base leading-relaxed">
                By accessing or using <strong>HeartLift</strong> ("the Service"), you <strong>agree to be bound</strong> by these Terms of Service ("Terms"). 
                If you do not agree, <strong>please do not use the Service</strong>.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. Service Description</h2>
              <p className="text-base leading-relaxed mb-4">
                HeartLift provides <strong>relationship wellbeing tools</strong> and <strong>AI-powered coaching experiences</strong> to support users with relationships, 
                breakups, and emotional growth. Features may include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li className="text-base">AI-powered relationship and emotional wellbeing coaching with 4 distinct coach personalities</li>
                <li className="text-base">Daily attachment style quizzes with AI-generated questions</li>
                <li className="text-base">Personalised insights based on your daily reflections</li>
                <li className="text-base">Daily reflection tracking to help coaches personalize conversations</li>
                <li className="text-base">Conversation history that persists across sessions</li>
                <li className="text-base">Emotional wellness resources and crisis support redirection</li>
                <li className="text-base">Free tier: 10 messages per day (resets at midnight UTC)</li>
                <li className="text-base">Premium features for unlimited messaging and additional tools</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-lg mt-4">
                <p className="font-bold text-lg mb-2 text-amber-900 dark:text-amber-200">⚠️ Important Disclaimer</p>
                <p className="text-base leading-relaxed text-foreground">
                  HeartLift's AI coaches are <strong>virtual wellbeing companions</strong>. They are <strong>NOT licensed therapists 
                  or medical professionals</strong>. All guidance is for <strong>informational and self-development purposes only</strong> and should <strong>NOT be 
                  considered therapy, counselling, or medical advice</strong>.
                </p>
              </div>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. Service Limitations and Crisis Support</h2>
              <p className="font-bold text-lg text-foreground mb-3">
                ⛔ HeartLift <strong>does NOT provide</strong> professional mental health or crisis support. Our AI coaches <strong>cannot and do not assist</strong> with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-destructive font-semibold text-base mb-4">
                <li>Suicide ideation or self-harm</li>
                <li>Child abuse or child safety concerns</li>
                <li>Domestic violence or abuse situations</li>
                <li>Drug or substance misuse</li>
                <li>Clinical mental health conditions requiring treatment</li>
              </ul>
              <div className="bg-destructive/15 p-6 rounded-lg border-2 border-destructive/40 mt-4">
                <p className="font-bold text-xl mb-4 text-destructive">🚨 Crisis Resources</p>
                <p className="font-bold text-base mb-3 text-foreground">If you are in crisis or feel unsafe, <strong className="underline">DO NOT use HeartLift</strong>. Instead, contact your local emergency services or a trusted helpline:</p>
                <ul className="list-none space-y-3 text-base">
                  <li className="bg-background/50 p-3 rounded-md"><strong className="text-foreground">UK:</strong> <span className="font-bold text-destructive">999</span> (Emergency Services) / Samaritans at <span className="font-bold text-destructive">116 123</span></li>
                  <li className="bg-background/50 p-3 rounded-md"><strong className="text-foreground">US:</strong> <span className="font-bold text-destructive">911</span> (Emergency Services) / <span className="font-bold text-destructive">988</span> Suicide & Crisis Lifeline</li>
                  <li className="bg-background/50 p-3 rounded-md"><strong className="text-foreground">Child Protection (UK):</strong> NSPCC – <span className="font-bold text-destructive">0808 800 5000</span></li>
                </ul>
              </div>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. User Responsibilities</h2>
              <p className="text-base leading-relaxed mb-3 font-medium">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>Provide <strong>accurate, truthful information</strong> when using the Service</li>
                <li>Use HeartLift only for <strong>lawful, personal, and non-commercial purposes</strong></li>
                <li>Avoid <strong>harmful, abusive, or inappropriate behavior</strong></li>
                <li>Respect the limits of our AI wellbeing tools</li>
                <li><strong>Seek professional help when needed</strong></li>
              </ul>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Eligibility</h2>
              <p className="text-base leading-relaxed mb-3">
                You must be <strong>at least 13 years old</strong> to use HeartLift. By using the Service, you <strong>confirm that you meet this age requirement</strong>.
              </p>
              <p className="text-base leading-relaxed">
                HeartLift is <strong>not directed at children under 13</strong>, and we do <strong>not knowingly collect personal data</strong> from anyone under this age. 
                If we become aware that a user under 13 has registered, we will take steps to delete their information promptly.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Payment and Subscriptions</h2>
              <p className="text-base leading-relaxed mb-3">
                Certain features of HeartLift require a <strong>paid subscription</strong>. Payments are securely processed through <strong>Apple's In-App Purchase (IAP) system</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2 text-base">
                <li>Subscriptions <strong>automatically renew</strong> unless cancelled at least <strong>24 hours before renewal</strong>.</li>
                <li>Renewal charges are applied <strong>within 24 hours prior to the end</strong> of the current billing period.</li>
                <li>You may <strong>manage or cancel your subscription</strong> at any time in your device's App Store settings.</li>
              </ul>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Intellectual Property</h2>
              <p className="text-base leading-relaxed">
                All content, features, designs, and functionality of HeartLift are <strong>owned by us or our licensors</strong> and are <strong>protected by copyright, 
                trademark, and other intellectual property laws</strong>. You may <strong>not reproduce, distribute, or modify</strong> any part of the Service without written permission.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Limitation of Liability</h2>
              <p className="text-base leading-relaxed mb-3">
                HeartLift provides wellbeing guidance and digital support tools. We <strong>make no guarantees regarding accuracy or outcomes</strong> 
                and are <strong>not liable for any loss, harm, or decision</strong> made based on the information provided.
              </p>
              <p className="text-base leading-relaxed font-medium">
                The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong>, without warranties of any kind.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Privacy</h2>
              <p className="text-base leading-relaxed">
                <strong>Your privacy is important to us.</strong> Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Termination</h2>
              <p className="text-base leading-relaxed">
                We reserve the right to <strong>suspend or terminate your account</strong>, at our discretion and without notice, 
                if you <strong>violate these Terms or misuse the Service</strong>.
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. Changes to Terms</h2>
              <p className="text-base leading-relaxed">
                We may <strong>update these Terms from time to time</strong>. The latest version will always be posted on this page 
                with a revised "last updated" date. <strong>Continued use of the Service after changes are posted constitutes 
                acceptance of those changes.</strong>
              </p>
            </section>

            <section className="pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold mb-4 text-foreground">12. Governing Law</h2>
              <p className="text-base leading-relaxed">
                These Terms are governed by and construed in accordance with the <strong>laws of the United Kingdom</strong>, 
                without regard to its conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">13. Contact Information</h2>
              <p className="text-base leading-relaxed">
                For questions, feedback, or support, please contact us at:{' '}
                <a href="mailto:support@heart-lift.com" className="text-primary hover:underline font-semibold">
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