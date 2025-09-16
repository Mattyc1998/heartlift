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
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold text-foreground tracking-tight leading-tight">
            Heart
            <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-glow">
              Lift
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Your pocket relationship wellbeing coach with personality 💖
            <br className="hidden sm:block" />
            <span className="text-base sm:text-lg">Navigate love, heartbreak, and communication with AI coaches who truly get you</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
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
              className={`group p-4 sm:p-6 lg:p-8 bg-card/80 backdrop-blur-sm rounded-2xl shadow-card border border-border hover:shadow-warm transition-all duration-500 hover:scale-[1.02] animate-slide-up bg-gradient-to-br ${feature.gradient}`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="relative mb-4">
                <feature.icon className="w-10 h-10 text-primary mb-3 mx-auto group-hover:animate-bounce-gentle" />
                <div className="absolute -top-1 -right-8 text-lg">{feature.emoji}</div>
              </div>
              <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button 
                variant="warm" 
                size="lg" 
                className="px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold group relative overflow-hidden w-full sm:w-auto"
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
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              🆓 Free to start
            </span>
            <span className="w-1 h-1 bg-muted-foreground/50 rounded-full"></span>
            <span className="flex items-center gap-1">
              ⭐ Premium from £11.99/month
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};