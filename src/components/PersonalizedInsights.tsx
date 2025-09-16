import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, TrendingUp, Target, Download, RefreshCw, Calendar, Clock, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InsightReport {
  id: string;
  report_type: string;
  insights: {
    emotionalPatterns: string[];
    communicationStyle: string;
    relationshipGoals: string[];
    healingProgressScore: number;
    keyInsights: {
      strengths: string[];
      areasForGrowth: string[];
      progressSigns: string[];
    };
    personalizedRecommendations: Array<{
      category: string;
      recommendation: string;
      why: string;
    }>;
    moodTrends: {
      pattern: string;
      triggers: string[];
      improvements: string[];
    };
    nextSteps: string[];
  };
  conversation_count: number;
  mood_entries_analyzed: number;
  attachment_style: string;
  healing_progress_score: number;
  analysis_period_start: string;
  analysis_period_end: string;
  created_at: string;
}

export const PersonalizedInsights = () => {
  const { user, isPremium } = useAuth();
  const [currentReport, setCurrentReport] = useState<InsightReport | null>(null);
  const [pastReports, setPastReports] = useState<InsightReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    if (user && isPremium) {
      loadReports();
    }
  }, [user, isPremium]);

  const loadReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: reports, error } = await supabase
        .from('user_insights_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (reports && reports.length > 0) {
        setCurrentReport(reports[0] as unknown as InsightReport);
        setPastReports(reports as unknown as InsightReport[]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      toast.info("Analyzing your conversations and generating personalized insights...");
      
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast.success("Your personalized insights have been generated!");
      await loadReports(); // Refresh the reports
      setActiveTab("current"); // Switch to current report view
      
    } catch (error) {
      console.error('Error generating insights:', error);
      if (error.message?.includes('quota') || error.message?.includes('503')) {
        toast.error("AI insights are temporarily unavailable due to high demand. Please try again later.");
      } else {
        toast.error("Failed to generate insights. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: InsightReport) => {
    const reportContent = `
Personal Relationship Insights Report
Generated: ${new Date(report.created_at).toLocaleDateString()}
Analysis Period: ${new Date(report.analysis_period_start).toLocaleDateString()} - ${new Date(report.analysis_period_end).toLocaleDateString()}

ATTACHMENT STYLE: ${report.attachment_style}
HEALING PROGRESS: ${report.healing_progress_score}%

DATA ANALYZED:
• ${report.conversation_count} conversations with coaches
• ${report.mood_entries_analyzed} mood tracking entries

EMOTIONAL PATTERNS:
${report.insights.emotionalPatterns.map(pattern => `• ${pattern}`).join('\n')}

COMMUNICATION STYLE: ${report.insights.communicationStyle}

KEY INSIGHTS:
Strengths:
${report.insights.keyInsights.strengths.map(strength => `• ${strength}`).join('\n')}

Areas for Growth:
${report.insights.keyInsights.areasForGrowth.map(area => `• ${area}`).join('\n')}

Progress Signs:
${report.insights.keyInsights.progressSigns.map(sign => `• ${sign}`).join('\n')}

MOOD TRENDS:
Pattern: ${report.insights.moodTrends.pattern}
Triggers: ${report.insights.moodTrends.triggers.join(', ')}
Improvements: ${report.insights.moodTrends.improvements.join(', ')}

PERSONALIZED RECOMMENDATIONS:
${report.insights.personalizedRecommendations.map(rec => 
  `${rec.category}: ${rec.recommendation}\nWhy: ${rec.why}\n`
).join('\n')}

NEXT STEPS:
${report.insights.nextSteps.map(step => `• ${step}`).join('\n')}

This report was generated by AI analysis of your conversations with HeartLift coaches and mood tracking data.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartlift-insights-${new Date(report.created_at).toISOString().split('T')[0]}.txt`;
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
          <Button 
            variant="warm" 
            onClick={() => {
              const from = window.location.pathname + window.location.search;
              window.location.href = `/premium-purchase?from=${encodeURIComponent(from)}`;
            }}
          >
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
            {currentReport && (
              <Button 
                variant="outline" 
                onClick={() => downloadReport(currentReport)}
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Report</TabsTrigger>
              <TabsTrigger value="history">Report History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              {currentReport && !isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        Attachment Style
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-primary">{currentReport.attachment_style}</p>
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
                            style={{ width: `${currentReport.healing_progress_score}%` }}
                          />
                        </div>
                        <span className="font-medium">{currentReport.healing_progress_score}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Emotional Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentReport.insights.emotionalPatterns.map((pattern, index) => (
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
                      <CardTitle className="text-lg">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">Strengths</h4>
                        <ul className="space-y-1">
                          {currentReport.insights.keyInsights.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Star className="w-3 h-3 mt-0.5 text-green-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 text-orange-600">Areas for Growth</h4>
                        <ul className="space-y-1">
                          {currentReport.insights.keyInsights.areasForGrowth.map((area, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Target className="w-3 h-3 mt-0.5 text-orange-500" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentReport.insights.personalizedRecommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{rec.category}</Badge>
                            </div>
                            <p className="font-medium mb-2">{rec.recommendation}</p>
                            <p className="text-sm text-muted-foreground">{rec.why}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Analysis Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Conversations Analyzed</p>
                          <p className="font-medium">{currentReport.conversation_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mood Entries</p>
                          <p className="font-medium">{currentReport.mood_entries_analyzed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Generated</p>
                          <p className="font-medium">{new Date(currentReport.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No insights generated yet. Click "Generate New Insights" to create your personalized report based on your conversations with coaches.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {pastReports.length > 0 ? (
                <div className="space-y-4">
                  {pastReports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Report from {new Date(report.created_at).toLocaleDateString()}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {report.conversation_count} conversations
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {report.mood_entries_analyzed} mood entries
                              </span>
                              <Badge variant="outline">{report.attachment_style}</Badge>
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Progress Score: {report.healing_progress_score}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentReport(report)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No report history available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};