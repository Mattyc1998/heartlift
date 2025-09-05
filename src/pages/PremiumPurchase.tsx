import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";

function PremiumPaymentForm({ onSuccess }: { onSuccess: (piId?: string) => void }) {
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
    if (pi && (pi.status === 'succeeded' || pi.status === 'processing' || pi.status === 'requires_capture')) {
      toast.success('Subscription activated!');
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
        {submitting ? 'Processing…' : 'Subscribe Now'}
      </Button>
    </div>
  );
}

export const PremiumPurchase = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();

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
          supabase.functions.invoke('create-subscription-intent', { headers: { Authorization: `Bearer ${token}` } }),
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
    "Unlimited AI coach conversations",
    "Recovery milestone rewards",
    "Personalized insights & reports",
    "Text conversation helpers",
    "Daily attachment style quiz with AI analysis",
    "Conversation analyzer with AI insights",
    "Text suggestion helper for all scenarios",
    "Email support",
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
          <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 text-sm font-medium rounded-bl-lg">
            <Star className="w-4 h-4 inline mr-1" />
            Most Popular
          </div>
          
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-primary/10 to-primary-glow/10 w-fit mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            
            <CardTitle className="text-3xl font-bold">Premium Subscription</CardTitle>
            <div className="space-y-2">
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold text-foreground">£11.99</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Cancel anytime
              </Badge>
            </div>
            <CardDescription className="text-center text-lg">
              Unlimited support for your relationship growth
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                What's Included
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-6 space-y-4">
              {loading && <div className="text-center text-muted-foreground">Loading secure payment…</div>}
              {!loading && stripePromise && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PremiumPaymentForm onSuccess={async () => { await checkSubscription(); navigate('/premium-success'); }} />
                </Elements>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Secure payment processed by Stripe
                </p>
                <p className="text-xs text-muted-foreground">
                  Cancel anytime • No setup fees • Instant access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
