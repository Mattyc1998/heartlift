import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Palette, Heart, RefreshCw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SavedVision {
  id: string;
  url: string;
  caption?: string;
  prompt: string;
  timestamp: number;
}

export function HeartVisions() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    url: string;
    caption?: string;
  } | null>(null);
  const [savedVisions, setSavedVisions] = useState<SavedVision[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadVisions();
    }
  }, [user?.id]);

  const loadVisions = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('heart_visions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading visions:', error);
      return;
    }

    if (data) {
      const formattedVisions = data.map(v => ({
        id: v.id,
        url: v.image_url,
        caption: v.caption,
        prompt: v.prompt,
        timestamp: new Date(v.created_at).getTime(),
      }));
      setSavedVisions(formattedVisions);
      
      // Count today's images
      const today = new Date().toDateString();
      const todayCount = data.filter(v => 
        new Date(v.created_at).toDateString() === today
      ).length;
      setDailyCount(todayCount);
    }
  };

  const getFirstName = () => {
    if (!user?.user_metadata?.full_name) return "friend";
    return user.user_metadata.full_name.split(" ")[0];
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter what you'd like to visualise");
      return;
    }

    if (dailyCount >= 2) {
      toast.error("You've reached your daily limit of 2 images. Come back tomorrow to create more!");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-heart-vision',
        {
          body: { 
            prompt: prompt.trim(),
            userName: getFirstName()
          }
        }
      );

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(functionError.message || "Failed to generate image");
      }

      if (!functionData?.imageUrl) {
        throw new Error("No image URL in response");
      }

      setGeneratedImage({
        url: functionData.imageUrl,
        caption: functionData.caption,
      });
      setDailyCount(prev => prev + 1);
      toast.success("Your vision has been created!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Unable to generate your vision. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const supportiveMessages = [
    `Here's what that feeling might look like, ${getFirstName()}.`,
    `This image reflects your intention beautifully.`,
    `Take a moment with this — does it capture your emotion?`,
    `Beautiful, ${getFirstName()}. Let this vision guide your heart.`,
    `Your feelings, visualised. What do you notice?`,
  ];

  const getRandomMessage = () => {
    return supportiveMessages[Math.floor(Math.random() * supportiveMessages.length)];
  };

  const handleSaveToGallery = async () => {
    if (!generatedImage || !prompt || !user?.id) return;

    const { data, error } = await supabase
      .from('heart_visions')
      .insert({
        user_id: user.id,
        image_url: generatedImage.url,
        prompt: prompt,
        caption: generatedImage.caption,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving vision:', error);
      toast.error("Failed to save vision");
      return;
    }

    if (data) {
      const newVision: SavedVision = {
        id: data.id,
        url: data.image_url,
        caption: data.caption,
        prompt: data.prompt,
        timestamp: new Date(data.created_at).getTime(),
      };
      setSavedVisions([newVision, ...savedVisions]);
      toast.success("Vision saved to gallery!");
    }
  };

  const handleDeleteVision = async (id: string) => {
    const { error } = await supabase
      .from('heart_visions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vision:', error);
      toast.error("Failed to remove vision");
      return;
    }

    setSavedVisions(savedVisions.filter(v => v.id !== id));
    toast.success("Vision removed from gallery");
  };

  const handleGenerateAnother = () => {
    setPrompt("");
    setGeneratedImage(null);
  };

  return (
    <Card>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary-glow shrink-0">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl">HeartVisions</CardTitle>
            <CardDescription className="text-sm sm:text-base leading-relaxed">
              Create your own emotional visuals. Type what you'd like to see, and HeartVisions will
              generate a personalised image that captures your feelings or intentions.
              <span className="block mt-2 text-xs font-medium">
                You get 2 free images per day • {dailyCount}/2 used today
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setShowGallery(false)}
            variant={!showGallery ? "default" : "outline"}
            size="sm"
          >
            <Palette className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button
            onClick={() => setShowGallery(true)}
            variant={showGallery ? "default" : "outline"}
            size="sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Gallery ({savedVisions.length})
          </Button>
        </div>

        {showGallery ? (
          <div className="space-y-4">
            {savedVisions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved visions yet</p>
                <p className="text-sm">Create and save your first vision to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedVisions.map((vision) => (
                  <div key={vision.id} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm text-muted-foreground italic flex-1">
                        {vision.caption || `"${vision.prompt}"`}
                      </p>
                      <Button
                        onClick={() => handleDeleteVision(vision.id)}
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="rounded-lg overflow-hidden border shadow-lg">
                      <img
                        src={vision.url}
                        alt={vision.prompt}
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vision.timestamp).toLocaleDateString()} at{" "}
                      {new Date(vision.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-3">
                <label htmlFor="vision-prompt" className="text-sm font-medium block">
                  What would you like to visualise today?
                </label>
                <Textarea
                  id="vision-prompt"
                  placeholder="a peaceful sunrise over calm water"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isGenerating}
                />
              </div>
              
              <Button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating your vision...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 mr-2" />
                    Generate Vision
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="p-8 rounded-lg bg-muted/50 border text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium mb-2">Generating your image</p>
                  <p className="text-sm text-muted-foreground">
                    Creating a visual that captures your feelings...
                  </p>
                </div>
              </div>
            )}

            {generatedImage && !isGenerating && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground italic mb-3">
                    {generatedImage.caption || getRandomMessage()}
                  </p>
                  <div className="rounded-lg overflow-hidden border shadow-lg">
                    <img
                      src={generatedImage.url}
                      alt="Your emotional vision"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveToGallery}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Save to Gallery
                  </Button>
                  <Button
                    onClick={handleGenerateAnother}
                    variant="default"
                    className="flex-1"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Another
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
