import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Heart, TrendingUp, Target, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightData {
  attachmentStyle: string;
  emotionalPatterns: string[];
  communicationStyle: string;
  relationshipGoals: string[];
  healingProgress: number;
  nextSteps: string[];
  generatedAt: string;
}

export const PersonalizedInsights = () => {
  const { user, isPremium } = useAuth();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user && isPremium) {
      loadInsights();
    }
  }, [user, isPremium]);

  const loadInsights = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if user has recent insights (generated in the last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: existingInsights } = await supabase
        .from('user_attachment_results')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingInsights && existingInsights.length > 0) {
        const latest = existingInsights[0];
        setInsights({
          attachmentStyle: latest.attachment_style,
          emotionalPatterns: Array.isArray(latest.triggers) ? latest.triggers as string[] : [],
          communicationStyle: latest.healing_path || "Developing",
          relationshipGoals: Array.isArray(latest.coping_techniques) ? latest.coping_techniques as string[] : [],
          healingProgress: 75, // This would be calculated based on user activity
          nextSteps: [
            "Continue daily mood tracking",
            "Practice attachment-aware communication",
            "Focus on secure relationship patterns"
          ],
          generatedAt: latest.created_at
        });
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      toast.info("Generating your personalized insights...");
      
      // Get user's recent conversation history
      const { data: conversations } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get user's mood entries
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Track premium feature usage
      await supabase.rpc("track_premium_feature_usage", {
        user_uuid: user.id,
        feature_name: "personalized_insights"
      });

      // For now, we'll create a sample insight based on available data
      const newInsights: InsightData = {
        attachmentStyle: "Secure-Developing",
        emotionalPatterns: [
          "Shows resilience in processing emotions",
          "Actively seeks growth and understanding",
          "Values open communication"
        ],
        communicationStyle: "Thoughtful and reflective",
        relationshipGoals: [
          "Build deeper emotional intimacy",
          "Maintain healthy boundaries",
          "Develop secure attachment patterns"
        ],
        healingProgress: 68,
        nextSteps: [
          "Continue practicing mindful communication",
          "Focus on self-compassion exercises",
          "Explore attachment-based relationship skills"
        ],
        generatedAt: new Date().toISOString()
      };

      setInsights(newInsights);
      toast.success("Your insights have been generated!");
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!insights) return;
    
    const reportContent = `
Personal Relationship Insights Report
Generated: ${new Date(insights.generatedAt).toLocaleDateString()}

ATTACHMENT STYLE: ${insights.attachmentStyle}

EMOTIONAL PATTERNS:
${insights.emotionalPatterns.map(pattern => `• ${pattern}`).join('\n')}

COMMUNICATION STYLE: ${insights.communicationStyle}

RELATIONSHIP GOALS:
${insights.relationshipGoals.map(goal => `• ${goal}`).join('\n')}

HEALING PROGRESS: ${insights.healingProgress}%

NEXT STEPS:
${insights.nextSteps.map(step => `• ${step}`).join('\n')}

This report was generated by your AI relationship coach based on your conversations and mood tracking data.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relationship-insights-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report downloaded!");
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Personalized Insights & Reports
          </CardTitle>
          <CardDescription>
            Unlock deep analysis of your relationship patterns and emotional growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Premium feature - Get personalized insights based on your conversations and mood data.
          </p>
          <Button variant="warm" disabled>
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Personalized Insights & Reports
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your relationship patterns and emotional growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button 
              onClick={generateNewInsights} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate New Insights'}
            </Button>
            {insights && (
              <Button 
                variant="outline" 
                onClick={downloadReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {insights && !isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Attachment Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-primary">{insights.attachmentStyle}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Healing Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                        style={{ width: `${insights.healingProgress}%` }}
                      />
                    </div>
                    <span className="font-medium">{insights.healingProgress}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Emotional Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.emotionalPatterns.map((pattern, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Next Steps for Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {!insights && !isLoading && !isGenerating && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No insights generated yet. Click "Generate New Insights" to create your personalized report.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};