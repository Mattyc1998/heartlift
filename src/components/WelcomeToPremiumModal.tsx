import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, MessageSquare, Heart, Zap, Check, X, Sparkles, Users, BarChart3, Download, Headphones } from "lucide-react";

interface WelcomeToPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const WelcomeToPremiumModal = ({ isOpen, onClose, userName = "there" }: WelcomeToPremiumModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: MessageSquare,
      title: "Unlimited AI Conversations",
      description: "Chat with all coaches as much as you want - no daily limits!",
      gradient: "from-blue-400 to-blue-500",
      bgColor: "from-blue-50 to-blue-100"
    },
    {
      icon: Users,
      title: "All Coach Personas",
      description: "Access Luna Love, Dr. Sage, Phoenix Fire, and River Calm anytime",
      gradient: "from-purple-400 to-purple-500",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      icon: Heart,
      title: "Text Conversation Helpers",
      description: "Get custom message templates and rewriting suggestions",
      gradient: "from-pink-400 to-pink-500",
      bgColor: "from-pink-50 to-pink-100"
    },
    {
      icon: BarChart3,
      title: "Advanced Mood Analytics",
      description: "Weekly trends, emotion patterns, and personalized insights",
      gradient: "from-green-400 to-green-500",
      bgColor: "from-green-50 to-green-100"
    },
    {
      icon: Sparkles,
      title: "Personalized Reports",
      description: "Dating patterns, attachment analysis, and healing roadmaps",
      gradient: "from-yellow-400 to-orange-400",
      bgColor: "from-yellow-50 to-orange-100"
    },
    {
      icon: Download,
      title: "Text Helpers",
      description: "Message suggestions, rewriting tools, and conversation analysis",
      gradient: "from-indigo-400 to-indigo-500",
      bgColor: "from-indigo-50 to-indigo-100"
    }
  ];

  const currentFeature = features[currentStep] || features[0];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500 animate-pulse-warm" />
            Welcome to Premium, {userName}! ✨
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">
              Your premium coaching experience is now unlocked! Here's what you can do:
            </p>
            <Progress value={((currentStep + 1) / features.length) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {currentStep + 1} of {features.length} features
            </p>
          </div>

          <Card className={`border-0 shadow-warm bg-gradient-to-br ${currentFeature.bgColor} animate-fade-in-scale`}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 relative">
                <div className={`p-4 rounded-full bg-gradient-to-r ${currentFeature.gradient} shadow-lg animate-float-gentle`}>
                  <currentFeature.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 text-2xl animate-bounce-gentle">
                  ✨
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">{currentFeature.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {currentFeature.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-7 gap-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                  index === currentStep
                    ? 'border-primary bg-primary/10 shadow-gentle'
                    : index < currentStep
                    ? 'border-green-500 bg-green-50'
                    : 'border-border bg-background'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <feature.icon className={`w-4 h-4 mx-auto ${
                  index === currentStep 
                    ? 'text-primary' 
                    : index < currentStep 
                    ? 'text-green-500' 
                    : 'text-muted-foreground'
                }`} />
                {index < currentStep && (
                  <Check className="w-3 h-3 text-green-500 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Crown className="w-3 h-3 mr-1" />
                Premium Active
              </Badge>
            </div>
            
            <Button 
              variant="warm" 
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep === features.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Exploring!
                </>
              ) : (
                <>
                  Next
                  <span className="text-xs">({features.length - currentStep - 1} left)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};