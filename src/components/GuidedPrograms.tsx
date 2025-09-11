import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Download, 
  BookOpen, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  Heart,
  Shield,
  Flower2
} from "lucide-react";

interface GuidedProgram {
  id: string;
  program_key: string;
  title: string;
  description: string;
  emoji: string;
}

interface ProgramModule {
  id: string;
  program_id: string;
  module_number: number;
  title: string;
  teaching_content: string;
  reflection_prompt: string;
}

interface UserProgress {
  id: string;
  program_id: string;
  current_module: number;
  completed_modules: number[];
  program_completed: boolean;
  reflection_answers: Record<string, string>;
  completed_at?: string;
}

export const GuidedPrograms = () => {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  
  const [programs, setPrograms] = useState<GuidedProgram[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [selectedProgram, setSelectedProgram] = useState<GuidedProgram | null>(null);
  const [programModules, setProgramModules] = useState<ProgramModule[]>([]);
  const [currentModule, setCurrentModule] = useState<ProgramModule | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedProgram, setCompletedProgram] = useState<GuidedProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && isPremium) {
      fetchPrograms();
      fetchUserProgress();
    }
    
    // Cleanup auto-save timer on unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [user, isPremium, autoSaveTimer]);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('guided_programs')
        .select('*')
        .order('program_key');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load guided programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_guided_program_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const progressMap: Record<string, UserProgress> = {};
      data?.forEach(progress => {
        progressMap[progress.program_id] = {
          ...progress,
          reflection_answers: (progress.reflection_answers as Record<string, string>) || {}
        };
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchProgramModules = async (programId: string) => {
    try {
      const { data, error } = await supabase
        .from('guided_program_modules')
        .select('*')
        .eq('program_id', programId)
        .order('module_number');

      if (error) throw error;
      setProgramModules(data || []);
      
      // Set the first module as current by default
      const progress = userProgress[programId];
      const currentModuleNumber = progress?.current_module || 1;
      const currentMod = data?.find(m => m.module_number === currentModuleNumber);
      setCurrentModule(currentMod || data?.[0] || null);
      
      // Load existing reflection answer if available
      if (progress && currentMod) {
        const existingAnswer = progress.reflection_answers[currentMod.id] || "";
        setReflectionAnswer(existingAnswer);
      }
    } catch (error) {
      console.error('Error fetching program modules:', error);
    }
  };

  const startProgram = async (program: GuidedProgram) => {
    setSelectedProgram(program);
    await fetchProgramModules(program.id);
    
    // Initialize progress if not exists
    if (!userProgress[program.id]) {
      try {
        const { error } = await supabase
          .from('user_guided_program_progress')
          .insert({
            user_id: user!.id,
            program_id: program.id,
            current_module: 1,
            completed_modules: [],
            reflection_answers: {}
          });

        if (error) throw error;
        await fetchUserProgress();
      } catch (error) {
        console.error('Error initializing progress:', error);
      }
    }
  };

  const saveReflection = async (showToast = true) => {
    if (!currentModule || !selectedProgram || !user) return;

    const progress = userProgress[selectedProgram.id];
    if (!progress) return;

    const updatedAnswers = {
      ...progress.reflection_answers,
      [currentModule.id]: reflectionAnswer
    };

    try {
      const { error } = await supabase
        .from('user_guided_program_progress')
        .update({ reflection_answers: updatedAnswers })
        .eq('id', progress.id);

      if (error) throw error;
      
      if (showToast) {
        toast({
          title: "Reflection Saved",
          description: "Your reflection has been saved successfully"
        });
      }
      
      await fetchUserProgress();
    } catch (error) {
      console.error('Error saving reflection:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to save reflection",
          variant: "destructive"
        });
      }
    }
  };

  // Auto-save reflection when user types
  const handleReflectionChange = (value: string) => {
    setReflectionAnswer(value);
    
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer to auto-save after 2 seconds of inactivity
    const newTimer = setTimeout(() => {
      if (value.trim()) {
        saveReflection(false); // Don't show toast for auto-save
      }
    }, 2000);
    
    setAutoSaveTimer(newTimer);
  };

  const completeModule = async () => {
    if (!currentModule || !selectedProgram || !user) return;

    await saveReflection();

    const progress = userProgress[selectedProgram.id];
    if (!progress) return;

    const completedModules = [...progress.completed_modules];
    if (!completedModules.includes(currentModule.module_number)) {
      completedModules.push(currentModule.module_number);
    }

    const nextModuleNumber = currentModule.module_number + 1;
    const isLastModule = nextModuleNumber > programModules.length;
    const programCompleted = isLastModule;

    try {
      const updateData: any = {
        completed_modules: completedModules,
        current_module: isLastModule ? currentModule.module_number : nextModuleNumber,
        program_completed: programCompleted
      };

      if (programCompleted) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_guided_program_progress')
        .update(updateData)
        .eq('id', progress.id);

      if (error) throw error;

      await fetchUserProgress();

      if (programCompleted) {
        setCompletedProgram(selectedProgram);
        setShowCompletion(true);
      } else {
        // Move to next module
        const nextModule = programModules.find(m => m.module_number === nextModuleNumber);
        if (nextModule) {
          setCurrentModule(nextModule);
          setReflectionAnswer("");
        }
      }

      toast({
        title: "Module Completed!",
        description: programCompleted 
          ? "Congratulations! You've completed the entire program!"
          : "Moving to the next module..."
      });

    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: "Error",
        description: "Failed to complete module",
        variant: "destructive"
      });
    }
  };

  const downloadReflectionSummary = () => {
    if (!selectedProgram || !userProgress[selectedProgram.id]) return;

    const progress = userProgress[selectedProgram.id];
    const reflections = progress.reflection_answers;
    
    let content = `${selectedProgram.title} - Reflection Summary\n\n`;
    
    programModules.forEach(module => {
      const answer = reflections[module.id];
      if (answer) {
        content += `${module.title}\n`;
        content += `${module.reflection_prompt}\n`;
        content += `Your reflection: ${answer}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProgram.title.replace(/\s+/g, '_')}_reflections.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProgramIcon = (programKey: string) => {
    switch (programKey) {
      case 'finding_inner_security': return Heart;
      case 'rebuilding_trust': return Shield;
      case 'letting_go_moving_forward': return Flower2;
      default: return BookOpen;
    }
  };

  const getProgressPercentage = (programId: string) => {
    const progress = userProgress[programId];
    if (!progress) return 0;
    return (progress.completed_modules.length / 3) * 100;
  };

  if (!isPremium) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-4">Premium Required</h2>
        <p className="text-muted-foreground mb-6">
          Upgrade to premium to access guided programs for growth and healing.
        </p>
        <Button 
          variant="warm" 
          onClick={() => {
            const from = window.location.pathname + window.location.search;
            window.location.href = `/premium-purchase?from=${encodeURIComponent(from)}`;
          }}
        >
          Upgrade to Premium
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </Card>
    );
  }

  // Show program list
  if (!selectedProgram) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Guided Programs</h2>
          <p className="text-muted-foreground">
            Structured journeys to help you grow, heal, and strengthen your relationships.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {programs.map((program) => {
            const IconComponent = getProgramIcon(program.program_key);
            const progress = getProgressPercentage(program.id);
            const isCompleted = userProgress[program.id]?.program_completed;
            
            return (
              <Card key={program.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{program.emoji}</span>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {program.title}
                        {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => startProgram(program)}
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted ? "Review Program" : progress > 0 ? "Continue" : "Start Program"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Show program content
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={async () => {
            // Auto-save current reflection before going back
            if (reflectionAnswer.trim() && currentModule) {
              await saveReflection(false);
            }
            
            setSelectedProgram(null);
            setCurrentModule(null);
            setReflectionAnswer("");
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>{selectedProgram.emoji}</span>
            {selectedProgram.title}
          </h2>
        </div>
      </div>

      {currentModule && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Module Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {programModules.map((module) => {
                const isCompleted = userProgress[selectedProgram.id]?.completed_modules.includes(module.module_number);
                const isCurrent = currentModule.id === module.id;
                
                return (
                  <div
                    key={module.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isCurrent ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={async () => {
                      // Auto-save current reflection before switching modules
                      if (reflectionAnswer.trim() && currentModule) {
                        await saveReflection(false);
                      }
                      
                      setCurrentModule(module);
                      const progress = userProgress[selectedProgram.id];
                      const existingAnswer = progress?.reflection_answers[module.id] || "";
                      setReflectionAnswer(existingAnswer);
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{module.title}</p>
                      <p className="text-xs text-muted-foreground">Module {module.module_number}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Module Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {currentModule.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  {currentModule.teaching_content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Reflection</h4>
                  <p className="text-sm text-muted-foreground italic">
                    {currentModule.reflection_prompt}
                  </p>
                  
                  <Textarea
                    placeholder="Share your thoughts and reflections here..."
                    value={reflectionAnswer}
                    onChange={(e) => handleReflectionChange(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex gap-2">
                    <Button onClick={() => saveReflection(true)} variant="outline" size="sm">
                      Save Reflection
                    </Button>
                    <Button 
                      onClick={completeModule}
                      disabled={!reflectionAnswer.trim()}
                      size="sm"
                    >
                      Complete Module
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              🎉 Program Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You've completed the <strong>{completedProgram?.title}</strong> journey — take a moment to celebrate your growth. 
              Every step you've taken brings you closer to secure and meaningful connections.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={downloadReflectionSummary} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Reflection Summary
              </Button>
              <Button onClick={() => {
                setShowCompletion(false);
                setSelectedProgram(null);
                setCurrentModule(null);
              }}>
                Start Another Program
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};