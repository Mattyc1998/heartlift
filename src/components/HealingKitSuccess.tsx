import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const HealingKitSuccess = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPurchase = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          toast({
            title: "Invalid session",
            description: "No session ID found in URL",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        const { data, error } = await supabase.functions.invoke("verify-healing-kit-purchase", {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        if (data.success) {
          setVerified(true);
          toast({
            title: "Welcome to your Healing Kit! 🎉",
            description: "Your purchase has been confirmed and all features are now unlocked.",
          });
        } else {
          throw new Error(data.message || "Verification failed");
        }
      } catch (error: any) {
        toast({
          title: "Verification Error",
          description: error.message || "Failed to verify purchase",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPurchase();
  }, [toast, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying your purchase...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <Badge variant="secondary" className="mx-auto mb-2 bg-primary/10 text-primary">
            Purchase Successful
          </Badge>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Your Healing Kit! 🎉
          </CardTitle>
          <p className="text-muted-foreground">
            Your complete recovery program is now unlocked and ready to begin
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/30">
              <Calendar className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">30-Day Healing Plan</h3>
              <p className="text-sm text-muted-foreground">Daily guided content starting today</p>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/30">
              <Sparkles className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Premium Features</h3>
              <p className="text-sm text-muted-foreground">All tools are now accessible</p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-primary mt-1" />
              <div>
                <h4 className="font-semibold text-primary mb-1">Your Healing Journey Starts Now</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You now have lifetime access to all premium features including your 30-day plan, 
                  guided meditations, journal prompts, and recovery tracking tools.
                </p>
                <p className="text-sm font-medium">
                  Ready to begin Day 1 of your healing journey?
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/healing-plan')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold flex-1"
            >
              Start Day 1 <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Explore Features
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Need help? Contact us at support@healingjourney.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};