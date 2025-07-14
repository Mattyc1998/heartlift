import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const DailyAffirmations = () => {
  const [currentAffirmation, setCurrentAffirmation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRandomAffirmation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_affirmations")
        .select("text")
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentAffirmation(data[randomIndex].text);
      }
    } catch (error) {
      setCurrentAffirmation("I am strong, worthy, and deserving of love.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomAffirmation();
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-8 text-center">
        <div className="mb-4">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-semibold">Daily Affirmation</h2>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse h-16 bg-secondary/30 rounded"></div>
        ) : (
          <blockquote className="text-lg text-muted-foreground italic mb-6 leading-relaxed">
            "{currentAffirmation}"
          </blockquote>
        )}
        
        <Button 
          variant="outline" 
          onClick={fetchRandomAffirmation}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          New Affirmation
        </Button>
      </CardContent>
    </Card>
  );
};