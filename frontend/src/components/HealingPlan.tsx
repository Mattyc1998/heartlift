import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Circle, Heart, Target, MessageSquare, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { queryWithRetry } from "@/utils/supabaseHelpers";

interface HealingDay {
  id: string;
  day_number: number;
  title: string;
  content: string;
  prompt: string;
  challenge: string;
  mindset_reframe: string;
  action_item: string;
}

interface UserProgress {
  current_day: number;
  completed_days: number[];
}

export const HealingPlan = () => {
  const [healingDays, setHealingDays] = useState<HealingDay[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({ current_day: 1, completed_days: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<HealingDay | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHealingPlan();
      fetchUserProgress();
    }
  }, [user]);

  const fetchHealingPlan = async () => {
    try {
      const result = await queryWithRetry(
        async () => {
          return await supabase
            .from("healing_plan_days")
            .select("*")
            .order("day_number");
        },
        'HealingPlan-Days'
      );

      if (result.error) throw result.error;
      setHealingDays(result.data || []);
      
      // Create default healing plan if none exists
      if (!data || data.length === 0) {
        await createDefaultHealingPlan();
      }
    } catch (error: any) {
      toast({
        title: "Error loading healing plan",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("user_healing_progress")
        .select("current_day, completed_days")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserProgress(data);
      }
    } catch (error: any) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markDayComplete = async (dayNumber: number) => {
    if (!user) return;

    try {
      const newCompletedDays = [...userProgress.completed_days, dayNumber];
      const nextDay = Math.min(dayNumber + 1, 30);

      const { error } = await supabase
        .from("user_healing_progress")
        .upsert({
          user_id: user.id,
          current_day: nextDay,
          completed_days: newCompletedDays
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setUserProgress({
        current_day: nextDay,
        completed_days: newCompletedDays
      });

      toast({
        title: "Day completed! 🎉",
        description: `Great job completing Day ${dayNumber}. Keep up the amazing work!`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createDefaultHealingPlan = async () => {
    // This will be handled by a database migration
    console.log('Creating default healing plan...');
  };

  const progressPercentage = (userProgress.completed_days.length / 30) * 100;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
          <div className="h-32 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (selectedDay) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedDay(null)}
            className="mr-4"
          >
            ← Back to Plan
          </Button>
          <Badge variant="secondary">Day {selectedDay.day_number}</Badge>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {selectedDay.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{selectedDay.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-secondary/20 border-secondary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">Today's Prompt</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedDay.prompt}</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-secondary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">Daily Challenge</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedDay.challenge}</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-secondary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">Mindset Reframe</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{selectedDay.mindset_reframe}"</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-secondary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm">Action Item</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedDay.action_item}</p>
                </CardContent>
              </Card>
            </div>

            {!userProgress.completed_days.includes(selectedDay.day_number) && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => markDayComplete(selectedDay.day_number)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-8"
                >
                  Mark Day Complete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          30-Day Healing Plan
        </h1>
        <p className="text-muted-foreground">Your personalised journey from heartbreak to healing</p>
      </div>

      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                {userProgress.completed_days.length} of 30 days completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healingDays.map((day) => {
          const isCompleted = userProgress.completed_days.includes(day.day_number);
          const isCurrent = day.day_number === userProgress.current_day;
          const isAvailable = day.day_number <= userProgress.current_day;

          return (
            <Card 
              key={day.id}
              className={`cursor-pointer transition-all duration-200 ${
                isCompleted 
                  ? 'border-green-500/50 bg-green-50/50' 
                  : isCurrent 
                  ? 'border-primary/50 bg-primary/5' 
                  : isAvailable
                  ? 'border-secondary/30 hover:border-primary/30 hover:bg-primary/5'
                  : 'border-muted/50 bg-muted/20 opacity-60'
              }`}
              onClick={() => isAvailable && setSelectedDay(day)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={isCompleted ? "default" : isCurrent ? "secondary" : "outline"}>
                    Day {day.day_number}
                  </Badge>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-lg">{day.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {day.content}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};