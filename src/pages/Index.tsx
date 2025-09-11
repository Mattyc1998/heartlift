import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CoachPersonas } from "@/components/CoachPersonas";
import { ChatInterface } from "@/components/ChatInterface";
import { MoodTracker } from "@/components/MoodTracker";
import { PricingSection } from "@/components/PricingSection";
import { PremiumManagement } from "@/components/PremiumManagement";
import { SubscriptionStatusBanner } from "@/components/SubscriptionStatusBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, TrendingUp, CreditCard, Crown, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const coachData = {
  flirty: { name: "Luna Love", personality: "flirty", greeting: "Hey gorgeous! Ready to turn heads? ✨" },
  therapist: { name: "Dr. Sage", personality: "therapist", greeting: "I'm here to help you understand yourself better." },
  "tough-love": { name: "Phoenix Fire", personality: "tough-love", greeting: "Time for some real talk. Ready to level up?" },
  chill: { name: "River Calm", personality: "chill", greeting: "Take a deep breath. Let's figure this out together." }
};

const Index = () => {
  const [selectedCoach, setSelectedCoach] = useState<string>("therapist");
  const [currentTab, setCurrentTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'home';
  });
  const { isPremium, hasHealingKit, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Update tab when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab') || 'home';
    setCurrentTab(tabFromUrl);
  }, [location.search]);

  const handleGetStarted = () => {
    // Set flag to indicate user is navigating from home to chat
    if (user) {
      sessionStorage.setItem(`fromHome_${user.id}`, 'true');
    }
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        
        {/* Subscription Status Banner */}
        <SubscriptionStatusBanner />
        
        {/* Premium Navigation */}
        {(isPremium || hasHealingKit) && (
          <div className="flex justify-center gap-2 mb-6">
            {isPremium && (
              <Link to="/advanced-tools">
                <Button variant="outline" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Advanced Tools
                </Button>
              </Link>
            )}
            {hasHealingKit && (
              <Link to="/healing-kit">
                <Button variant="outline" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Healing Kit
                </Button>
              </Link>
            )}
          </div>
        )}
        
        {/* Mobile-optimized header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-primary to-primary-glow">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">HeartWise</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="gentle" 
              size="sm"
              onClick={() => setCurrentTab("home")}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="opacity-60">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/subscription-management')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Manage Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4 sm:space-y-6">
          {/* Mobile-optimized tab navigation */}
          <TabsList className="grid w-full max-w-sm sm:max-w-md mx-auto grid-cols-4 h-12 sm:h-10">
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-1 sm:p-2">
              <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-0.5 sm:mt-0 sm:hidden lg:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-1 sm:p-2">
              <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-0.5 sm:mt-0 sm:hidden lg:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-1 sm:p-2">
              <Heart className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-0.5 sm:mt-0 sm:hidden lg:inline">Coaches</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-1 sm:p-2">
              <CreditCard className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-0.5 sm:mt-0 sm:hidden lg:inline">Plans</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 mb-6">
              <h2 className="text-3xl font-bold text-foreground">Chat with your coaches</h2>
              <p className="text-muted-foreground text-lg">Start meaningful conversations with AI coaches who understand your unique journey</p>
            </div>
            
            {/* Premium Management */}
            <div className="max-w-4xl mx-auto mb-6">
              <PremiumManagement />
            </div>
            
            <div className="max-w-4xl mx-auto space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Mobile: Coach selector above chat, Desktop: Side by side */}
              <div className="lg:col-span-1 lg:order-1">
                <CoachPersonas 
                  onSelectCoach={setSelectedCoach}
                  selectedCoach={selectedCoach}
                  compact={true}
                />
              </div>
              <div className="lg:col-span-2 lg:order-2">
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
