import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Home, Calendar, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const HealingKitSuccess = () => {
  const navigate = useNavigate();
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Always refresh subscription status to grant immediate access
      try {
        setIsVerifying(true);
        await checkSubscription();
        setVerified(true);
        toast({
          title: "Healing Kit Activated! 🎉",
          description: "Your 30-day healing journey begins now.",
        });
      } catch (error: any) {
        console.error('Error verifying purchase:', error);
        toast({
          title: "Verification Error", 
          description: error.message || "Failed to verify purchase. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPurchase();
  }, [user, navigate, toast, checkSubscription]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-healing/5 via-background to-healing-glow/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-healing mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying your purchase...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified) {
    return null; // This will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healing/5 via-background to-healing-glow/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-gentle">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 text-healing" />
            <CardTitle className="text-3xl font-bold">Welcome to Your Healing Journey!</CardTitle>
          </div>
          <p className="text-muted-foreground text-lg">
            Your Healing Kit is now activated and ready to guide you through your recovery.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-healing/10 to-healing-glow/10 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Your 30-Day Healing Plan includes:
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">📅 30 days of structured healing content</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">💝 Daily affirmations for self-love</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">🧘 Visualisation practice sessions</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">📝 Powerful journal prompts</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">🚫 No-contact tracker and support</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Ready to begin?</h4>
            <p className="text-sm text-muted-foreground">
              Your healing journey starts with Day 1. Take it one day at a time, and remember - healing isn't linear.
            </p>
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
              onClick={() => navigate('/healing-kit')}
              className="flex-1"
              variant="healing"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Start Day 1
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Your purchase is complete. Begin your healing journey whenever you're ready.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};