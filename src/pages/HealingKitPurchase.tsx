import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Headphones, BookOpen, Target, Award, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const HealingKitPurchase = () => {
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

      const { data, error } = await supabase.functions.invoke('purchase-healing-kit', {
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

  const handleTestHealingKit = async () => {
    try {
      toast.info("Activating test healing kit...");
      const { data, error } = await supabase.functions.invoke('test-healing-kit', {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      });
      
      if (error) throw error;
      
      if (data?.success) { 
        toast.success("✅ Test Healing Kit Activated! Redirecting...");
        await checkSubscription();
        setTimeout(() => navigate('/healing-kit'), 1500);
      }
    } catch (error: any) {
      console.error('Test healing kit error:', error);
      toast.error("❌ Error activating test kit: " + error.message);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "30-Day Healing Plan",
      description: "Daily content, prompts, and challenges to guide your recovery"
    },
    {
      icon: Headphones,
      title: "Guided Meditations",
      description: "5 professional meditations for letting go and inner peace"
    },
    {
      icon: Sparkles,
      title: "Daily Affirmations",
      description: "Powerful affirmations to rebuild your self-worth"
    },
    {
      icon: Target,
      title: "No-Contact Tracker",
      description: "Track your progress and maintain healthy boundaries"
    },
    {
      icon: BookOpen,
      title: "Journal Prompts",
      description: "15 deep-dive prompts for self-discovery and healing"
    },
    {
      icon: Award,
      title: "Recovery Milestones",
      description: "Celebrate your progress with badges and achievements"
    }
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
                <span className="text-4xl font-bold text-foreground">£3.99</span>
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

            <div className="border-t pt-6 space-y-4">
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleTestHealingKit}
                  className="flex-1"
                >
                  🧪 Try Test Version
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="flex-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-lg py-6"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Get Healing Kit"}
                </Button>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Secure payment processed by Stripe
                </p>
                <p className="text-xs text-muted-foreground">
                  One-time payment • Instant access • No recurring charges
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};