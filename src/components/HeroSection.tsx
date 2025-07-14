import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-background via-muted to-secondary">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-warm animate-float-gentle">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            Heart
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Wise
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your pocket relationship therapist. Navigate love, heartbreak, and communication with AI-powered emotional support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-6 bg-card rounded-xl shadow-card border border-border hover:shadow-gentle transition-all duration-300">
            <MessageCircle className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">AI Relationship Coach</h3>
            <p className="text-sm text-muted-foreground">Get personalized advice from multiple coach personas</p>
          </div>
          
          <div className="p-6 bg-card rounded-xl shadow-card border border-border hover:shadow-gentle transition-all duration-300">
            <Heart className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Break-up Recovery</h3>
            <p className="text-sm text-muted-foreground">Healing toolkit with no-contact tracker and daily check-ins</p>
          </div>
          
          <div className="p-6 bg-card rounded-xl shadow-card border border-border hover:shadow-gentle transition-all duration-300">
            <TrendingUp className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Emotional Growth</h3>
            <p className="text-sm text-muted-foreground">Track your mood and emotional journey over time</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            variant="warm" 
            size="lg" 
            className="px-8 py-3 text-lg"
            onClick={onGetStarted}
          >
            Start Your Healing Journey
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Free to start • Premium features from £11.99/month
          </p>
        </div>
      </div>
    </section>
  );
};