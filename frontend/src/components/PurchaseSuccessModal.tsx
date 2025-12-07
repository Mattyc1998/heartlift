import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Check, Sparkles } from "lucide-react";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'premium' | 'healingkit';
  wasAlreadyOwned?: boolean;
}

export const PurchaseSuccessModal = ({ isOpen, onClose, type, wasAlreadyOwned = false }: PurchaseSuccessModalProps) => {
  const premiumFeatures = [
    "Unlimited AI coach conversations",
    "Guided Programmes",
    "Personalised insights & reports",
    "Daily attachment style quiz with AI analysis",
    "Conversation analyser with AI insights",
    "Text suggestion helper",
    "Create AI-generated visuals",
    "Priority support"
  ];

  const healingKitFeatures = [
    "30-Day Healing Plan",
    "Daily guided content & prompts",
    "Visualisation Practices",
    "Daily Affirmations",
    "No-Contact Tracker",
    "15 Journal Prompts for self-discovery"
  ];

  const features = type === 'premium' ? premiumFeatures : healingKitFeatures;
  const icon = type === 'premium' ? <Crown className="w-16 h-16 text-primary" /> : <Heart className="w-16 h-16 text-primary" />;
  
  const title = wasAlreadyOwned 
    ? (type === 'premium' ? "You Already Have Premium!" : "You Already Have the Healing Kit!")
    : (type === 'premium' ? "Welcome to Premium!" : "Healing Kit Unlocked!");
    
  const subtitle = wasAlreadyOwned
    ? "Your purchase was restored - all features are available"
    : (type === 'premium' 
        ? "All premium features are now unlocked and ready to use" 
        : "Your 30-day healing journey starts now");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-primary/10 to-primary-glow/10 w-fit">
            {icon}
          </div>
          <DialogTitle className="text-2xl text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">You now have access to:</h3>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <span className="text-sm text-foreground leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-primary-glow"
          >
            {type === 'premium' ? 'Start Using Premium' : 'Start Healing Journey'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {type === 'premium' 
              ? 'Manage your subscription anytime in Settings' 
              : 'Access your Healing Kit anytime from the menu'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
