import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const PremiumPurchase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      toast.info("Creating secure checkout session...");
      
      const session = await supabase.auth.getSession();
      
      if (!session.data.session?.access_token) {
        throw new Error('No authentication token found. Please sign in again.');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.data.session.access_token}` }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Checkout opened in new tab");
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error("Purchase Error: " + (error.message || "Failed to process purchase"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPremium = async () => {
    try {
      toast.info("Activating test premium...");
      const { data, error } = await supabase.functions.invoke('test-premium', {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      });
      
      if (error) throw error;
      
      if (data?.success) { 
        toast.success("✅ Test Premium Activated! Redirecting...");
        await checkSubscription();
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error: any) {
      console.error('Test premium error:', error);
      toast.error("❌ Error activating test premium: " + error.message);
    }
  };

  const features = [
    "Unlimited AI coach conversations",
    "Recovery milestone rewards",
    "Personalized insights & reports",
    "Text conversation helpers",
    "Daily attachment style quiz with AI analysis",
    "Conversation analyzer with AI insights",
    "Text suggestion helper for all scenarios",
    "Email support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-secondary/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
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
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleTestPremium}
                  className="flex-1"
                >
                  🧪 Try Test Version
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="flex-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-semibold text-lg py-6"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Subscribe Now"}
                </Button>
              </div>
              
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