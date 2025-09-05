import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Trophy, 
  Gift, 
  Star, 
  Calendar, 
  CheckCircle, 
  Lock, 
  Sparkles,
  Heart,
  Download,
  Share2,
  PlayCircle,
  FileText,
  Award,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Milestone {
  id: string;
  day_number: number;
  title: string;
  description: string;
  badge_name: string;
  reward_type: string;
  reward_description: string;
  unlock_message: string;
  celebration_message: string;
  reward_content: any;
}

interface UserProgress {
  milestone_id: string;
  completed_at: string | null;
  reward_claimed: boolean;
  reward_claimed_at: string | null;
}

export const RecoveryMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const { user, subscriptionStatus, isPremium } = useAuth();

  useEffect(() => {
    if (user && subscriptionStatus === 'premium') {
      fetchMilestones();
      fetchUserProgress();
    }
  }, [user, subscriptionStatus]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_milestones')
        .select('*')
        .order('day_number');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    }
  };

  const fetchUserProgress = async () => {
    try {
      const [progressData, healingData] = await Promise.all([
        supabase
          .from('user_milestone_progress')
          .select('milestone_id, completed_at, reward_claimed, reward_claimed_at')
          .eq('user_id', user?.id),
        supabase
          .from('user_healing_progress')
          .select('current_day, completed_days')
          .eq('user_id', user?.id)
          .single()
      ]);

      if (progressData.error) throw progressData.error;
      setUserProgress(progressData.data || []);
      
      // Use healing plan progress to determine current day
      if (healingData.data) {
        setCurrentDay(healingData.data.current_day || 1);
      } else {
        // Fallback to milestone progress if no healing progress exists
        const completedDays = progressData.data?.filter(p => p.completed_at).length || 0;
        setCurrentDay(completedDays + 1);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneProgress = (milestoneId: string) => {
    return userProgress.find(p => p.milestone_id === milestoneId);
  };

  const isMilestoneUnlocked = (dayNumber: number) => {
    // Day 0 and Day 1 are always unlocked
    if (dayNumber === 0 || dayNumber === 1) return true;
    
    // Unlock milestones based on healing plan progress
    // User can access milestones up to their current day in the healing plan
    return dayNumber <= currentDay;
  };

  const completeMilestone = async (milestone: Milestone) => {
    try {
      const { error } = await supabase
        .from('user_milestone_progress')
        .upsert({
          user_id: user?.id,
          milestone_id: milestone.id,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setCelebrationMilestone(milestone);
      await fetchUserProgress();
      toast.success(milestone.celebration_message);
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    }
  };

  const claimReward = async (milestone: Milestone) => {
    try {
      const { error } = await supabase
        .from('user_milestone_progress')
        .update({ 
          reward_claimed: true, 
          reward_claimed_at: new Date().toISOString() 
        })
        .eq('user_id', user?.id)
        .eq('milestone_id', milestone.id);

      if (error) throw error;
      
      setSelectedMilestone(milestone);
      await fetchUserProgress();
      toast.success(milestone.unlock_message);
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'inspirational': return <Heart className="w-5 h-5" />;
      case 'practical': return <FileText className="w-5 h-5" />;
      case 'audio_video': return <PlayCircle className="w-5 h-5" />;
      case 'recognition': return <Award className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getNextMilestone = () => {
    return milestones.find(m => currentDay < m.day_number);
  };

  const completedMilestones = userProgress.filter(p => p.completed_at).length;
  const progressPercentage = (completedMilestones / milestones.length) * 100;

  if (subscriptionStatus !== 'premium') {
    return (
      <Card className="p-6 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Recovery Milestone Rewards</h3>
        <p className="text-muted-foreground mb-4">
          Unlock meaningful rewards and track your healing progress with Premium
        </p>
        <Button variant="warm">Upgrade to Premium</Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-fade-in space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-glow/5"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Recovery Milestones
              </CardTitle>
              <CardDescription>
                Track your progress and unlock meaningful rewards
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Day {currentDay}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedMilestones} of {milestones.length} milestones</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
          
          {getNextMilestone() && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Next Milestone</p>
                <p className="text-xs text-muted-foreground">
                  Day {getNextMilestone()?.day_number}: {getNextMilestone()?.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Reward</p>
                <p className="text-sm font-medium">{getNextMilestone()?.reward_description}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones Grid */}
      <div className="grid gap-4">
        {milestones.map((milestone) => {
          const progress = getMilestoneProgress(milestone.id);
          const isUnlocked = isMilestoneUnlocked(milestone.day_number);
          const isCompleted = !!progress?.completed_at;
          const isRewardClaimed = !!progress?.reward_claimed;

          return (
            <Card 
              key={milestone.id} 
              className={`transition-all duration-300 ${
                isCompleted 
                  ? 'ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 to-primary-glow/5' 
                  : isUnlocked 
                  ? 'hover:shadow-gentle cursor-pointer' 
                  : 'opacity-60'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    isCompleted 
                      ? 'bg-primary/20 text-primary' 
                      : isUnlocked 
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : isUnlocked ? (
                      <Calendar className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{milestone.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        Day {milestone.day_number}
                      </Badge>
                      {milestone.badge_name && (
                        <Badge variant="secondary" className="text-xs">
                          {milestone.badge_name}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {getRewardIcon(milestone.reward_type)}
                      <span className="text-muted-foreground">
                        {milestone.reward_description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {isUnlocked && !isCompleted && (
                      <Button 
                        size="sm" 
                        onClick={() => completeMilestone(milestone)}
                        className="whitespace-nowrap"
                      >
                        Complete
                      </Button>
                    )}
                    
                    {isCompleted && !isRewardClaimed && (
                      <Button 
                        size="sm" 
                        variant="warm" 
                        onClick={() => claimReward(milestone)}
                        className="whitespace-nowrap animate-pulse"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Claim Reward
                      </Button>
                    )}
                    
                    {isRewardClaimed && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedMilestone(milestone)}
                        className="whitespace-nowrap"
                      >
                        View Reward
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reward Detail Modal */}
      <Dialog open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {selectedMilestone?.title} Reward
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone?.unlock_message}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMilestone && (
            <div className="space-y-6">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Reward Content</TabsTrigger>
                  <TabsTrigger value="share">Share & Save</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  {(selectedMilestone.reward_type === 'inspirational' || selectedMilestone.reward_type === 'badge') && (
                    <div className="space-y-4">
                      {selectedMilestone.reward_content?.quotes && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Inspirational Quotes
                          </h4>
                          <div className="space-y-2">
                            {selectedMilestone.reward_content.quotes.map((quote: string, index: number) => (
                              <Card key={index} className="p-4 bg-gradient-to-r from-primary/5 to-primary-glow/5">
                                <p className="italic text-foreground">"{quote}"</p>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedMilestone.reward_content?.affirmations && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Personal Affirmations
                          </h4>
                          <div className="space-y-2">
                            {selectedMilestone.reward_content.affirmations.map((affirmation: string, index: number) => (
                              <Card key={index} className="p-4 bg-gradient-to-r from-secondary/20 to-accent/20">
                                <p className="font-medium text-foreground">{affirmation}</p>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(selectedMilestone.reward_type === 'practical' || selectedMilestone.reward_type === 'practical_tool') && (
                    <div className="space-y-4">
                      {selectedMilestone.reward_content?.checklists && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Daily Checklists
                          </h4>
                          {selectedMilestone.reward_content.checklists.map((checklist: any, checklistIndex: number) => (
                            <Card key={checklistIndex} className="p-4 mb-3">
                              <h5 className="font-medium mb-2">{checklist.title}</h5>
                              <ul className="space-y-2">
                                {checklist.items?.map((item: string, index: number) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          ))}
                        </div>
                      )}

                      {selectedMilestone.reward_content?.worksheets && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Healing Worksheets
                          </h4>
                          {selectedMilestone.reward_content.worksheets.map((worksheet: any, worksheetIndex: number) => (
                            <Card key={worksheetIndex} className="p-4 mb-3">
                              <h5 className="font-medium mb-2">{worksheet.title}</h5>
                              <p className="text-sm text-muted-foreground mb-3">{worksheet.description}</p>
                              <div className="bg-muted/50 p-3 rounded-md">
                                <pre className="text-sm whitespace-pre-wrap">{worksheet.content}</pre>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {selectedMilestone.reward_content?.checklist && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Daily Self-Care Checklist
                          </h4>
                          <Card className="p-4">
                            <ul className="space-y-2">
                              {selectedMilestone.reward_content.checklist.map((item: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        </div>
                      )}
                      
                      {selectedMilestone.reward_content?.routine_tips && (
                        <div>
                          <h4 className="font-semibold mb-2">Routine Building Tips</h4>
                          <Card className="p-4">
                            <ul className="space-y-1">
                              {selectedMilestone.reward_content.routine_tips.map((tip: string, index: number) => (
                                <li key={index} className="text-sm text-muted-foreground">
                                  • {tip}
                                </li>
                              ))}
                            </ul>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedMilestone.reward_type === 'audio_video' && (
                    <div className="space-y-4">
                      <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-primary-glow/10">
                        <PlayCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold text-lg mb-2">
                          {selectedMilestone.reward_content?.meditation_title || selectedMilestone.reward_content?.session_title}
                        </h4>
                        <p className="text-muted-foreground mb-2">
                          Duration: {selectedMilestone.reward_content?.duration}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedMilestone.reward_content?.description || selectedMilestone.reward_content?.coach_message}
                        </p>
                        <Button className="w-full">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start Session
                        </Button>
                      </Card>
                    </div>
                  )}
                  
                  {selectedMilestone.reward_type === 'recognition' && (
                    <div className="space-y-4">
                      <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-primary-glow/10 border-2 border-primary/20">
                        <Award className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold text-lg mb-2">Certificate of Achievement</h4>
                        <p className="text-muted-foreground mb-4">
                          {selectedMilestone.reward_content?.certificate_text}
                        </p>
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                          {selectedMilestone.reward_content?.achievement_level}
                        </Badge>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="share" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share Progress
                    </Button>
                  </div>
                  
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Share your milestone achievement with friends and family to celebrate your progress!
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Celebration Modal */}
      <Dialog open={!!celebrationMilestone} onOpenChange={() => setCelebrationMilestone(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {celebrationMilestone?.celebration_message}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="animate-scale-in">
              <Trophy className="w-20 h-20 text-primary mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Milestone Completed!
            </h3>
            <p className="text-muted-foreground">
              You've reached a new milestone in your healing journey. Your reward is ready to claim!
            </p>
          </div>
          
          <Button 
            onClick={() => {
              setCelebrationMilestone(null);
              if (celebrationMilestone) {
                claimReward(celebrationMilestone);
              }
            }}
            className="w-full"
            size="lg"
          >
            <Gift className="w-4 h-4 mr-2" />
            Claim Your Reward
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};