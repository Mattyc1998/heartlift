import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseService } from "@/services/purchaseService";

export const PremiumPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;
  const { user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const features = useMemo(() => [
    "Unlimited AI coach conversations",
    "Guided Programmes",
    "Personalised insights & reports",
    "Daily attachment style quiz with AI analysis",
    "Conversation analyser with AI insights",
    "Text suggestion helper for all scenarios",
    "Create personalised AI-generated visuals",
    "Priority support",
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button 
          variant="ghost" 
          onClick={() => {
            // If coming from home page
            if (from === 'home') {
              navigate('/');
            } else {
              // Otherwise go to coaches
              navigate('/?tab=coaches');
            }
          }}
          className="mb-6 hover:bg-secondary/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {from === 'home' ? 'Back to Home' : 'Back to Coaches'}
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
                  <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>


            {/* Purchase Button */}
            <div className="border-t pt-6 space-y-4">
              <Button 
                onClick={async () => {
                  setIsPurchasing(true);
                  try {
                    toast.loading("Opening purchase...");
                    const result = await purchaseService.buyPremium();
                    
                    if (result.success) {
                      toast.success("Welcome to Premium! 🎉");
                      // Navigate back after successful purchase
                      setTimeout(() => {
                        if (from === 'home') {
                          navigate('/');
                        } else {
                          navigate('/?tab=coaches');
                        }
                      }, 1500);
                    } else {
                      toast.error(result.error || "Purchase failed. Please try again.");
                    }
                  } catch (error: any) {
                    console.error('Purchase error:', error);
                    toast.error(error?.message || "Unable to complete purchase");
                  } finally {
                    setIsPurchasing(false);
                  }
                }}
                disabled={isPurchasing}
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              >
                <Crown className="w-5 h-5 mr-2" />
                {isPurchasing ? "Processing..." : "Go Premium - £11.99/month"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime in your Apple settings. Subscription auto-renews monthly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
