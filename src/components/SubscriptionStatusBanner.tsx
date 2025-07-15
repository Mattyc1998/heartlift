import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Crown, Heart, Sparkles, CheckCircle } from "lucide-react";

export const SubscriptionStatusBanner = () => {
  const { user, isPremium, hasHealingKit } = useAuth();

  if (!user) return null;

  const showBanner = isPremium || hasHealingKit;

  if (!showBanner) return null;

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-primary-glow/10 to-secondary/10 border-primary/20">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-medium text-foreground">Active Subscriptions:</span>
        </div>
        
        <div className="flex items-center gap-3">
          {isPremium && (
            <Badge variant="default" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-3 py-1">
              <Sparkles className="w-4 h-4 mr-1" />
              Premium Active
            </Badge>
          )}
          
          {hasHealingKit && (
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-healing to-healing-glow text-healing-foreground px-3 py-1 cursor-pointer hover:opacity-80" 
              onClick={() => window.location.href = '/healing-kit'}
            >
              <Heart className="w-4 h-4 mr-1" />
              Healing Kit Active - Click to Access
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};