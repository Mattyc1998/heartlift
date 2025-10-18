import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  tone: string;
  message: string;
}

export const TextSuggestionHelper = () => {
  const { toast } = useToast();
  const [messageType, setMessageType] = useState("closure");
  const [relationship, setRelationship] = useState("romantic");
  const [userMessage, setUserMessage] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const messageTypes = [
    { value: "closure", label: "Closure Messages" },
    { value: "no_contact", label: "No-Contact Replies" },
    { value: "boundary", label: "Boundary-Setting Texts" },
    { value: "miss_you_response", label: '"I Miss You" Responses' },
    { value: "apologetic", label: "Apologetic Messages" },
    { value: "rejection", label: "Rejection Messages" },
    { value: "reconciliation", label: "Reconciliation Attempts" },
    { value: "angry_response", label: "Angry/Upset Responses" },
    { value: "moving_on", label: "Moving On Messages" },
    { value: "check_in", label: "Check-In Messages" },
    { value: "birthday_holiday", label: "Birthday/Holiday Messages" },
    { value: "neutral_reply", label: "Neutral Responses" },
    { value: "custom", label: "Improve My Message" },
  ];

  const relationships = [
    { value: "romantic", label: "Ex-Partner" },
    { value: "boyfriend", label: "Boyfriend" },
    { value: "girlfriend", label: "Girlfriend" },
    { value: "dating", label: "Someone You Dated" },
    { value: "talking_stage", label: "Talking Stage" },
    { value: "friend", label: "Ex-Friend" },
    { value: "situationship", label: "Situationship" },
    { value: "fwb", label: "Friends with Benefits" },
    { value: "hookup", label: "Hookup/Casual" },
  ];

  const generateSuggestions = async () => {
    if (messageType === "custom" && !userMessage.trim()) {
      toast({
        title: "Please enter your message",
        description: "Type the message you'd like help improving.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-text', {
        body: {
          messageType,
          relationship,
          userMessage: userMessage.trim(),
        },
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
      toast({
        title: "Suggestions Generated",
        description: "Here are some thoughtful message options for you.",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully!",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'gentle': return 'bg-green-100 text-green-800 border-green-200';
      case 'firm': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Text Suggestion Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Relationship Type</label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {messageType === "custom" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Message (to improve)
              </label>
              <Textarea
                placeholder="Type the message you want help improving..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button 
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              "Generate Message Suggestions"
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Suggested Messages</h3>
          {suggestions.map((suggestion, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={getToneColor(suggestion.tone)}>
                    {suggestion.tone.charAt(0).toUpperCase() + suggestion.tone.slice(1)} Tone
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion.message)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{suggestion.message}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};