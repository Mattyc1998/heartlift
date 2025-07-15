import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PremiumManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, subscriptionStatus, checkSubscription } = useAuth();
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    await checkSubscription();
    toast({
      title: "Status Updated",
      description: "Your subscription status has been refreshed.",
    });
  };

  if (!isPremium) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          Premium Subscription
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>💬 Unlimited conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>🧠 Personalized coaching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>🛠 Advanced tools</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>💌 Priority support</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Manage Subscription
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefreshStatus}
          >
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};