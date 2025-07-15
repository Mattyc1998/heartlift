import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Heart, Target, Zap, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Milestone {
  id: string;
  day_number: number;
  title: string;
  description: string;
  badge_name: string;
  reward_type: string;
}

interface UserProgress {
  current_day: number;
  completed_days: number[];
  completed_milestones: number[];
  no_contact_streak_days: number;
}

export const RecoveryMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    current_day: 1,
    completed_days: [],
    completed_milestones: [],
    no_contact_streak_days: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMilestones();
      fetchUserProgress();
    }
  }, [user]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from("recovery_milestones")
        .select("*")
        .order("day_number");

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: any) {
      console.error("Error fetching milestones:", error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("user_healing_progress")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserProgress({
          current_day: data.current_day || 1,
          completed_days: data.completed_days || [],
          completed_milestones: data.completed_milestones || [],
          no_contact_streak_days: data.no_contact_streak_days || 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMilestoneIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'badge':
        return Star;
      case 'trophy':
        return Trophy;
      case 'crown':
        return Crown;
      case 'heart':
        return Heart;
      case 'target':
        return Target;
      default:
        return Zap;
    }
  };

  const getMilestoneColor = (dayNumber: number) => {
    if (userProgress.completed_milestones.includes(dayNumber)) {
      return "text-green-600 bg-green-50 border-green-200";
    } else if (dayNumber <= userProgress.current_day) {
      return "text-primary bg-primary/10 border-primary/30";
    } else {
      return "text-muted-foreground bg-muted/20 border-muted/30";
    }
  };

  const totalMilestones = milestones.length;
  const completedMilestones = userProgress.completed_milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Recovery Milestones
        </h1>
        <p className="text-muted-foreground">Celebrate your progress and earn rewards along your healing journey</p>
      </div>

      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Milestone Progress
              </h3>
              <p className="text-sm text-muted-foreground">
                {completedMilestones} of {totalMilestones} milestones achieved
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
        {milestones.map((milestone) => {
          const isCompleted = userProgress.completed_milestones.includes(milestone.day_number);
          const isAvailable = milestone.day_number <= userProgress.current_day;
          const IconComponent = getMilestoneIcon(milestone.reward_type);
          
          return (
            <Card 
              key={milestone.id}
              className={`transition-all duration-200 ${getMilestoneColor(milestone.day_number)} ${
                isCompleted ? 'shadow-lg shadow-green-200' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={isCompleted ? "default" : isAvailable ? "secondary" : "outline"}
                    className="mb-2"
                  >
                    Day {milestone.day_number}
                  </Badge>
                  <IconComponent className={`w-6 h-6 ${
                    isCompleted ? 'text-green-600' : isAvailable ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <CardTitle className="text-lg">{milestone.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {milestone.description}
                </p>
                {milestone.badge_name && (
                  <Badge variant="outline" className="text-xs">
                    🏆 {milestone.badge_name}
                  </Badge>
                )}
                {isCompleted && (
                  <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                    <p className="text-xs text-green-700 font-medium">✅ Milestone Achieved!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completedMilestones === 0 && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Start Your Journey</h3>
            <p className="text-muted-foreground">
              Complete your first day in the healing plan to unlock your first milestone!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};