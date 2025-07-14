import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart, Sparkles, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    icon: Heart,
    description: "Perfect for getting started on your healing journey",
    features: [
      "Basic AI relationship advice",
      "3 messages per day",
      "Daily mood check-ins",
      "Simple break-up tracker",
      "Community support"
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
      "All coach personas available",
      "Advanced mood analytics",
      "Personalized insights & reports",
      "Text conversation helpers",
      "Priority support",
      "Export your data"
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
      "Guided meditations",
      "Daily affirmations",
      "No-contact tracker premium",
      "Journal prompts",
      "Recovery milestone rewards"
    ],
    buttonText: "Get Healing Kit",
    variant: "healing" as const,
    popular: false
  }
];

export const PricingSection = () => {
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
            30-day money-back guarantee • Cancel anytime • Secure payments
          </p>
        </div>
      </div>
    </section>
  );
};