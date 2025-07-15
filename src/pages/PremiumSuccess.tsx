import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Home, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PremiumSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) return;

      try {
        // Wait a moment for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check subscription status
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.subscribed) {
          toast({
            title: "Welcome to Premium! 🎉",
            description: "Your subscription is now active. Enjoy unlimited conversations!",
          });
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [user, toast]);

  const premiumFeatures = [
    "💬 Unlimited AI conversations with all coaches",
    "🧠 Personalized coaching and text suggestions", 
    "🛠 Advanced tools and healing plans",
    "💌 Priority support with faster responses"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-glow/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-warm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <CardTitle className="text-3xl font-bold">Welcome to Premium!</CardTitle>
          </div>
          <p className="text-muted-foreground text-lg">
            {isVerifying ? "Setting up your premium account..." : "Your subscription is now active and ready to use!"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              You now have access to:
            </h3>
            <div className="grid gap-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
              variant="warm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chatting
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>You can manage your subscription anytime from your account settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};