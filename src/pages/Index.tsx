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

  // Scroll to top when changing tabs (especially important for mobile)
  useEffect(() => {
    if (currentTab !== 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentTab]);

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
        <PricingSection backTo="home" />
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
            <h1 className="text-xl sm:text-2xl font-bold">HeartLift</h1>
          </div>
          
          <div className="flex items-center gap-2">
              <Button 
                variant="gentle" 
                size="sm"
                onClick={() => setCurrentTab("home")}
                className="text-xs sm:text-sm min-h-[44px] px-4"
              >
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 min-h-[44px]">
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
          <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-4 h-14 sm:h-10 sticky top-0 z-10 backdrop-blur-sm">
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-2 min-h-[44px]">
              <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-1 sm:mt-0 sm:hidden lg:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-2 min-h-[44px]">
              <TrendingUp className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-1 sm:mt-0 sm:hidden lg:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-2 min-h-[44px]">
              <Heart className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-1 sm:mt-0 sm:hidden lg:inline">Coaches</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1 p-2 min-h-[44px]">
              <CreditCard className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm mt-1 sm:mt-0 sm:hidden lg:inline">Plans</span>
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
            <div className="max-w-6xl mx-auto px-4">
              {/* Welcome Section */}
              <div className="text-center space-y-4 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl">👋</span>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Welcome{user?.email ? `, ${user.email.split('@')[0].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[0].split('.')[0].slice(1)}` : ''}!
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  We're here to support your growth and healing journey. Your personalized coaching experience awaits.
                </p>
              </div>

              {/* Main CTA Card */}
              <div className="mb-8">
                <div 
                  onClick={() => setCurrentTab("chat")}
                  className="group cursor-pointer bg-gradient-to-br from-primary/10 via-primary-glow/5 to-secondary/10 border border-primary/20 rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Start Your Journey</h2>
                  <p className="text-muted-foreground mb-4">Connect with your AI coach anytime. Your path to healing starts with a conversation.</p>
                  <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                    Start Chat Now
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Track Mood Card */}
                <div 
                  onClick={() => setCurrentTab("mood")}
                  className="cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Track Your Mood</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Monitor your emotional journey and discover patterns in your healing process.</p>
                  <span className="text-xs text-primary font-medium group-hover:underline">Explore Mood Tracker →</span>
                </div>

                {/* Meet Coaches Card */}
                <div className="bg-card border border-border rounded-xl p-6 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-lg">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="font-semibold">Meet Your Coaches</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Choose from specialized AI coaches, each with their unique approach to support you.</p>
                  
                  {/* Compact Coach Preview */}
                  <div className="space-y-2">
                    <CoachPersonas 
                      onSelectCoach={setSelectedCoach}
                      selectedCoach={selectedCoach}
                      compact={true}
                    />
                  </div>
                </div>

                {/* Your Plans Card */}
                <div 
                  onClick={() => setCurrentTab("pricing")}
                  className="cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold">Your Growth Path</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Unlock advanced features and premium coaching tools for deeper insights.</p>
                  <span className="text-xs text-primary font-medium group-hover:underline">View Plans →</span>
                </div>
              </div>

              {/* Progress Checklist */}
              <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  Your Journey Progress
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Start first chat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center">
                      <span className="text-xs text-primary">2</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Log today's mood</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">3</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Explore your plan</span>
                  </div>
                </div>
              </div>

              {/* Premium Management - if user has subscriptions */}
              {(isPremium || hasHealingKit) && (
                <div className="mt-8">
                  <PremiumManagement />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PricingSection backTo="coaches" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
