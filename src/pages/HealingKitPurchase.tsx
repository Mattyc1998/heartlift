import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Headphones, BookOpen, Target, Award, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";

function HealingKitPaymentForm({ onSuccess }: { onSuccess: (piId?: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (result.error) {
      toast.error(result.error.message || 'Payment failed');
      setSubmitting(false);
      return;
    }
    const pi = result.paymentIntent;
    if (pi && pi.id && (pi.status === 'succeeded' || pi.status === 'processing' || pi.status === 'requires_capture')) {
      onSuccess(pi.id);
    } else {
      toast.info('Additional authentication may be required.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button onClick={handleSubmit} disabled={!stripe || submitting} className="w-full">
        {submitting ? 'Processing…' : 'Get Healing Kit'}
      </Button>
    </div>
  );
}

export const HealingKitPurchase = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          navigate('/auth');
          return;
        }
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Missing auth token');

        const [{ data: cfg, error: cfgErr }, { data: intent, error: intentErr }] = await Promise.all([
          supabase.functions.invoke('stripe-config', { headers: { Authorization: `Bearer ${token}` } }),
          supabase.functions.invoke('create-healing-kit-intent', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (cfgErr) throw cfgErr;
        if (intentErr) throw intentErr;
        if (!cfg?.publishableKey) throw new Error('Missing publishable key');
        if (!intent?.client_secret) throw new Error('Missing client secret');

        setStripePromise(loadStripe(cfg.publishableKey));
        setClientSecret(intent.client_secret);
      } catch (e: any) {
        toast.error(e.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  const features = useMemo(() => [
    { icon: Calendar, title: '30-Day Healing Plan', description: 'Daily content, prompts, and challenges to guide your recovery' },
    { icon: Headphones, title: 'Guided Meditations', description: '5 professional meditations for letting go and inner peace' },
    { icon: Sparkles, title: 'Daily Affirmations', description: 'Powerful affirmations to rebuild your self-worth' },
    { icon: Target, title: 'No-Contact Tracker', description: 'Track your progress and maintain healthy boundaries' },
    { icon: BookOpen, title: 'Journal Prompts', description: '15 deep-dive prompts for self-discovery and healing' },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-secondary/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
              One-time Purchase
            </Badge>
          </div>
          
          <CardHeader className="text-center pb-6">
            <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-primary/10 to-primary-glow/10 w-fit mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Healing Kit
            </CardTitle>
            <div className="space-y-2">
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold text-foreground">£3.99</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Lifetime Access
              </Badge>
            </div>
            <CardDescription className="text-center text-lg">
              Complete break-up recovery package
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What's Included</h3>
              <div className="grid grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 border border-secondary/30">
                    <feature.icon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              {loading && <div className="text-center text-muted-foreground">Loading secure payment…</div>}
              {!loading && stripePromise && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <HealingKitPaymentForm onSuccess={async (piId) => {
                    if (!piId) return;
                    const session = await supabase.auth.getSession();
                    const token = session.data.session?.access_token;
                    const { data, error } = await supabase.functions.invoke('complete-healing-kit-payment', {
                      body: { payment_intent_id: piId },
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    });
                    if (error) {
                      toast.error(error.message);
                      return;
                    }
                    if (data?.success) {
                      toast.success('Healing Kit unlocked!');
                      setTimeout(() => navigate('/healing-kit'), 800);
                    }
                  }} />
                </Elements>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Secure payment processed by Stripe
                </p>
                <p className="text-xs text-muted-foreground">
                  One-time payment • Instant access • No recurring charges
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
