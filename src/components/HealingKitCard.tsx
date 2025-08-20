import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Headphones, BookOpen, Target, Award, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const HealingKitCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to purchase the Healing Kit",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    navigate('/healing-kit-purchase');
  };

  const features = [
    {
      icon: Calendar,
      title: "30-Day Healing Plan",
      description: "Daily content, prompts, and challenges to guide your recovery"
    },
    {
      icon: Headphones,
      title: "Guided Meditations",
      description: "5 professional meditations for letting go and inner peace"
    },
    {
      icon: Sparkles,
      title: "Daily Affirmations",
      description: "Powerful affirmations to rebuild your self-worth"
    },
    {
      icon: Target,
      title: "No-Contact Tracker",
      description: "Track your progress and maintain healthy boundaries"
    },
    {
      icon: BookOpen,
      title: "Journal Prompts",
      description: "15 deep-dive prompts for self-discovery and healing"
    }
  ];

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="absolute top-4 right-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
          Premium
        </Badge>
      </div>
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Healing Kit
          </CardTitle>
        </div>
        <p className="text-muted-foreground text-sm">
          Complete recovery program designed to guide you through heartbreak to healing
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary/30">
              <feature.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-primary">£3.99</p>
              <p className="text-xs text-muted-foreground">One-time purchase • Lifetime access</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('test-healing-kit', {
                      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
                    });
                    if (error) throw error;
                    if (data?.success) { 
                      toast({ title: "✅ Test Healing Kit Activated!" });
                      setTimeout(() => window.location.reload(), 1000);
                    }
                  } catch (error) {
                    console.error('Test healing kit error:', error);
                    toast({ title: "❌ Error activating test kit", variant: "destructive" });
                  }
                }}
              >
                🧪 TEST Kit
              </Button>
              <Button 
                onClick={handlePurchase}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-8"
              >
                {isLoading ? "Processing..." : "Get Healing Kit"}
              </Button>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
};