import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Zap, Coffee } from "lucide-react";

const coaches = [
  {
    id: "flirty",
    name: "Flirty Sage",
    icon: Heart,
    description: "Playful and confident advice for dating and attraction",
    personality: "Fun, encouraging, and slightly cheeky",
    color: "from-pink-400 to-pink-600"
  },
  {
    id: "therapist",
    name: "Dr. Empath",
    icon: Brain,
    description: "Professional therapeutic approach to relationships",
    personality: "Thoughtful, validating, and evidence-based",
    color: "from-purple-400 to-purple-600"
  },
  {
    id: "tough-love",
    name: "Truth Teller",
    icon: Zap,
    description: "Direct, no-nonsense relationship reality checks",
    personality: "Honest, challenging, and motivational",
    color: "from-orange-400 to-orange-600"
  },
  {
    id: "chill",
    name: "Chill Mate",
    icon: Coffee,
    description: "Relaxed, friend-like support and perspective",
    personality: "Casual, supportive, and understanding",
    color: "from-green-400 to-green-600"
  }
];

interface CoachPersonasProps {
  onSelectCoach: (coachId: string) => void;
  selectedCoach?: string;
}

export const CoachPersonas = ({ onSelectCoach, selectedCoach }: CoachPersonasProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Coach</h2>
        <p className="text-muted-foreground">Each coach has a unique approach to help you</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {coaches.map((coach) => {
          const Icon = coach.icon;
          const isSelected = selectedCoach === coach.id;
          
          return (
            <Card 
              key={coach.id} 
              className={`cursor-pointer transition-all duration-300 hover:shadow-gentle ${
                isSelected ? 'ring-2 ring-primary shadow-warm' : ''
              }`}
              onClick={() => onSelectCoach(coach.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${coach.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{coach.name}</CardTitle>
                    <CardDescription className="text-sm">{coach.personality}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{coach.description}</p>
                <Button 
                  variant={isSelected ? "warm" : "gentle"} 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCoach(coach.id);
                  }}
                >
                  {isSelected ? "Selected" : "Choose Coach"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};