import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      onGetStarted?.();
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Animated background with floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted to-secondary" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full blur-3xl animate-float-gentle" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-gradient-to-r from-secondary/15 to-accent/15 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-2xl animate-pulse-warm" />
      
      <div className="max-w-5xl mx-auto text-center space-y-12 animate-fade-in relative z-10">
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-6 rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-float animate-float-gentle">
                <Heart className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>
                ✨
              </div>
              <div className="absolute -bottom-1 -left-1 text-xl animate-pulse-warm" style={{ animationDelay: '1s' }}>
                💫
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-foreground tracking-tight leading-tight px-4 sm:px-0">
            Heart
            <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent font-black drop-shadow-sm">
              Lift
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium px-4 sm:px-0">
            Your pocket relationship wellbeing coach with personality 💖
            <br className="hidden sm:block" />
            <span className="text-sm sm:text-base lg:text-lg">Navigate love, heartbreak, and communication with AI coaches who truly get you</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-4 sm:px-0">
          {[
            {
              icon: MessageCircle,
              title: "AI Coaches with Soul",
              description: "Four unique personalities ready to support your relationship journey",
              emoji: "🤖💖",
              gradient: "from-pink-400/20 to-rose-400/20"
            },
            {
              icon: Heart,
              title: "Healing Toolkit",
              description: "No-contact tracker, daily check-ins, and personalized recovery plans",
              emoji: "🌱💪",
              gradient: "from-green-400/20 to-emerald-400/20"
            },
            {
              icon: TrendingUp,
              title: "Growth Tracking",
              description: "Visualize your emotional journey and celebrate every milestone",
              emoji: "📈✨",
              gradient: "from-purple-400/20 to-indigo-400/20"
            }
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className={`group p-3 sm:p-4 lg:p-6 xl:p-8 bg-card backdrop-blur-sm rounded-2xl border border-border/40 hover:border-primary/20 hover:shadow-warm transition-all duration-500 hover:scale-[1.02] animate-slide-up relative overflow-hidden`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Subtle background gradient based on feature type */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-40`} />
              <div className="relative z-10">
                <div className="relative mb-6">
                  <feature.icon className="w-12 h-12 sm:w-14 sm:h-14 text-primary mb-4 mx-auto group-hover:animate-bounce-gentle stroke-[1.5]" />
                  <div className="absolute -top-2 -right-6 text-xl sm:text-2xl">{feature.emoji}</div>
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              variant="warm" 
              size="lg" 
              className="px-6 sm:px-10 py-4 sm:py-4 text-base sm:text-lg font-semibold group relative overflow-hidden w-full sm:w-auto min-h-[48px] shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={handleGetStarted}
            >
            <span className="relative z-10 flex items-center gap-2">
              {user ? (
                <>
                  <Heart className="w-5 h-5 group-hover:animate-pulse-warm" />
                  {user.created_at && new Date().getTime() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000 
                    ? "Start Your Journey" 
                    : "Continue Your Journey"}
                </>
              ) : (
                <>
                  ✨ Start Your Healing Journey
                </>
              )}
            </span>
          </Button>
          </div>
          
          {/* Free to start highlight - moved below CTA */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-full border-2 border-emerald-200 shadow-sm">
              <span className="text-2xl">🆓</span>
              <span className="font-bold text-emerald-700 text-lg sm:text-xl">Free to start</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center pt-8 pb-4">
          <span className="flex items-center gap-2 text-muted-foreground text-base sm:text-lg">
            <span className="text-xl">⭐</span>
            <span>Premium from £11.99/month</span>
          </span>
        </div>
      </div>
    </section>
  );
};