import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Frown, Meh, Smile, Laugh, Sparkles, Sun, Cloud, TrendingUp, Stars, Rainbow } from "lucide-react";

const moodOptions = [
  { 
    id: 1, 
    icon: Frown, 
    label: "Struggling", 
    emoji: "😰",
    color: "from-blue-500 to-indigo-600", 
    bgGlow: "shadow-blue-200/30",
    iconColor: "text-blue-600",
    message: "It's okay to not be okay. You're brave for checking in. 💙",
    lightBg: "bg-gradient-to-br from-blue-50/50 to-indigo-50/50"
  },
  { 
    id: 2, 
    icon: Meh, 
    label: "Low", 
    emoji: "😔",
    color: "from-purple-500 to-violet-600", 
    bgGlow: "shadow-purple-200/30",
    iconColor: "text-purple-600",
    message: "Taking it one step at a time. You're doing your best. 💜",
    lightBg: "bg-gradient-to-br from-purple-50/50 to-violet-50/50"
  },
  { 
    id: 3, 
    icon: Smile, 
    label: "Neutral", 
    emoji: "😐",
    color: "from-slate-500 to-gray-600", 
    bgGlow: "shadow-slate-200/30",
    iconColor: "text-slate-600",
    message: "Balanced and present. Sometimes neutral is exactly right. ⚖️",
    lightBg: "bg-gradient-to-br from-slate-50/50 to-gray-50/50"
  },
  { 
    id: 4, 
    icon: Laugh, 
    label: "Good", 
    emoji: "😊",
    color: "from-emerald-500 to-green-600", 
    bgGlow: "shadow-emerald-200/30",
    iconColor: "text-emerald-600",
    message: "Lovely to see you feeling good today! Keep nurturing this energy. 🌱",
    lightBg: "bg-gradient-to-br from-emerald-50/50 to-green-50/50"
  },
  { 
    id: 5, 
    icon: Heart, 
    label: "Amazing", 
    emoji: "🥰",
    color: "from-pink-500 to-rose-600", 
    bgGlow: "shadow-pink-200/30",
    iconColor: "text-pink-600",
    message: "You're radiating joy! Share this beautiful energy with the world. ✨",
    lightBg: "bg-gradient-to-br from-pink-50/50 to-rose-50/50"
  }
];

