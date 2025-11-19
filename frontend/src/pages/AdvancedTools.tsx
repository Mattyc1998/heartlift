import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { AttachmentStyleQuiz } from "@/components/AttachmentStyleQuiz";
import { GuidedPrograms } from "@/components/GuidedPrograms";
import { ConversationAnalyser } from "@/components/ConversationAnalyser";
import { TextSuggestionHelper } from "@/components/TextSuggestionHelper";
import { PersonalisedInsights } from "@/components/PersonalisedInsights";
import { HeartVisions } from "@/components/HeartVisions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Target, ArrowLeft, MessageSquare, Bot, Brain, BookOpen, Palette } from "lucide-react";

export default function AdvancedTools() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("quiz");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md mx-auto">
          <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Premium Required</h1>
          <p className="text-muted-foreground mb-6">
            Upgrade to premium to access advanced psychological tools and insights.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </Button>
            <Button 
              variant="warm"
              onClick={() => {
                const from = window.location.pathname + window.location.search;
                window.location.href = `/premium-purchase?from=${encodeURIComponent(from)}`;
              }}
            >
              Upgrade to Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/?tab=coaches", { replace: true })}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Coaches
        </Button>
        
        <Card className="mb-8 overflow-hidden border-2 shadow-xl">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary to-primary-glow shadow-2xl animate-pulse">
                <Crown className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Advanced Tools
                </h1>
                <Badge variant="default" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-1 text-sm">
                  Premium
                </Badge>
              </div>
              <p className="text-xl font-semibold text-foreground">
                Unlock deeper insights into your relationship patterns
              </p>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover your attachment style, analyse conversations, get personalised text suggestions, and access guided programs designed to help you build healthier, more fulfilling relationships.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <Button
            variant={activeSection === "quiz" ? "default" : "outline"}
            onClick={() => setActiveSection("quiz")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">Attachment Quiz</span>
          </Button>
          <Button
            variant={activeSection === "analyser" ? "default" : "outline"}
            onClick={() => setActiveSection("analyser")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">Conversation Analyser</span>
          </Button>
          <Button
            variant={activeSection === "suggestions" ? "default" : "outline"}
            onClick={() => setActiveSection("suggestions")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <Bot className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">Text Helper</span>
          </Button>
          <Button
            variant={activeSection === "insights" ? "default" : "outline"}
            onClick={() => setActiveSection("insights")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">Insights & Reports</span>
          </Button>
          <Button
            variant={activeSection === "programs" ? "default" : "outline"}
            onClick={() => setActiveSection("programs")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">Guided Programs</span>
          </Button>
          <Button
            variant={activeSection === "heartvisions" ? "default" : "outline"}
            onClick={() => setActiveSection("heartvisions")}
            className="h-auto py-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
          >
            <Palette className="w-6 h-6" />
            <span className="text-xs sm:text-sm font-medium">HeartVisions</span>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeSection === "quiz" && <AttachmentStyleQuiz />}
          
          {activeSection === "analyser" && <ConversationAnalyser />}
          {activeSection === "suggestions" && <TextSuggestionHelper />}
          {activeSection === "insights" && <PersonalisedInsights />}
          {activeSection === "programs" && <GuidedPrograms />}
          {activeSection === "heartvisions" && <HeartVisions />}
        </div>
      </div>
    </div>
  );
}