import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, BookOpen, Target, Award, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const HealingKitPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const features = useMemo(() => [
    { icon: Calendar, title: '30-Day Healing Plan', description: 'Daily content, prompts, and challenges to guide your recovery' },
    { icon: BookOpen, title: 'Visualisation Practices', description: 'Step-by-step mental imagery exercises for healing and growth' },
    { icon: Sparkles, title: 'Daily Affirmations', description: 'Powerful affirmations to rebuild your self-worth' },
    { icon: Target, title: 'No-Contact Tracker', description: 'Track your progress and maintain healthy boundaries' },
    { icon: Award, title: 'Journal Prompts', description: '15 deep-dive prompts for self-discovery and healing' },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-accent/30 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (from) navigate(from, { replace: true });
            else navigate('/?tab=coaches');
          }}
          className="mb-6 hover:bg-secondary/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
              One-time Purchase
            </Badge>
          </div>
          
          <CardHeader className="text-center pb-6">
            <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-primary/10 to-primary-glow/10 w-fit mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Healing Kit
            </CardTitle>
            <div className="space-y-2">
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold text-foreground">£3.99</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Lifetime Access
              </Badge>
            </div>
            <CardDescription className="text-center text-lg">
              Complete break-up recovery package
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">What's Included</h3>
              <div className="grid grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 border border-secondary/30">
                    <feature.icon className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  To get your Healing Kit, please contact support
                </p>
                <p className="text-sm text-muted-foreground">
                  Email us at support@example.com to get your Healing Kit activated
                </p>
              </div>
            </div>

            {/* Additional Purchase Options */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Buy Premium
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Buy Healing Kit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
