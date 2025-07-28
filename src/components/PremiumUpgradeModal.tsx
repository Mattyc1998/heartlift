import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, MessageSquare, Heart, Zap, Check, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: "usage_limit" | "premium_teaser";
  coachName?: string;
}

export const PremiumUpgradeModal = ({ isOpen, onClose, trigger = "usage_limit", coachName }: PremiumUpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upgrade to Premium.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: MessageSquare,
      title: "💬 Unlimited AI Conversations",
      description: "Remove message limits and switch between all coaches freely",
      gradient: "from-blue-400 to-blue-500"
    },
    {
      icon: Heart,
      title: "🧠 Personalized Coaching",
      description: "Text suggestion helper, custom insights, and relationship pattern recognition",
      gradient: "from-pink-400 to-pink-500"
    },
    {
      icon: Zap,
      title: "🛠 Advanced Tools",
      description: "Break-up healing plan, attachment style quiz, and recovery timeline",
      gradient: "from-orange-400 to-orange-500"
    },
    {
      icon: Sparkles,
      title: "💬 Text Helpers",
      description: "Message suggestions and conversation analysis tools",
      gradient: "from-purple-400 to-purple-500"
    }
  ];

  const getModalContent = () => {
    if (trigger === "usage_limit") {
      return {
        title: "You've reached today's free limit 💫",
        description: "Want to keep talking? Upgrade to Premium and chat unlimited with all your coaches!",
        highlight: "Free users get 10 messages per day"
      };
    }
    
    return {
      title: `${coachName || "Your coach"} wants to help you more! ✨`,
      description: "This kind of personalized coaching is included in Premium. Ready to unlock the full experience?",
      highlight: "Premium includes deep insights and custom advice"
    };
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            {content.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto max-h-[60vh] px-1">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">{content.description}</p>
            <Badge variant="outline" className="bg-primary/5">
              {content.highlight}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-card hover:shadow-warm transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.gradient}`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">£11.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <p className="text-sm text-muted-foreground">Cancel anytime • No hidden fees</p>
                </div>
                
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Unlimited messages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Advanced tools</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Text helpers & conversation analyzer</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Maybe later
            </Button>
            <Button 
              variant="ghost" 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('test-premium', {
                    headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
                  });
                  if (error) throw error;
                  if (data?.success) { 
                    toast({ title: "✅ Test Premium Activated!" });
                    onClose();
                    setTimeout(() => window.location.reload(), 1000);
                  }
                } catch (error) {
                  console.error('Test premium error:', error);
                  toast({ title: "❌ Error activating test premium", variant: "destructive" });
                }
              }}
              className="flex-1"
              size="sm"
            >
              🧪 TEST Premium
            </Button>
            <Button 
              variant="warm" 
              onClick={handleUpgrade}
              className="flex-1"
              disabled={isLoading}
            >
              <Crown className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Upgrade to Premium"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};