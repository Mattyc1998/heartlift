import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, MessageSquare, Heart, Zap, Check, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upgrade to Premium.",
        variant: "destructive",
      });
      return;
    }

    // Close the modal and navigate to premium purchase page
    onClose();
    const from = location.pathname + location.search;
    navigate('/premium-purchase', { state: { from } });
  };

  const premiumFeatures = [
    {
      icon: MessageSquare,
      title: "Unlimited AI coach conversations",
      description: "Remove message limits and chat freely with all your coaches",
      gradient: "from-blue-400 to-blue-500"
    },
    {
      icon: Heart,
      title: "Regenerate AI responses",
      description: "Get new responses from your coach if you want a different perspective",
      gradient: "from-emerald-400 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Guided Programmes",
      description: "Access structured healing programs and recovery plans",
      gradient: "from-orange-400 to-orange-500"
    },
    {
      icon: Sparkles,
      title: "Personalised insights & reports",
      description: "Get detailed analysis and custom reports on your progress",
      gradient: "from-purple-400 to-purple-500"
    },
    {
      icon: Crown,
      title: "Daily attachment style quiz with AI analysis",
      description: "Take daily quizzes with personalised AI insights on your attachment patterns",
      gradient: "from-pink-400 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "Conversation analyser with AI insights",
      description: "Get AI-powered analysis of your conversations and relationships",
      gradient: "from-indigo-400 to-indigo-500"
    },
    {
      icon: Heart,
      title: "Text suggestion helper for all scenarios",
      description: "Get AI-powered text suggestions for difficult conversations",
      gradient: "from-green-400 to-green-500"
    },
    {
      icon: Zap,
      title: "Priority support",
      description: "Get faster response times and priority customer support",
      gradient: "from-yellow-400 to-yellow-500"
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
      description: "This kind of personalised coaching is included in Premium. Ready to unlock the full experience?",
      highlight: "Premium includes deep insights and custom advice"
    };
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-card hover:shadow-warm transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.gradient}`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-sm group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
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
                
                <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Unlimited conversations</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI insights & analysis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Guided programmes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Priority support</span>
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