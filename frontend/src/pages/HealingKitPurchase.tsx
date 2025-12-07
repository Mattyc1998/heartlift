import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, BookOpen, Target, Award, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseService } from "@/services/purchaseService";
import { PurchaseSuccessModal } from "@/components/PurchaseSuccessModal";

export const HealingKitPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;
  const { user, checkSubscription, unlockHealingKit } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [wasAlreadyOwned, setWasAlreadyOwned] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user already owns healing kit on THIS app account
    const checkOwnership = async () => {
      try {
        const { data, error } = await supabase
          .from('healing_kit_purchases')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (data?.status === 'completed') {
          setAlreadyOwned(true);
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkOwnership();
  }, [user, navigate]);

  const features = useMemo(() => [
    { icon: Calendar, title: '30-Day Healing Plan', description: 'Daily content, prompts, and challenges to guide your recovery' },
    { icon: BookOpen, title: 'Visualisation Practices', description: 'Step-by-step mental imagery exercises for healing and growth' },
    { icon: Sparkles, title: 'Daily Affirmations', description: 'Powerful affirmations to rebuild your self-worth' },
    { icon: Target, title: 'No-Contact Tracker', description: 'Track your progress and maintain healthy boundaries' },
    { icon: Award, title: 'Journal Prompts', description: '15 deep-dive prompts for self-discovery and healing' },
  ], []);

  return (
    <>
      <PurchaseSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Navigate - HealingKit page will re-check ownership from Supabase
          navigate('/healing-kit', { replace: true });
        }}
        type="healingkit"
        wasAlreadyOwned={wasAlreadyOwned}
      />
      
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
                <span className="text-4xl font-bold text-foreground">£4.99</span>
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


            {/* Purchase Button or Already Owned Message */}
            <div className="border-t pt-6 space-y-4">
              {alreadyOwned ? (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-lg font-semibold text-foreground">You already own the Healing Kit! 💚</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your 30-day healing journey is ready and waiting for you.
                  </p>
                  <Button 
                    onClick={() => navigate('/healing-kit')}
                    className="mt-4"
                  >
                    Start Healing Journey
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    onClick={async () => {
                      setIsPurchasing(true);
                      const loadingToast = toast.loading("Opening purchase...");
                      
                      // Check if user already owned it BEFORE purchase
                      const hadHealingKitBefore = alreadyOwned;
                      
                      try {
                        const result = await purchaseService.buyHealingKit();
                        
                        // Dismiss the loading toast
                        toast.dismiss(loadingToast);
                        
                        if (result.success) {
                          console.log('✅ [PURCHASE] Purchase successful!');
                          
                          // CRITICAL: UNLOCK FEATURES IMMEDIATELY - NO WAITING
                          unlockHealingKit();
                          console.log('✅ [PURCHASE] Healing Kit unlocked in local state');
                          
                          setAlreadyOwned(true);
                          setWasAlreadyOwned(hadHealingKitBefore);
                          
                          // Show success modal - Supabase sync happens in background
                          setShowSuccessModal(true);
                        } else {
                          toast.error(result.error || "Purchase failed. Please try again.");
                        }
                      } catch (error: any) {
                        toast.dismiss(loadingToast);
                        console.error('Purchase error:', error);
                        toast.error(error?.message || "Unable to complete purchase");
                      } finally {
                        setIsPurchasing(false);
                      }
                    }}
                    disabled={isPurchasing || checkingOwnership}
                    className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {isPurchasing ? "Processing..." : checkingOwnership ? "Loading..." : "Get Healing Kit - £4.99"}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    One-time purchase. Lifetime access included.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};