const prompts = [
  "How is your heart feeling today? 💖",
  "What's your emotional weather like right now? ⛅",
  "How would you describe your inner landscape today? 🌱",
  "On your healing journey, where are you today? 🌈",
  "How connected do you feel to yourself today? ✨"
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedMood) {
      setHasSubmitted(true);
      // Here you would save the mood data
    }
  };

  const selectedMoodData = selectedMood ? moodOptions.find(m => m.id === selectedMood) : null;

  if (hasSubmitted && selectedMoodData) {
    return (
      <div className="px-2 sm:px-0 animate-fade-in-scale">
        <Card className="shadow-float bg-gradient-to-br from-card via-card/95 to-secondary/10 border-0 backdrop-blur-sm overflow-hidden relative">
          {/* Celebratory decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-glow to-accent"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full blur-3xl animate-pulse-warm"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-full blur-3xl animate-float-gentle"></div>
          
          <CardHeader className="text-center space-y-6 relative z-10 pt-8 sm:pt-12">
            <div className="relative">
              <div className="mx-auto p-4 sm:p-6 rounded-full bg-gradient-to-r from-primary to-primary-glow w-fit animate-pulse-warm shadow-float">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce-gentle">✨</div>
              <div className="absolute -top-1 -left-3 text-lg animate-pulse-warm">🎉</div>
            </div>
            
            <div className="space-y-4">
              <div className="text-5xl sm:text-6xl animate-bounce-gentle mb-4">{selectedMoodData.emoji}</div>
              <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Thank you for sharing! 💖
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                {selectedMoodData.message}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="text-center space-y-8 relative z-10 pb-8 sm:pb-12">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl border border-emerald-100 backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 mx-auto mb-3 animate-bounce-gentle" />
                <p className="text-sm sm:text-base font-bold text-emerald-700">7 Day Streak</p>
                <p className="text-xs sm:text-sm text-emerald-600 mt-1">You're amazing! 🔥</p>
              </div>
              <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-2xl border border-purple-100 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-3 animate-pulse-warm" />
                <p className="text-sm sm:text-base font-bold text-purple-700">Self-Care</p>
                <p className="text-xs sm:text-sm text-purple-600 mt-1">Growing daily ✨</p>
              </div>
            </div>
            
            {/* Tomorrow Button */}
            <Button 
              variant="gentle" 
              size="lg"
              onClick={() => {
                setHasSubmitted(false);
                setSelectedMood(null);
              }}
              className="px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-gentle hover:shadow-warm transition-all duration-300"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Check In Again Tomorrow
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Header Section */}
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 animate-pulse-warm" />
              <div className="absolute -top-1 -right-1 text-xs">☀️</div>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Daily Check-in
            </h2>
            <div className="relative">
              <Cloud className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 animate-float-gentle" />
              <div className="absolute -top-1 -right-1 text-xs">☁️</div>
            </div>
          </div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Stars className="w-4 h-4 text-primary/40 animate-pulse-warm" />
          </div>
          <div className="absolute -top-4 right-1/4">
            <Rainbow className="w-5 h-5 text-primary/30 animate-float-gentle" />
          </div>
        </div>
        <div className="max-w-md mx-auto">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium">
            {currentPrompt}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="shadow-float bg-gradient-to-br from-card via-card/95 to-secondary/10 border-0 backdrop-blur-sm overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-glow to-accent"></div>
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-r from-accent/5 to-secondary/5 rounded-full blur-3xl"></div>
        
        <CardHeader className="text-center pb-4 sm:pb-6 relative z-10">
          <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-primary animate-pulse-warm" />
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              How's your heart today?
            </span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Your feelings are valid and important. Let's check in together 💝
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 sm:space-y-8 relative z-10">
          {/* Mood Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {moodOptions.map((mood, index) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;
              
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`group relative p-4 sm:p-6 rounded-3xl border-2 transition-all duration-500 hover:scale-105 active:scale-95 animate-slide-up ${
                    isSelected 
                      ? `border-primary shadow-float ${mood.lightBg} ring-2 ring-primary/20` 
                      : `border-border/50 hover:border-primary/30 bg-card/50 hover:bg-card backdrop-blur-sm`
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect when selected */}
                  {isSelected && (
                    <>
                      <div className={`absolute inset-0 bg-gradient-to-r ${mood.color} opacity-5 rounded-3xl`}></div>
                      <div className={`absolute -inset-1 bg-gradient-to-r ${mood.color} opacity-10 rounded-3xl blur-sm`}></div>
                    </>
                  )}
                  
                  <div className="relative space-y-2 sm:space-y-3">
                    <div className="text-3xl sm:text-4xl group-hover:animate-bounce-gentle transition-all duration-300 group-hover:scale-110">
                      {mood.emoji}
                    </div>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto ${mood.iconColor} group-hover:scale-110 transition-all duration-300 ${isSelected ? 'scale-110' : ''}`} />
                    <p className={`text-xs sm:text-sm font-semibold text-center transition-colors duration-300 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {mood.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Selected Mood Message */}
          {selectedMood && selectedMoodData && (
            <div className={`text-center p-4 sm:p-6 ${selectedMoodData.lightBg} rounded-3xl border border-primary/10 animate-fade-in-scale relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary-glow/5"></div>
              <div className="relative">
                <div className="text-2xl mb-2">{selectedMoodData.emoji}</div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                  {selectedMoodData.message}
                </p>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="text-center pt-2">
            <Button 
              variant="warm" 
              onClick={handleSubmit}
              disabled={!selectedMood}
              size="lg"
              className={`px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 ${
                selectedMood ? 'animate-pulse-warm shadow-float' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Save Today's Check-In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};