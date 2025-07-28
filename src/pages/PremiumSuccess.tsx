import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Home, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PremiumSuccess = () => {
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) return;

      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        // If no session ID, just check subscription status
        try {
          await checkSubscription();
          toast({
            title: "Welcome to Premium! 🎉",
            description: "Your subscription is now active. Enjoy unlimited conversations!",
          });
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
        setIsVerifying(false);
        return;
      }

      try {
        // Verify the premium subscription with Stripe
        const { data, error } = await supabase.functions.invoke('verify-premium-subscription', {
          body: { session_id: sessionId },
        });

        if (error) throw error;

        if (data?.success) {
          // Refresh auth context to update subscription status
          await checkSubscription();
          toast({
            title: "Welcome to Premium! 🎉",
            description: "Your subscription is now active. Enjoy unlimited conversations!",
          });
        } else {
          throw new Error(data?.message || "Subscription verification failed");
        }
      } catch (error: any) {
        console.error('Error verifying subscription:', error);
        toast({
          title: "Verification Error",
          description: error.message || "Failed to verify subscription. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [user, searchParams, toast, checkSubscription]);

  const premiumFeatures = [
    "💬 Unlimited AI conversations with all coaches",
    "🧠 Personalized coaching and text suggestions", 
    "🛠 Advanced tools and healing plans",
    "💬 Text helpers & conversation analyzer"
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