import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Frown, Meh, Smile, Laugh, Sparkles, Sun, Cloud, TrendingUp } from "lucide-react";

const moodOptions = [
  { 
    id: 1, 
    icon: Frown, 
    label: "Struggling", 
    emoji: "😢",
    color: "text-blue-600", 
    bg: "hover:bg-blue-50 border-blue-200",
    gradient: "from-blue-400 to-blue-500",
    message: "It's okay to not be okay. You're brave for checking in. 💙"
  },
  { 
    id: 2, 
    icon: Meh, 
    label: "Low", 
    emoji: "😔",
    color: "text-indigo-600", 
    bg: "hover:bg-indigo-50 border-indigo-200",
    gradient: "from-indigo-400 to-indigo-500",
    message: "Taking it one step at a time. You're doing your best. 💜"
  },
  { 
    id: 3, 
    icon: Smile, 
    label: "Neutral", 
    emoji: "😐",
    color: "text-gray-600", 
    bg: "hover:bg-gray-50 border-gray-200",
    gradient: "from-gray-400 to-gray-500",
    message: "Balanced and present. Sometimes neutral is exactly right. ⚖️"
  },
  { 
    id: 4, 
    icon: Laugh, 
    label: "Good", 
    emoji: "🙂",
    color: "text-green-600", 
    bg: "hover:bg-green-50 border-green-200",
    gradient: "from-green-400 to-green-500",
    message: "Lovely to see you feeling good today! Keep nurturing this energy. 🌱"
  },
  { 
    id: 5, 
    icon: Heart, 
    label: "Amazing", 
    emoji: "😊",
    color: "text-pink-600", 
    bg: "hover:bg-pink-50 border-pink-200",
    gradient: "from-pink-400 to-pink-500",
    message: "You're radiating joy! Share this beautiful energy with the world. ✨"
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
      <Card className="shadow-warm bg-gradient-to-br from-background to-muted border-0 animate-fade-in-scale">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-primary to-primary-glow w-fit animate-pulse-warm">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <div className="text-6xl animate-bounce-gentle">{selectedMoodData.emoji}</div>
            <CardTitle className="text-2xl">Thank you for sharing! 💖</CardTitle>
            <CardDescription className="text-lg">
              {selectedMoodData.message}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-600">7 Day Streak</p>
              <p className="text-xs text-green-600">You're amazing! 🔥</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-purple-600">Self-Care</p>
              <p className="text-xs text-purple-600">Growing daily ✨</p>
            </div>
          </div>
          <Button 
            variant="gentle" 
            onClick={() => {
              setHasSubmitted(false);
              setSelectedMood(null);
            }}
            className="px-8"
          >
            <Heart className="w-4 h-4 mr-2" />
            Check In Again Tomorrow
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sun className="w-6 h-6 text-yellow-500 animate-pulse-warm" />
          <h2 className="text-3xl font-bold text-foreground">Daily Check-in</h2>
          <Cloud className="w-6 h-6 text-blue-400 animate-float-gentle" />
        </div>
        <p className="text-muted-foreground text-lg">{currentPrompt}</p>
      </div>

      <Card className="shadow-warm bg-gradient-to-br from-background to-muted border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-primary animate-pulse-warm" />
            How's your heart today?
          </CardTitle>
          <CardDescription className="text-base">
            Your feelings are valid and important. Let's check in together 💝
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-5 gap-3">
            {moodOptions.map((mood, index) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;
              
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`group p-6 rounded-2xl border-2 transition-all duration-500 hover:scale-105 hover:shadow-warm animate-slide-up ${
                    isSelected 
                      ? `border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-warm ${mood.bg}` 
                      : `border-border hover:border-primary/50 ${mood.bg}`
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-3">
                    <div className="text-4xl group-hover:animate-bounce-gentle transition-all">
                      {mood.emoji}
                    </div>
                    <Icon className={`w-6 h-6 mx-auto ${mood.color} group-hover:scale-110 transition-transform`} />
                    <p className="text-xs font-semibold text-center group-hover:text-primary transition-colors">
                      {mood.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {selectedMood && selectedMoodData && (
            <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-2xl border border-primary/20 animate-fade-in-scale">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {selectedMoodData.message}
              </p>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              variant="warm" 
              onClick={handleSubmit}
              disabled={!selectedMood}
              className="px-10 py-4 text-lg font-semibold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Save Today's Check-In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};