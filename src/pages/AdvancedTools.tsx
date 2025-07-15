import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AttachmentStyleQuiz } from "@/components/AttachmentStyleQuiz";
import { RecoveryMilestones } from "@/components/RecoveryMilestones";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Heart, Target, Star } from "lucide-react";

export default function AdvancedTools() {
  const { user, isPremium } = useAuth();
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
          <p className="text-muted-foreground mb-4">
            Upgrade to premium to access advanced psychological tools and insights.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Home
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Advanced Tools
            </h1>
            <Badge variant="default" className="bg-gradient-to-r from-primary to-primary-glow">
              Premium
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Professional-grade psychological assessments and recovery tracking
          </p>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={activeSection === "quiz" ? "default" : "outline"}
              onClick={() => setActiveSection("quiz")}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Attachment Style Quiz
            </Button>
            <Button
              variant={activeSection === "milestones" ? "default" : "outline"}
              onClick={() => setActiveSection("milestones")}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Recovery Milestones
            </Button>
          </div>
        </Card>

        <div className="max-w-4xl mx-auto">
          {activeSection === "quiz" && <AttachmentStyleQuiz />}
          {activeSection === "milestones" && <RecoveryMilestones />}
        </div>
      </div>
    </div>
  );
}