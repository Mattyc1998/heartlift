import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Star, ThumbsUp, MessageSquare, Calendar, History, ChevronDown, ChevronUp } from "lucide-react";

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
  reflection_date: string;
  created_at?: string;
}

export const DailyReflection = () => {
  const [reflection, setReflection] = useState<DailyReflectionData>({
    coaches_chatted_with: [],
    conversation_rating: null,
    helpful_moments: "",
    areas_for_improvement: "",
    reflection_date: new Date().toISOString().split('T')[0]
  });
  const [pastReflections, setPastReflections] = useState<DailyReflectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTodayReflection();
      loadPastReflections();
      
      // Check for midnight reset
      const checkMidnight = setInterval(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        if (reflection.reflection_date !== today) {
          // It's a new day, reset reflection
          setReflection({
            coaches_chatted_with: [],
            conversation_rating: null,
            helpful_moments: "",
            areas_for_improvement: "",
            reflection_date: today
          });
          setHasReflectedToday(false);
          loadPastReflections(); // Reload past reflections to include yesterday's
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(checkMidnight);
    }
  }, [user]);

  const loadTodayReflection = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || '';
      
      console.log(`Loading today's reflection from backend: ${backendUrl}/api/reflections/today/${user.id}`);
      
      const response = await fetch(`${backendUrl}/api/reflections/today/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load reflection: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data && data.id) {
        console.log('Loaded reflection from backend:', data);
        setReflection({
          id: data.id,
          coaches_chatted_with: data.coaches_chatted_with || [],
          conversation_rating: data.conversation_rating,
          helpful_moments: data.helpful_moments || "",
          areas_for_improvement: data.areas_for_improvement || "",
          reflection_date: data.reflection_date,
          created_at: data.created_at
        });
        setHasReflectedToday(true);
      } else {
        console.log('No reflection found for today');
        // No reflection for today, reset to fresh state
        setReflection({
          coaches_chatted_with: [],
          conversation_rating: null,
          helpful_moments: "",
          areas_for_improvement: "",
          reflection_date: today
        });
        setHasReflectedToday(false);
      }
    } catch (error) {
      console.error("Error loading reflection:", error);
      toast({
        title: "Error loading reflection",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPastReflections = async () => {
    if (!user) return;
    
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || '';
      
      console.log(`Loading past reflections from backend: ${backendUrl}/api/reflections/past/${user.id}`);
      
      const response = await fetch(`${backendUrl}/api/reflections/past/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load past reflections: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Loaded past reflections:', data);
      setPastReflections(data || []);
    } catch (error) {
      console.error("Error loading past reflections:", error);
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
        reflection_date: reflection.reflection_date,
        coaches_chatted_with: reflection.coaches_chatted_with,
        conversation_rating: reflection.conversation_rating,
        helpful_moments: reflection.helpful_moments,
        areas_for_improvement: reflection.areas_for_improvement
      };

      console.log('Attempting to save reflection:', reflectionData);

      // Check if reflection already exists for today
      const { data: existingReflection, error: checkError } = await supabase
        .from('daily_reflections')
        .select('id')
        .eq('user_id', user.id)
        .eq('reflection_date', reflection.reflection_date)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing reflection:", checkError);
        throw checkError;
      }

      let result;
      if (existingReflection) {
        // Update existing reflection
        console.log('Updating existing reflection:', existingReflection.id);
        const { data, error } = await supabase
          .from('daily_reflections')
          .update({
            coaches_chatted_with: reflection.coaches_chatted_with,
            conversation_rating: reflection.conversation_rating,
            helpful_moments: reflection.helpful_moments,
            areas_for_improvement: reflection.areas_for_improvement,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReflection.id)
          .select('*');
        
        result = { data, error };
        console.log('Update result:', result);
      } else {
        // Insert new reflection
        console.log('Inserting new reflection');
        const { data, error } = await supabase
          .from('daily_reflections')
          .insert(reflectionData)
          .select('*');
        
        result = { data, error };
        console.log('Insert result:', result);
      }

      if (result.error) {
        console.error("Save error:", result.error);
        throw result.error;
      }

      if (!result.data || result.data.length === 0) {
        console.error("No data returned from save operation");
        throw new Error("Save operation returned no data. Possible RLS policy issue.");
      }

      console.log('Reflection saved successfully:', result.data);

      setHasReflectedToday(true);
      
      // Update the reflection state with the saved data
      if (result.data && result.data[0]) {
        setReflection({
          ...reflection,
          id: result.data[0].id,
          created_at: result.data[0].created_at
        });
      }
      
      // Reload from database to verify it was actually saved
      console.log('Verifying save by reloading from database...');
      await loadTodayReflection();
      await loadPastReflections();
      
      // Double-check if it's actually there
      const { data: verifyData, error: verifyError } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .eq('reflection_date', reflection.reflection_date)
        .maybeSingle();
      
      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error(`Save verification failed: ${verifyError.message}`);
      }
      
      if (!verifyData) {
        console.error('Reflection was saved but cannot be retrieved! Possible RLS policy issue.');
        throw new Error('Reflection saved but not accessible. Please check database permissions.');
      }
      
      console.log('Verification successful! Reflection is in database:', verifyData);
      
      toast({
        title: "Reflection saved!",
        description: "Your daily reflection has been recorded. This helps your coaches remember your journey better."
      });
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast({
        title: "Error saving reflection",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
    <div className="space-y-4">
      {/* Today's Reflection */}
      <Card className="w-full shadow-gentle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Reflection
            {hasReflectedToday && (
              <Badge variant="secondary" className="ml-2">
                <ThumbsUp className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(reflection.reflection_date)} • Help your coaches remember your journey by reflecting on today's conversations
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

      {/* Past Reflections History */}
      {pastReflections.length > 0 && (
        <Card className="w-full shadow-gentle">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full p-0 h-auto"
            >
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <CardTitle>Reflection History ({pastReflections.length})</CardTitle>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <p className="text-sm text-muted-foreground text-left">
              View your past reflections to track your journey
            </p>
          </CardHeader>
          
          {showHistory && (
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {pastReflections.map((pastReflection, index) => (
                    <div key={pastReflection.id || index} className="border-l-2 border-primary/20 pl-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {formatDate(pastReflection.reflection_date)}
                          </h4>
                          <div className="flex items-center gap-2">
                            {pastReflection.conversation_rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(pastReflection.conversation_rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {pastReflection.coaches_chatted_with && pastReflection.coaches_chatted_with.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pastReflection.coaches_chatted_with.map(coachId => (
                              <Badge key={coachId} variant="outline" className="text-xs">
                                {coachNames[coachId as keyof typeof coachNames]}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {pastReflection.helpful_moments && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">What was helpful:</p>
                            <p className="text-sm">{pastReflection.helpful_moments}</p>
                          </div>
                        )}
                        
                        {pastReflection.areas_for_improvement && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Areas to explore:</p>
                            <p className="text-sm">{pastReflection.areas_for_improvement}</p>
                          </div>
                        )}
                      </div>
                      
                      {index < pastReflections.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};