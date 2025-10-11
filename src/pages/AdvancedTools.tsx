import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { AttachmentStyleQuiz } from "@/components/AttachmentStyleQuiz";
import { GuidedPrograms } from "@/components/GuidedPrograms";
import { ConversationAnalyser } from "@/components/ConversationAnalyser";
import { TextSuggestionHelper } from "@/components/TextSuggestionHelper";
import { PersonalisedInsights } from "@/components/PersonalisedInsights";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Target, ArrowLeft, MessageSquare, Bot, Brain, BookOpen } from "lucide-react";

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
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/?tab=coaches", { replace: true })}
            className="flex items-center gap-2"
          >
          <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
        </div>
        
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-warm">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Advanced Tools
            </h1>
            <Badge variant="default" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              Premium
            </Badge>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-lg font-semibold text-foreground">
              Unlock deeper insights into your relationship patterns
            </p>
            <p className="text-muted-foreground">
              Discover your attachment style, analyse conversations, get personalised text suggestions, and access guided programs designed to help you build healthier, more fulfilling relationships.
            </p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={activeSection === "quiz" ? "default" : "outline"}
              onClick={() => setActiveSection("quiz")}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Attachment Quiz
            </Button>
            <Button
              variant={activeSection === "analyser" ? "default" : "outline"}
              onClick={() => setActiveSection("analyser")}
              className="flex-1 sm:flex-none"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversation Analyser
            </Button>
            <Button
              variant={activeSection === "suggestions" ? "default" : "outline"}
              onClick={() => setActiveSection("suggestions")}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Text Helper
            </Button>
            <Button
              variant={activeSection === "insights" ? "default" : "outline"}
              onClick={() => setActiveSection("insights")}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Insights & Reports
            </Button>
            <Button
              variant={activeSection === "programs" ? "default" : "outline"}
              onClick={() => setActiveSection("programs")}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Guided Programs
            </Button>
          </div>
        </Card>

        <div className="max-w-4xl mx-auto">
          {activeSection === "quiz" && <AttachmentStyleQuiz />}
          
          {activeSection === "analyser" && <ConversationAnalyser />}
          {activeSection === "suggestions" && <TextSuggestionHelper />}
          {activeSection === "insights" && <PersonalisedInsights />}
          {activeSection === "programs" && <GuidedPrograms />}
        </div>
      </div>
    </div>
  );
}