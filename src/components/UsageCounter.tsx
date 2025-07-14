import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, Clock, MessageSquare, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UsageData {
  message_count: number;
  can_send_message: boolean;
  hours_until_reset: number;
}

interface UsageCounterProps {
  currentUsage: number;
  onUpgradeClick: () => void;
  isPremium?: boolean;
}

export const UsageCounter = ({ currentUsage, onUpgradeClick, isPremium = false }: UsageCounterProps) => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const { user } = useAuth();

  const fetchUsageData = async () => {
    if (!user || isPremium) return;

    try {
      const { data, error } = await supabase
        .rpc("get_user_daily_usage", { user_uuid: user.id })
        .single();

      if (error) throw error;
      setUsageData(data);
    } catch (error) {
      console.error("Error fetching usage data:", error);
    }
  };

  useEffect(() => {
    fetchUsageData();
    const interval = setInterval(fetchUsageData, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, isPremium]);

  useEffect(() => {
    if (!usageData || usageData.can_send_message) return;

    const updateTimer = () => {
      const now = new Date();
      const resetTime = new Date(now.getTime() + usageData.hours_until_reset * 60 * 60 * 1000);
      const timeDiff = resetTime.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeLeft("Ready to chat!");
        fetchUsageData();
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [usageData]);

  if (isPremium) {
    return (
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Premium Active</span>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Zap className="w-3 h-3 mr-1" />
              Unlimited
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressValue = Math.min((currentUsage / 3) * 100, 100);
  const isAtLimit = currentUsage >= 3;

  return (
    <Card className={`border-0 shadow-card ${isAtLimit ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${isAtLimit ? 'text-red-600' : 'text-blue-600'}`} />
            <span className="text-sm font-medium">
              {currentUsage}/3 messages today
            </span>
          </div>
          {isAtLimit && (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
              <Clock className="w-3 h-3 mr-1" />
              Limit reached
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Progress 
            value={progressValue} 
            className={`h-2 ${isAtLimit ? 'bg-red-100' : 'bg-blue-100'}`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Free daily limit</span>
            {isAtLimit && timeLeft && (
              <span className="text-red-600 font-medium">
                Reset in {timeLeft}
              </span>
            )}
          </div>
        </div>

        {isAtLimit && (
          <div className="pt-2 border-t border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">
                Want to keep chatting?
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-primary to-primary-glow text-white border-0 hover:shadow-warm transition-all duration-300"
              >
                <Crown className="w-3 h-3 mr-1" />
                Go Premium
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};