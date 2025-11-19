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
    personalisedRecommendations?: Array<{
      category: string;
      recommendation: string;
      why: string;
    }>;
    personalizedRecommendations?: Array<{
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
  mood_entries_analyzed: number;  // Fixed: use 'analyzed' not 'analysed'
  attachment_style: string;
  healing_progress_score: number;
  analysis_period_start: string;
  analysis_period_end: string;
  created_at: string;
}

export const PersonalisedInsights = () => {
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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/insights/reports/${user.id}`);
      
      if (response.ok) {
        const reports = await response.json();
        
        if (reports && reports.length > 0) {
          setCurrentReport(reports[0] as InsightReport);
          setPastReports(reports as InsightReport[]);
        }
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
      toast.info("Analyzing your conversations and generating personalised insights...");
      
      // Call new AI backend endpoint
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const insights = await response.json();
      console.log('Received insights from backend:', insights);

      // Save to backend database
      const saveResponse = await fetch(`${backendUrl}/api/insights/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          insights: insights,
          conversation_count: insights.conversationCount || 0,
          mood_entries_analyzed: insights.moodEntriesAnalyzed || 0,
          attachment_style: insights.attachmentStyle || 'exploring',
          healing_progress_score: insights.healingProgressScore || 65,
          analysis_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          analysis_period_end: new Date().toISOString(),
        })
      });

      if (saveResponse.ok) {
        const savedReport = await saveResponse.json();
        console.log('Report saved successfully:', savedReport);
        setCurrentReport(savedReport as InsightReport);
        await loadReports();
        toast.success("Your personalised insights are ready and saved!");
      } else {
        console.error('Failed to save report');
        // Still show the insights even if save fails
        const tempReport: InsightReport = {
          id: `temp-${Date.now()}`,
          report_type: 'comprehensive',
          insights: insights,
          conversation_count: insights.conversationCount || 0,
          mood_entries_analyzed: insights.moodEntriesAnalyzed || 0,
          attachment_style: insights.attachmentStyle || 'exploring',
          healing_progress_score: insights.healingProgressScore || 65,
          analysis_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          analysis_period_end: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setCurrentReport(tempReport);
        toast.success("Your personalised insights are ready!");
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

DATA ANALYSED:
• ${report.conversation_count} conversations
• ${report.mood_entries_analysed} mood tracking entries

INSIGHTS SUMMARY:

COMMUNICATION STYLE: ${report.insights.communicationStyle || 'Not analysed'}

KEY INSIGHTS:
Strengths:
${(report.insights.keyInsights?.strengths || []).map(strength => `• ${strength}`).join('\n')}

Areas for Growth:
${(report.insights.keyInsights?.areasForGrowth || []).map(area => `• ${area}`).join('\n')}

Progress Signs:
${(report.insights.keyInsights?.progressSigns || []).map(sign => `• ${sign}`).join('\n')}

MOOD TRENDS:
Pattern: ${report.insights.moodTrends?.pattern || 'Not analysed'}
Triggers: ${(report.insights.moodTrends?.triggers || []).join(', ')}
Improvements: ${(report.insights.moodTrends?.improvements || []).join(', ')}

PERSONALISED RECOMMENDATIONS:
${(report.insights.personalisedRecommendations || []).map(rec =>
  `${rec.category}: ${rec.recommendation}\nWhy: ${rec.why}\n`
).join('\n')}

NEXT STEPS:
${(report.insights.nextSteps || []).map(step => `• ${step}`).join('\n')}

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
            Personalised Insights & Reports
          </CardTitle>
          <CardDescription>
            Unlock deep analysis of your relationship patterns and emotional growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Premium feature - Get personalised insights based on your conversations and mood data.
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Brain className="w-5 h-5 text-primary" />
            Personalised Insights & Reports
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            AI-powered analysis of your relationship patterns and emotional growth
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Button 
              onClick={generateNewInsights} 
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate New Insights'}
            </Button>
            {currentReport && (
              <Button 
                variant="outline" 
                onClick={() => downloadReport(currentReport)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                size="lg"
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
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        Attachment Style
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <p className="font-medium text-primary text-sm sm:text-base">{currentReport.attachment_style}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Healing Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                            style={{ width: `${currentReport.healing_progress_score}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">{currentReport.healing_progress_score}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Emotional Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <ul className="space-y-2 sm:space-y-3">
                        {(currentReport.insights.emotionalPatterns || []).map((pattern, index) => (
                          <li key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm sm:text-base leading-relaxed">{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                      <div>
                        <h4 className="font-medium mb-2 text-green-600 text-sm sm:text-base">Strengths</h4>
                        <ul className="space-y-2">
                          {(currentReport.insights.keyInsights?.strengths || []).map((strength, index) => (
                            <li key={index} className="text-sm sm:text-base p-2 rounded-lg bg-green-50 flex items-start gap-2">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 text-green-500 flex-shrink-0" />
                              <span className="leading-relaxed">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 text-orange-600 text-sm sm:text-base">Areas for Growth</h4>
                        <ul className="space-y-2">
                          {(currentReport.insights.keyInsights?.areasForGrowth || []).map((area, index) => (
                            <li key={index} className="text-sm sm:text-base p-2 rounded-lg bg-orange-50 flex items-start gap-2">
                              <Target className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                              <span className="leading-relaxed">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Personalised Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        {(currentReport.insights.personalizedRecommendations || currentReport.insights.personalisedRecommendations || []).map((rec, index) => (
                          <div key={index} className="border rounded-lg p-3 sm:p-4 bg-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs sm:text-sm">{rec.category}</Badge>
                            </div>
                            <p className="font-medium mb-2 text-sm sm:text-base leading-relaxed">{rec.recommendation}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{rec.why}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Analysis Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm sm:text-base">
                        <div className="p-3 rounded-lg bg-muted/30 text-center sm:text-left">
                          <p className="text-muted-foreground text-xs sm:text-sm">Conversations Analysed</p>
                          <p className="font-medium text-lg sm:text-xl">{currentReport.conversation_count}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 text-center sm:text-left">
                          <p className="text-muted-foreground text-xs sm:text-sm">Mood Entries</p>
                          <p className="font-medium text-lg sm:text-xl">{currentReport.mood_entries_analysed}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 text-center sm:text-left">
                          <p className="text-muted-foreground text-xs sm:text-sm">Generated</p>
                          <p className="font-medium text-lg sm:text-xl">{new Date(currentReport.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No insights generated yet. Click "Generate New Insights" to create your personalised report based on your conversations with coaches.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {pastReports && pastReports.length > 0 ? (
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
                            onClick={() => {
                              setCurrentReport(report);
                              setActiveTab("current");
                            }}
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