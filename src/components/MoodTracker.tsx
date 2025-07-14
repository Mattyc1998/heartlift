import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Frown, Meh, Smile, Laugh } from "lucide-react";

const moodOptions = [
  { id: 1, icon: Frown, label: "Struggling", color: "text-red-500", bg: "hover:bg-red-50" },
  { id: 2, icon: Meh, label: "Okay", color: "text-orange-500", bg: "hover:bg-orange-50" },
  { id: 3, icon: Smile, label: "Good", color: "text-yellow-500", bg: "hover:bg-yellow-50" },
  { id: 4, icon: Laugh, label: "Great", color: "text-green-500", bg: "hover:bg-green-50" },
  { id: 5, icon: Heart, label: "Amazing", color: "text-pink-500", bg: "hover:bg-pink-50" }
];

const prompts = [
  "How are you feeling in your love life today?",
  "What's your emotional energy like right now?",
  "How would you describe your heart's state today?",
  "On a scale of healing, where are you today?",
  "How connected do you feel to yourself today?"
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

  if (hasSubmitted) {
    return (
      <Card className="shadow-gentle">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-gradient-to-r from-primary to-primary-glow w-fit">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Thank you for checking in!</CardTitle>
          <CardDescription>
            Your emotional journey matters. Keep tracking your progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Streak: <span className="font-semibold text-primary">7 days</span>
          </p>
          <Button 
            variant="gentle" 
            onClick={() => {
              setHasSubmitted(false);
              setSelectedMood(null);
            }}
          >
            Check In Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-gentle">
      <CardHeader>
        <CardTitle className="text-xl text-center">Daily Check-In</CardTitle>
        <CardDescription className="text-center text-lg">
          {currentPrompt}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-5 gap-2">
          {moodOptions.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.id;
            
            return (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-gentle' 
                    : 'border-border hover:border-primary/50'
                } ${mood.bg}`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${mood.color}`} />
                <p className="text-xs font-medium text-center">{mood.label}</p>
              </button>
            );
          })}
        </div>
        
        <div className="text-center">
          <Button 
            variant="warm" 
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="px-8"
          >
            Save Check-In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};