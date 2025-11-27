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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreImages, setHasMoreImages] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDailyCount();
    }
  }, [user?.id]);

  const loadDailyCount = async () => {
    if (!user?.id) return;

    try {
      // Get today's count (fast query)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('heart_visions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      setDailyCount(count || 0);
    } catch (error) {
      console.error('Error loading daily count:', error);
    }
  };

  const loadGallery = async (loadMore = false) => {
    if (!user?.id) return;

    try {
      setIsLoadingMore(true);
      const currentCount = loadMore ? savedVisions.length : 0;
      const pageSize = 6; // Load 6 images at a time for faster loading
      
      const { data, error } = await supabase
        .from('heart_visions')
        .select('id, image_url, caption, prompt, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(currentCount, currentCount + pageSize - 1);

      if (error) {
        console.error('Error loading gallery:', error);
        return;
      }

      if (data) {
        const formattedVisions = data.map(v => ({
          id: v.id,
          url: v.image_url,
          caption: v.caption || '',
          prompt: v.prompt,
          timestamp: new Date(v.created_at).getTime(),
        }));
        
        if (loadMore) {
          setSavedVisions(prev => [...prev, ...formattedVisions]);
        } else {
          setSavedVisions(formattedVisions);
        }
        
        // Check if there are more images
        setHasMoreImages(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setIsLoadingMore(false);
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
      // Call new AI backend endpoint for image generation
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/heart-vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          user_name: getFirstName()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate image: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data?.image_base64) {
        throw new Error("No image data in response");
      }

      // Convert base64 to data URL for display
      const imageUrl = `data:image/png;base64,${data.image_base64}`;

      setGeneratedImage({
        url: imageUrl,
        caption: data.caption,
      });
      setDailyCount(prev => prev + 1);
      toast.success("Your vision has been created!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(error instanceof Error ? error.message : "Unable to generate your vision. Please try again.");
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
                You get 2 images per day • {dailyCount}/2 used today
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
            onClick={() => {
              setShowGallery(true);
              loadGallery();
            }}
            variant={showGallery ? "default" : "outline"}
            size="sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Gallery
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
                        "{vision.prompt}"
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
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {new Date(vision.timestamp).toLocaleDateString()} at{" "}
                        {new Date(vision.timestamp).toLocaleTimeString()}
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            // For mobile (iOS/Android), save to photo library
                            if ('Capacitor' in window) {
                              const { Filesystem, Directory } = await import('@capacitor/filesystem');
                              const { Share } = await import('@capacitor/share');
                              
                              // Fetch the image
                              const response = await fetch(vision.url);
                              const blob = await response.blob();
                              const base64 = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                              });
                              
                              // Save to filesystem temporarily
                              const fileName = `heartvision-${new Date(vision.timestamp).getTime()}.png`;
                              const savedFile = await Filesystem.writeFile({
                                path: fileName,
                                data: base64,
                                directory: Directory.Cache
                              });
                              
                              // Use Share API to save to Photos
                              await Share.share({
                                title: 'Save HeartVision',
                                text: 'Save this image to your photos',
                                url: savedFile.uri,
                                dialogTitle: 'Save to Photos'
                              });
                              
                              toast({
                                title: "Image ready!",
                                description: "Tap 'Save Image' to add to your photos"
                              });
                            } else {
                              // For web, use standard download
                              const response = await fetch(vision.url);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `heartvision-${new Date(vision.timestamp).getTime()}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                              
                              toast({
                                title: "Downloaded!",
                                description: "Image saved to downloads"
                              });
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            toast({
                              title: "Download failed",
                              description: "Please try again",
                              variant: "destructive"
                            });
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMoreImages && savedVisions.length > 0 && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => loadGallery(true)}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    {isLoadingMore ? "Loading..." : "Load More Images"}
                  </Button>
                </div>
              )}
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
