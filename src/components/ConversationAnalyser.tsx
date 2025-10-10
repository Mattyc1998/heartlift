import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, TrendingUp, Lightbulb, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  emotionalTone: {
    user: string;
    partner: string;
    overall: string;
  };
  miscommunicationPatterns: Array<{
    pattern: string;
    description: string;
    examples: string[];
  }>;
  suggestions: Array<{
    issue: string;
    betterResponse: string;
    explanation: string;
  }>;
  overallAssessment: string;
}

export const ConversationAnalyser = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversationText, setConversationText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyseConversation = async () => {
    if (!conversationText.trim()) {
      toast({
        title: "Please enter a conversation",
        description: "Paste or type the conversation you'd like to analyse.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: {
          conversationText: conversationText.trim(),
          userId: user?.id,
        },
      });

      if (error) throw error;

      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: "Your conversation has been analysed successfully.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analysing your conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversation Analyser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste your conversation below:
            </label>
            <Textarea
              placeholder="You: Hey, how was your day?&#10;Them: Fine.&#10;You: Just fine? You seem upset about something...&#10;&#10;(Paste your full conversation here)"
              value={conversationText}
              onChange={(e) => setConversationText(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={analyseConversation}
            disabled={isAnalyzing || !conversationText.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analysing Conversation...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Analyse Conversation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Emotional Tone Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Emotional Tone Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Your Tone</h4>
                  <p className="text-muted-foreground">{analysis.emotionalTone.user}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Their Tone</h4>
                  <p className="text-muted-foreground">{analysis.emotionalTone.partner}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Overall Dynamic</h4>
                <p className="text-muted-foreground">{analysis.emotionalTone.overall}</p>
              </div>
            </CardContent>
          </Card>

          {/* Miscommunication Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧩 Miscommunication Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.miscommunicationPatterns.map((pattern, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{pattern.pattern}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                  {pattern.examples.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium mb-1">Examples:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {pattern.examples.map((example, idx) => (
                          <li key={idx} className="italic">"{example}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 What You Could Have Said Differently
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-destructive">{suggestion.issue}</h4>
                  <div className="bg-primary/5 rounded p-3 mb-2">
                    <h5 className="text-sm font-medium mb-1">Better Response:</h5>
                    <p className="text-sm italic">"{suggestion.betterResponse}"</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Overall Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.overallAssessment}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};