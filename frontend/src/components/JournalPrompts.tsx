import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Heart, Lightbulb, Target, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JournalPrompt {
  id: string;
  prompt: string;
  category: string;
  emotional_theme: string;
}

interface UserJournalEntry {
  promptId: string;
  response: string;
  date: string;
}

export const JournalPrompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [savedEntries, setSavedEntries] = useState<UserJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrompts();
      loadSavedEntries();
    }
  }, [user]);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPrompts(data);
      } else {
        // If no prompts exist, create some default ones
        await createDefaultPrompts();
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const createDefaultPrompts = async () => {
    const defaultPrompts = [
      {
        prompt: "Write about the relationship patterns you've noticed in your life. What themes keep appearing, and what might they be trying to teach you?",
        category: "Self-Reflection",
        emotional_theme: "Pattern Recognition"
      },
      {
        prompt: "Describe a moment when you felt truly loved and accepted. What did that experience teach you about your own worth?",
        category: "Self-Love",
        emotional_theme: "Self-Worth"
      },
      {
        prompt: "What are three things you're grateful for about yourself today? Focus on your inner qualities rather than achievements.",
        category: "Gratitude",
        emotional_theme: "Self-Appreciation"
      },
      {
        prompt: "Write a letter to your past self who was going through heartbreak. What wisdom would you share?",
        category: "Healing",
        emotional_theme: "Growth"
      },
      {
        prompt: "What does your ideal relationship look like? Describe how you want to feel and be treated.",
        category: "Future Visioning",
        emotional_theme: "Hope"
      },
      {
        prompt: "Reflect on a recent conflict or difficult conversation. What were the underlying emotions and needs that weren't expressed?",
        category: "Communication",
        emotional_theme: "Understanding"
      },
      {
        prompt: "What fears do you have about relationships? Where do you think these fears originated, and how do they serve or limit you?",
        category: "Fears",
        emotional_theme: "Courage"
      },
      {
        prompt: "Write about a boundary you need to set or maintain. What makes this boundary important for your wellbeing?",
        category: "Boundaries",
        emotional_theme: "Self-Protection"
      },
      {
        prompt: "Describe how you've grown as a person through your relationship experiences. What strengths have you developed?",
        category: "Growth",
        emotional_theme: "Empowerment"
      },
      {
        prompt: "What would you tell someone else who is going through a similar situation to yours? Write this advice with compassion.",
        category: "Wisdom",
        emotional_theme: "Compassion"
      },
      {
        prompt: "Reflect on your attachment style. How does it show up in your relationships, and what would healing look like?",
        category: "Attachment",
        emotional_theme: "Awareness"
      },
      {
        prompt: "Write about a moment when you chose yourself over staying in an unhealthy situation. How did that feel?",
        category: "Self-Advocacy",
        emotional_theme: "Pride"
      },
      {
        prompt: "What are your core values in relationships? How can you honor these values in future connections?",
        category: "Values",
        emotional_theme: "Alignment"
      },
      {
        prompt: "Describe what peace feels like to you. How can you create more of this feeling in your daily life?",
        category: "Peace",
        emotional_theme: "Serenity"
      },
      {
        prompt: "Write about forgiveness - either forgiving someone else or forgiving yourself. What would that process look like?",
        category: "Forgiveness",
        emotional_theme: "Release"
      },
      {
        prompt: "What does self-compassion mean to you? How can you practice being kinder to yourself during difficult times?",
        category: "Self-Love",
        emotional_theme: "Kindness"
      },
      {
        prompt: "Write about a time when you felt truly confident and secure. What internal and external factors contributed to that feeling?",
        category: "Confidence",
        emotional_theme: "Security"
      },
      {
        prompt: "What toxic patterns are you ready to release? Write about why you're committed to breaking these cycles.",
        category: "Transformation",
        emotional_theme: "Liberation"
      },
      {
        prompt: "Describe your emotional support system. Who are the people that truly see and understand you?",
        category: "Support",
        emotional_theme: "Connection"
      },
      {
        prompt: "What would you want to tell your future self about the journey you're on now? What hopes do you have?",
        category: "Future Visioning",
        emotional_theme: "Optimism"
      },
      {
        prompt: "Write about a moment when you stood up for yourself. How did it feel, and what did you learn about your own strength?",
        category: "Self-Advocacy",
        emotional_theme: "Empowerment"
      },
      {
        prompt: "What does vulnerability look like in healthy relationships? How comfortable are you with being truly seen?",
        category: "Intimacy",
        emotional_theme: "Authenticity"
      },
      {
        prompt: "Reflect on your relationship with solitude. How do you feel when you're alone with your thoughts?",
        category: "Self-Reflection",
        emotional_theme: "Independence"
      },
      {
        prompt: "What childhood experiences shaped your understanding of love? How do these influences show up in your adult relationships?",
        category: "Origins",
        emotional_theme: "Understanding"
      },
      {
        prompt: "Write about a time when you felt deeply grateful for a difficult experience. What did it teach you?",
        category: "Gratitude",
        emotional_theme: "Wisdom"
      },
      {
        prompt: "What does emotional safety feel like to you? How can you create this for yourself and others?",
        category: "Safety",
        emotional_theme: "Security"
      },
      {
        prompt: "Describe your relationship with trust. What helps you feel safe to be vulnerable with someone?",
        category: "Trust",
        emotional_theme: "Safety"
      },
      {
        prompt: "What would unconditional self-acceptance look like in your life? What would change if you fully embraced who you are?",
        category: "Self-Love",
        emotional_theme: "Acceptance"
      },
      {
        prompt: "Write about the difference between being alone and being lonely. How has your relationship with solitude evolved?",
        category: "Independence",
        emotional_theme: "Self-Sufficiency"
      },
      {
        prompt: "What legacy do you want to leave in terms of how you love and how you allow yourself to be loved?",
        category: "Legacy",
        emotional_theme: "Purpose"
      }
    ];

    try {
      const { data, error } = await supabase
        .from('journal_prompts')
        .insert(defaultPrompts)
        .select();

      if (error) throw error;
      if (data) setPrompts(data);
    } catch (error) {
      console.error('Error creating default prompts:', error);
    }
  };

  const loadSavedEntries = async () => {
    if (!user) return;
    
    try {
      const { data: progress } = await supabase
        .from('user_healing_progress')
        .select('journal_entries')
        .eq('user_id', user.id)
        .single();

      if (progress?.journal_entries) {
        // Safely parse the journal entries from JSON
        const entries = progress.journal_entries as any;
        if (Array.isArray(entries)) {
          setSavedEntries(entries as UserJournalEntry[]);
        }
      }
    } catch (error) {
      console.error('Error loading saved entries:', error);
    }
  };

  const saveEntry = async () => {
    if (!user || !userResponse.trim()) {
      toast.error("Please write your response before saving");
      return;
    }

    setIsLoading(true);
    try {
      const newEntry: UserJournalEntry = {
        promptId: prompts[currentPromptIndex].id,
        response: userResponse,
        date: new Date().toISOString()
      };

      const updatedEntries = [...savedEntries.filter(e => e.promptId !== newEntry.promptId), newEntry];

      const { error } = await supabase
        .from('user_healing_progress')
        .upsert({
          user_id: user.id,
          journal_entries: updatedEntries as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSavedEntries(updatedEntries);
      toast.success("Journal entry saved!");
      setUserResponse("");
      
      // Move to next prompt if available
      if (currentPromptIndex < prompts.length - 1) {
        setCurrentPromptIndex(currentPromptIndex + 1);
      }

    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousPrompt = () => {
    if (currentPromptIndex > 0) {
      const previousIndex = currentPromptIndex - 1;
      setCurrentPromptIndex(previousIndex);
      // Load previous response if it exists
      const savedEntry = savedEntries.find(e => e.promptId === prompts[previousIndex]?.id);
      setUserResponse(savedEntry?.response || "");
    }
  };

  const goToNextPrompt = () => {
    if (currentPromptIndex < prompts.length - 1) {
      const nextIndex = currentPromptIndex + 1;
      setCurrentPromptIndex(nextIndex);
      // Load saved response if it exists
      const savedEntry = savedEntries.find(e => e.promptId === prompts[nextIndex]?.id);
      setUserResponse(savedEntry?.response || "");
    }
  };

  useEffect(() => {
    // Load saved response when prompt changes
    if (prompts.length > 0) {
      const currentPrompt = prompts[currentPromptIndex];
      const savedEntry = savedEntries.find(e => e.promptId === currentPrompt?.id);
      setUserResponse(savedEntry?.response || "");
    }
  }, [currentPromptIndex, prompts, savedEntries]);

  if (prompts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Journal Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your journal prompts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPrompt = prompts[currentPromptIndex];
  const savedEntry = savedEntries.find(e => e.promptId === currentPrompt?.id);
  const categoryIcon = {
    "Self-Reflection": Target,
    "Self-Love": Heart,
    "Gratitude": Heart,
    "Healing": Heart,
    "Future Visioning": Lightbulb,
    "Communication": BookOpen,
    "Fears": Target,
    "Boundaries": Target,
    "Growth": Lightbulb,
    "Wisdom": Lightbulb,
    "Attachment": Heart,
    "Self-Advocacy": Target,
    "Values": Target,
    "Peace": Heart,
    "Forgiveness": Heart,
    "Confidence": Target,
    "Transformation": Lightbulb,
    "Support": Heart,
    "Intimacy": Heart,
    "Origins": BookOpen,
    "Safety": Target,
    "Trust": Heart,
    "Independence": Target,
    "Legacy": Lightbulb
  };

  const IconComponent = categoryIcon[currentPrompt?.category as keyof typeof categoryIcon] || BookOpen;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Journal Prompts
          </CardTitle>
          <CardDescription>
            Deep-dive prompts for self-discovery and healing ({savedEntries.length}/{prompts.length} completed)
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Prompt {currentPromptIndex + 1} of {prompts.length}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {currentPrompt?.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>{currentPrompt?.emotional_theme}</span>
                  {savedEntry && <span className="text-green-600">✓ Completed</span>}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPrompt}
                disabled={currentPromptIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPrompt}
                disabled={currentPromptIndex === prompts.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-foreground leading-relaxed">
              {currentPrompt?.prompt}
            </p>
          </div>

          <Textarea
            placeholder="Write your thoughts here... Take your time and be honest with yourself."
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            className="min-h-[200px] resize-none"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {userResponse.length} characters
            </div>
            
            <Button
              onClick={saveEntry}
              disabled={!userResponse.trim() || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : savedEntry ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Journaling Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                style={{ width: `${(savedEntries.length / prompts.length) * 100}%` }}
              />
            </div>
            <span className="font-medium text-primary">
              {Math.round((savedEntries.length / prompts.length) * 100)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            You've completed {savedEntries.length} out of {prompts.length} journal prompts. Keep going!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};