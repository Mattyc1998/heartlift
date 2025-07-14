import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Heart, Clock, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Meditation {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  audio_url: string;
  category: string;
}

export const GuidedMeditations = () => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    try {
      const { data, error } = await supabase
        .from("guided_meditations")
        .select("*")
        .order("created_at");

      if (error) throw error;
      setMeditations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading meditations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = (meditationId: string) => {
    if (currentPlaying === meditationId) {
      setCurrentPlaying(null);
      toast({
        title: "Meditation paused",
        description: "Audio playback has been paused",
      });
    } else {
      setCurrentPlaying(meditationId);
      toast({
        title: "Starting meditation",
        description: "Note: Audio files are placeholder URLs. Replace with actual audio content.",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Release': 'bg-blue-100 text-blue-800',
      'Self-Love': 'bg-pink-100 text-pink-800',
      'Anxiety': 'bg-purple-100 text-purple-800',
      'Healing': 'bg-green-100 text-green-800',
      'Empowerment': 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Guided Meditations
        </h1>
        <p className="text-muted-foreground">
          Professional meditations designed to support your healing journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meditations.map((meditation) => (
          <Card 
            key={meditation.id} 
            className="border-2 border-secondary/30 hover:border-primary/30 transition-all duration-200"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{meditation.title}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getCategoryColor(meditation.category)} text-xs`}
                  >
                    {meditation.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{meditation.duration_minutes} min</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {meditation.description}
              </p>
              
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant={currentPlaying === meditation.id ? "secondary" : "default"}
                  onClick={() => handlePlayPause(meditation.id)}
                  className="flex items-center gap-2"
                >
                  {currentPlaying === meditation.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
              
              {currentPlaying === meditation.id && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                    <span>Now playing: {meditation.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Audio placeholder - replace with actual meditation audio
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <Headphones className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Best Meditation Practices</h3>
          <p className="text-sm text-muted-foreground">
            Find a quiet space, use headphones for best experience, and give yourself permission 
            to feel whatever comes up during the meditation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};