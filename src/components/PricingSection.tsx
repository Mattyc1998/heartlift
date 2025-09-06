import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart, Sparkles, Crown } from "lucide-react";
import { PremiumUpgradeModal } from "./PremiumUpgradeModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    icon: Heart,
    description: "Perfect for getting started on your healing journey",
    features: [
      "Basic AI relationship advice",
      "10 messages per day",
      "Daily mood check-ins",
      "Access to all coaches",
      "Email support"
    ],
    buttonText: "Start Free",
    variant: "gentle" as const,
    popular: false
  },
  {
    name: "Premium",
    price: "£11.99",
    period: "per month",
    icon: Sparkles,
    description: "Unlimited support for your relationship growth",
    features: [
      "Unlimited AI coach conversations",
      "Recovery milestone rewards",
      "Personalized insights & reports",
      "Text conversation helpers",
      "Daily attachment style quiz with AI analysis",
      "Conversation analyzer with AI insights",
      "Text suggestion helper for all scenarios",
      "Priority support"
    ],
    buttonText: "Go Premium",
    variant: "warm" as const,
    popular: true
  },
  {
    name: "Healing Kit",
    price: "£3.99",
    period: "one-time",
    icon: Crown,
    description: "Complete break-up recovery package",
    features: [
      "30-day healing plan",
      "Daily affirmations",
      "Guided meditations",
      "No-contact tracker",
      "Journal prompts",
      "Priority support"
    ],
    buttonText: "Get Healing Kit",
    variant: "healing" as const,
    popular: false
  }
];

export const PricingSection = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user, checkSubscription } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = (planName: string) => {
    if (planName === "Premium") {
      if (!user) {
        navigate('/auth');
        return;
      }
      navigate('/premium-purchase');
    } else if (planName === "Healing Kit") {
      if (!user) {
        navigate('/auth');
        return;
      }
      navigate('/healing-kit-purchase');
    }
  };

  const handlePremiumPurchase = async () => {
    try {
      console.log('Starting premium purchase...');
      toast.info("Redirecting to secure checkout...");
      
      // Get the current session token
      const session = await supabase.auth.getSession();
      
      if (!session.data.session?.access_token) {
        throw new Error('No authentication token found. Please sign in again.');
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.data.session.access_token}` }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error("Purchase Error: " + (error.message || "Failed to process purchase"));
    }
  };

  const handleHealingKitPurchase = async () => {
    try {
      console.log('Starting healing kit purchase...');
      toast.info("Redirecting to secure checkout...");
      
      // Get the current session token
      const session = await supabase.auth.getSession();
      
      if (!session.data.session?.access_token) {
        throw new Error('No authentication token found. Please sign in again.');
      }

      // Create Stripe checkout session for healing kit
      const { data, error } = await supabase.functions.invoke('purchase-healing-kit', {
        headers: { Authorization: `Bearer ${session.data.session.access_token}` }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error("Purchase Error: " + (error.message || "Failed to process purchase"));
    }
  };
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-secondary/30 to-accent/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Choose Your Healing Path
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every relationship journey is unique. Find the support level that feels right for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-gentle ${
                  plan.popular ? 'ring-2 ring-primary shadow-warm scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto p-3 rounded-full bg-gradient-to-r from-primary/10 to-primary-glow/10 w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>
                  <CardDescription className="text-center">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                   
                      <Button 
                        variant={plan.variant} 
                        className="w-full"
                        size="lg"
                        onClick={() => handlePlanClick(plan.name)}
                      >
                        {plan.buttonText}
                      </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-muted-foreground">
            All plans include our core emotional support features
          </p>
          <p className="text-xs text-muted-foreground">
            Cancel anytime • Secure payments
          </p>
        </div>

        <PremiumUpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          trigger="usage_limit"
        />
      </div>
    </section>
  );
};