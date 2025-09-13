import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Clock, Sparkles, Heart, ArrowRight, ChevronRight, PenTool, CheckCircle, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VisualisationExercise {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  category: 'safe_space' | 'future_self' | 'releasing_emotions';
  steps: string[];
  reflection_prompts: string[];
  variation_number: number;
}

interface UserExerciseProgress {
  id: string;
  exercise_id: string;
  completed_at: string;
  reflection_notes?: string;
}

export const VisualisationPractices = () => {
  const [exercises, setExercises] = useState<VisualisationExercise[]>([]);
  const [userProgress, setUserProgress] = useState<UserExerciseProgress[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<VisualisationExercise | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchExercises();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("visualisation_exercises" as any)
        .select("*")
        .order("category", { ascending: true })
        .order("variation_number", { ascending: true });

      if (error) throw error;
      setExercises((data as any[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading exercises",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_visualisation_progress" as any)
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserProgress((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching progress:", error);
    }
  };

  const markExerciseComplete = async (exerciseId: string, notes: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_visualisation_progress" as any)
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          reflection_notes: notes || null,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchUserProgress();
      toast({
        title: "Exercise completed!",
        description: "Great job on your visualization practice.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'safe_space': {
        name: 'Safe Space',
        color: 'bg-blue-100 text-blue-800',
        icon: Heart,
        description: 'Create your sanctuary of peace and safety'
      },
      'future_self': {
        name: 'Future Self',
        color: 'bg-green-100 text-green-800',
        icon: Sparkles,
        description: 'Envision your best possible future'
      },
      'releasing_emotions': {
        name: 'Emotional Release',
        color: 'bg-purple-100 text-purple-800',
        icon: Eye,
        description: 'Gently release negative emotions'
      }
    };
    return categoryMap[category as keyof typeof categoryMap] || categoryMap['safe_space'];
  };

  const isExerciseCompleted = (exerciseId: string) => {
    return userProgress.some(progress => progress.exercise_id === exerciseId);
  };

  const startExercise = (exercise: VisualisationExercise) => {
    setSelectedExercise(exercise);
    setCurrentStep(0);
    setIsReflecting(false);
    setReflectionNotes("");
  };

  const nextStep = () => {
    if (selectedExercise && currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsReflecting(true);
    }
  };

  const completeExercise = async () => {
    if (selectedExercise) {
      await markExerciseComplete(selectedExercise.id, reflectionNotes);
      setSelectedExercise(null);
      setIsReflecting(false);
      setReflectionNotes("");
    }
  };

  const playStepAudio = async (text: string) => {
    if (isPlayingAudio) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsLoadingAudio(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'nova' } // Nova is peaceful for meditation
      });

      if (error) throw error;

      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
          toast({
            title: "Audio Error",
            description: "Failed to play audio",
            variant: "destructive"
          });
        };

        await audio.play();
      }
    } catch (error: any) {
      toast({
        title: "Audio Error",
        description: error.message || "Failed to generate audio",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAudio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group exercises by category
  const groupedExercises = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, VisualisationExercise[]>);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Visualisation Practices
        </h1>
        <p className="text-muted-foreground">
          Transform your mindset through the power of guided mental imagery
        </p>
      </div>

      {Object.entries(groupedExercises).map(([category, categoryExercises]) => {
        const categoryInfo = getCategoryInfo(category);
        const CategoryIcon = categoryInfo.icon;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <CategoryIcon className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">{categoryInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryExercises.map((exercise) => {
                const isCompleted = isExerciseCompleted(exercise.id);

                return (
                  <Card 
                    key={exercise.id}
                    className={`border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50/50' 
                        : 'border-secondary/30 hover:border-primary/30'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <CardTitle className="text-lg">{exercise.title}</CardTitle>
                            {isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${categoryInfo.color} text-xs`}
                          >
                            {categoryInfo.name} #{exercise.variation_number}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{exercise.duration_minutes} min</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {exercise.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          onClick={() => startExercise(exercise)}
                          className="flex items-center gap-2"
                          variant={isCompleted ? "outline" : "default"}
                        >
                          <Eye className="w-4 h-4" />
                          {isCompleted ? 'Practice Again' : 'Begin Practice'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Exercise Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {selectedExercise?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedExercise && !isReflecting && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {selectedExercise.steps.length}
                </span>
                <Badge variant="outline">
                  {getCategoryInfo(selectedExercise.category).name}
                </Badge>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-foreground leading-relaxed">
                      {selectedExercise.steps[currentStep]}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playStepAudio(selectedExercise.steps[currentStep])}
                    disabled={isLoadingAudio}
                    className="shrink-0"
                  >
                    {isLoadingAudio ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : isPlayingAudio ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedExercise(null)}
                >
                  Close
                </Button>
                <Button onClick={nextStep} className="flex items-center gap-2">
                  {currentStep < selectedExercise.steps.length - 1 ? 'Next Step' : 'Complete'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {selectedExercise && isReflecting && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Reflection Time</h3>
                <p className="text-muted-foreground">
                  Take a moment to reflect on your visualization experience
                </p>
              </div>
              
              <div className="space-y-4">
                {selectedExercise.reflection_prompts.map((prompt, index) => (
                  <div key={index} className="bg-secondary/20 rounded-lg p-4">
                    <p className="font-medium mb-2">💭 {prompt}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your reflections (optional):</label>
                <Textarea
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="Write down any insights, feelings, or thoughts that came up during your practice..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReflecting(false)}
                >
                  Back to Exercise
                </Button>
                <Button onClick={completeExercise} className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Complete Practice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Best Practices Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Visualization Best Practices</h3>
          <p className="text-sm text-muted-foreground">
            Find a comfortable, quiet space. Close your eyes and allow your imagination to flow naturally. 
            There's no right or wrong way to visualize - trust your mind's unique way of creating imagery.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};