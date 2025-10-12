import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Palette } from "lucide-react";
import { toast } from "sonner";

export function HeartVisions() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    url: string;
    caption?: string;
  } | null>(null);

  const getFirstName = () => {
    if (!user?.user_metadata?.full_name) return "friend";
    return user.user_metadata.full_name.split(" ")[0];
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter what you'd like to visualise");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(
        "https://hook.eu2.make.com/oiltewa6xgujyghp6707u7sbdhiwlbzl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_name: getFirstName(),
            prompt: prompt.trim(),
            feature: "HeartVisions",
            tier: "premium",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      
      if (data.image_url) {
        setGeneratedImage({
          url: data.image_url,
          caption: data.caption,
        });
        toast.success("Your vision has been created!");
      } else {
        throw new Error("No image URL in response");
      }
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
              Create your own emotional visuals. Type what you'd like to see, and HeartLift will
              generate a personalised image that captures your feelings or intentions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
