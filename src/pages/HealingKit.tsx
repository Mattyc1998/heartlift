import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { HealingKitNav } from "@/components/HealingKitNav";
import { HealingPlan } from "@/components/HealingPlan";
import { DailyAffirmations } from "@/components/DailyAffirmations";
import { GuidedMeditations } from "@/components/GuidedMeditations";
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
      case "meditations":
        return <GuidedMeditations />;
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
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/?tab=coaches", { replace: true })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Your Healing Kit
          </h1>
          <p className="text-muted-foreground">
            Your personalized toolkit for emotional recovery and growth
          </p>
        </div>

        <HealingKitNav activeSection={activeSection} onSectionChange={setActiveSection} />
        
        {renderSection()}
      </div>
    </div>
  );
}