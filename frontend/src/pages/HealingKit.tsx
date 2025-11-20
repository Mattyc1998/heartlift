import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { HealingKitNav } from "@/components/HealingKitNav";
import { HealingPlan } from "@/components/HealingPlan";
import { DailyAffirmations } from "@/components/DailyAffirmations";
import { VisualisationPractices } from "@/components/VisualisationPractices";
import { NoContactTracker } from "@/components/NoContactTracker";
import { JournalPrompts } from "@/components/JournalPrompts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";

export default function HealingKit() {
  const { user, hasHealingKit } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("plan");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasHealingKit) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md mx-auto">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Healing Kit Required</h1>
          <p className="text-muted-foreground mb-4">
            You need to purchase the Healing Kit to access these features.
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

  const renderSection = () => {
    switch (activeSection) {
      case "plan":
        return <HealingPlan />;
      case "affirmations":
        return <DailyAffirmations />;
      case "visualisations":
        return <VisualisationPractices />;
      case "tracker":
        return <NoContactTracker />;
      case "journal":
        return <JournalPrompts />;
      default:
        return <HealingPlan />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mt-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/?tab=coaches", { replace: true })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Coaches
          </Button>
        </div>
        
        <Card className="mb-8 overflow-hidden border-2 shadow-xl">
          <div className="bg-gradient-to-br from-healing/10 via-healing/5 to-background p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-healing to-healing-glow shadow-2xl animate-pulse">
                <Heart className="w-12 h-12 text-healing-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-healing to-healing-glow bg-clip-text text-transparent">
                Your Healing Kit
              </h1>
              <p className="text-xl font-semibold text-foreground">
                Your personalised toolkit for emotional recovery and growth 💚
              </p>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Navigate through heartbreak and emotional challenges with proven techniques. Track your progress, practice daily affirmations, and build the foundation for healthier relationships ahead.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-healing rounded-full"></div>
                <span>30-Day Structured Plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-healing rounded-full"></div>
                <span>Daily Practices</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-healing rounded-full"></div>
                <span>Progress Tracking</span>
              </div>
            </div>
          </div>
        </Card>

        <HealingKitNav activeSection={activeSection} onSectionChange={setActiveSection} />
        
        {renderSection()}
      </div>
    </div>
  );
}