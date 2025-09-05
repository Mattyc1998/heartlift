import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Heart, Clock, Headphones, Volume2, ExternalLink } from "lucide-react";
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
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
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

  const handlePlayPause = (meditation: Meditation) => {
    const audio = audioRefs.current[meditation.id];
    
    if (!audio) return;
    
    if (currentPlaying === meditation.id) {
      audio.pause();
      setCurrentPlaying(null);
      toast({
        title: "Meditation paused",
        description: "Audio playback has been paused",
      });
    } else {
      // Pause any other playing audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      
      if (meditation.audio_url) {
        audio.src = meditation.audio_url;
        audio.play().then(() => {
          setCurrentPlaying(meditation.id);
          toast({
            title: "Starting meditation",
            description: `Now playing: ${meditation.title}`,
          });
        }).catch(() => {
          // Fallback to YouTube or external link if direct audio fails
          if (meditation.audio_url.includes('youtube.com') || meditation.audio_url.includes('youtu.be')) {
            window.open(meditation.audio_url, '_blank');
            toast({
              title: "Opening meditation",
              description: "Opening in a new tab since this is a video link",
            });
          } else {
            toast({
              title: "Audio unavailable",
              description: "This meditation audio is currently unavailable",
              variant: "destructive"
            });
          }
        });
      } else {
        toast({
          title: "Audio unavailable", 
          description: "This meditation doesn't have audio content yet",
          variant: "destructive"
        });
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        {meditations.map((meditation) => {
          const isPlaying = currentPlaying === meditation.id;
          const hasAudio = meditation.audio_url && meditation.audio_url.trim() !== '';
          const isExternalLink = hasAudio && (meditation.audio_url.includes('youtube.com') || meditation.audio_url.includes('youtu.be') || meditation.audio_url.includes('http'));

          return (
            <Card 
              key={meditation.id} 
              className="border-2 border-secondary/30 hover:border-primary/30 transition-all duration-200"
            >
              {/* Hidden audio element for each meditation */}
              {hasAudio && !isExternalLink && (
                <audio
                  ref={(el) => {
                    if (el) audioRefs.current[meditation.id] = el;
                  }}
                  onTimeUpdate={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    setProgress(prev => ({
                      ...prev,
                      [meditation.id]: (audio.currentTime / audio.duration) * 100
                    }));
                  }}
                  onLoadedMetadata={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    setDuration(prev => ({
                      ...prev,
                      [meditation.id]: audio.duration
                    }));
                  }}
                  onEnded={() => {
                    setCurrentPlaying(null);
                    toast({
                      title: "Meditation completed",
                      description: "Great job on completing your meditation!",
                    });
                  }}
                />
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">{meditation.title}</CardTitle>
                      {isExternalLink && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      )}
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
                
                {isPlaying && hasAudio && !isExternalLink && (
                  <div className="space-y-2">
                    <Progress value={progress[meditation.id] || 0} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime((duration[meditation.id] || 0) * (progress[meditation.id] || 0) / 100)}</span>
                      <span>{formatTime(duration[meditation.id] || 0)}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant={isPlaying ? "secondary" : "default"}
                    onClick={() => handlePlayPause(meditation)}
                    className="flex items-center gap-2"
                    disabled={!hasAudio}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        {isExternalLink ? <ExternalLink className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isExternalLink ? 'Open' : hasAudio ? 'Play' : 'Coming Soon'}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Volume2 className="w-4 h-4" />
                        <span>Playing</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {isPlaying && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                      <span>Now playing: {meditation.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isExternalLink ? 'Opened in new tab' : 'Find a quiet space and allow yourself to relax'}
                    </p>
                  </div>
                )}

                {!hasAudio && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                    <p className="text-xs text-muted-foreground text-center">
                      Audio content coming soon for this meditation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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