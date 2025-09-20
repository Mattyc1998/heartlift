import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Star, ThumbsUp, MessageSquare } from "lucide-react";

const coachNames = {
  flirty: "Luna Love",
  therapist: "Dr. Sage",
  "tough-love": "Phoenix Fire",
  chill: "River Calm"
};

interface DailyReflectionData {
  id?: string;
  coaches_chatted_with: string[];
  conversation_rating: number | null;
  helpful_moments: string;
  areas_for_improvement: string;
}

export const DailyReflection = () => {
  const [reflection, setReflection] = useState<DailyReflectionData>({
    coaches_chatted_with: [],
    conversation_rating: null,
    helpful_moments: "",
    areas_for_improvement: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTodayReflection();
    }
  }, [user]);

  const loadTodayReflection = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .eq('reflection_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setReflection({
          id: data.id,
          coaches_chatted_with: data.coaches_chatted_with || [],
          conversation_rating: data.conversation_rating,
          helpful_moments: data.helpful_moments || "",
          areas_for_improvement: data.areas_for_improvement || ""
        });
        setHasReflectedToday(true);
      }
    } catch (error) {
      console.error("Error loading reflection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCoach = (coachId: string) => {
    setReflection(prev => ({
      ...prev,
      coaches_chatted_with: prev.coaches_chatted_with.includes(coachId)
        ? prev.coaches_chatted_with.filter(id => id !== coachId)
        : [...prev.coaches_chatted_with, coachId]
    }));
  };

  const setRating = (rating: number) => {
    setReflection(prev => ({ ...prev, conversation_rating: rating }));
  };

  const saveReflection = async () => {
    if (!user) return;
    
    if (reflection.coaches_chatted_with.length === 0) {
      toast({
        title: "Please select at least one coach",
        description: "Let us know which coaches you chatted with today.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const reflectionData = {
        user_id: user.id,
        reflection_date: new Date().toISOString().split('T')[0],
        coaches_chatted_with: reflection.coaches_chatted_with,
        conversation_rating: reflection.conversation_rating,
        helpful_moments: reflection.helpful_moments,
        areas_for_improvement: reflection.areas_for_improvement
      };

      const { error } = await supabase
        .from('daily_reflections')
        .upsert(reflectionData, { 
          onConflict: 'user_id,reflection_date' 
        });

      if (error) throw error;

      setHasReflectedToday(true);
      toast({
        title: "Reflection saved!",
        description: "Your daily reflection has been recorded. This helps your coaches remember your journey better."
      });
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast({
        title: "Error saving reflection",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse text-muted-foreground">Loading today's reflection...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-gentle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Daily Reflection
          {hasReflectedToday && (
            <Badge variant="secondary" className="ml-2">
              <ThumbsUp className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Help your coaches remember your journey by reflecting on today's conversations
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Coach Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Which coaches did you chat with today? (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(coachNames).map(([id, name]) => (
              <Button
                key={id}
                variant={reflection.coaches_chatted_with.includes(id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCoach(id)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-3 h-3" />
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            How helpful were your conversations today?
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="ghost"
                size="sm"
                onClick={() => setRating(rating)}
                className="p-1"
              >
                <Star 
                  className={`w-6 h-6 ${
                    reflection.conversation_rating && rating <= reflection.conversation_rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            ))}
          </div>
        </div>

        {/* Helpful Moments */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            What was most helpful in your conversations today?
          </label>
          <Textarea
            placeholder="Share what insights, advice, or support stood out to you..."
            value={reflection.helpful_moments}
            onChange={(e) => setReflection(prev => ({ 
              ...prev, 
              helpful_moments: e.target.value 
            }))}
            rows={3}
          />
        </div>

        {/* Areas for Improvement */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            What would you like to explore more in future conversations?
          </label>
          <Textarea
            placeholder="Any topics, feelings, or situations you'd like your coaches to help you work through..."
            value={reflection.areas_for_improvement}
            onChange={(e) => setReflection(prev => ({ 
              ...prev, 
              areas_for_improvement: e.target.value 
            }))}
            rows={3}
          />
        </div>

        <Button 
          onClick={saveReflection} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : hasReflectedToday ? "Update Reflection" : "Save Reflection"}
        </Button>
      </CardContent>
    </Card>
  );
};