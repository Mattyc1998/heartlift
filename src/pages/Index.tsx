import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CoachPersonas } from "@/components/CoachPersonas";
import { ChatInterface } from "@/components/ChatInterface";
import { MoodTracker } from "@/components/MoodTracker";
import { PricingSection } from "@/components/PricingSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, TrendingUp, CreditCard } from "lucide-react";

const coachData = {
  flirty: { name: "Luna Love", personality: "flirty", greeting: "Hey gorgeous! Ready to turn heads? ✨" },
  therapist: { name: "Dr. Sage", personality: "therapist", greeting: "I'm here to help you understand yourself better." },
  "tough-love": { name: "Phoenix Fire", personality: "tough-love", greeting: "Time for some real talk. Ready to level up?" },
  chill: { name: "River Calm", personality: "chill", greeting: "Take a deep breath. Let's figure this out together." }
};

const Index = () => {
  const [selectedCoach, setSelectedCoach] = useState<string>("therapist");
  const [currentTab, setCurrentTab] = useState("home");

  const handleGetStarted = () => {
    setCurrentTab("chat");
  };

  if (currentTab === "home") {
    return (
      <div className="min-h-screen">
        <HeroSection onGetStarted={handleGetStarted} />
        <PricingSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary-glow">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">HeartWise</h1>
          </div>
          
          <Button 
            variant="gentle" 
            onClick={() => setCurrentTab("home")}
          >
            Back to Home
          </Button>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Coaches</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CoachPersonas 
                  onSelectCoach={setSelectedCoach}
                  selectedCoach={selectedCoach}
                  compact={true}
                />
              </div>
              <div className="lg:col-span-2">
                <ChatInterface 
                  coachName={coachData[selectedCoach as keyof typeof coachData]?.name || "Dr. Sage"}
                  coachPersonality={coachData[selectedCoach as keyof typeof coachData]?.personality || "therapist"}
                  coachGreeting={coachData[selectedCoach as keyof typeof coachData]?.greeting || "I'm here to help you understand yourself better."}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <MoodTracker />
            </div>
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <CoachPersonas 
                onSelectCoach={setSelectedCoach}
                selectedCoach={selectedCoach}
              />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PricingSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
