import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const NoContactTracker = () => {
  const [streakDays, setStreakDays] = useState(0);
  const [startDate, setStartDate] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("user_healing_progress")
        .select("no_contact_start_date, no_contact_streak_days")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStreakDays(data.no_contact_streak_days || 0);
        setStartDate(data.no_contact_start_date || "");
      }
    } catch (error: any) {
      console.error("Error fetching progress:", error);
    }
  };

  const resetStreak = async () => {
    try {
      const { error } = await supabase
        .from("user_healing_progress")
        .upsert({
          user_id: user?.id,
          no_contact_streak_days: 0,
          last_contact_date: new Date().toISOString().split('T')[0]
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setStreakDays(0);
      toast({
        title: "Streak reset",
        description: "It's okay - healing isn't linear. Start again when you're ready.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>No Contact Tracker</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">{streakDays}</div>
          <p className="text-muted-foreground">Days of no contact</p>
          {streakDays > 0 && (
            <Badge variant="secondary" className="mt-2">
              {streakDays >= 30 ? "Month Champion!" : streakDays >= 7 ? "Week Strong!" : "Building Strength"}
            </Badge>
          )}
        </div>
        
        {startDate && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Started: {new Date(startDate).toLocaleDateString()}</span>
          </div>
        )}
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetStreak}
            className="text-destructive hover:text-destructive"
          >
            Reset Streak
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};