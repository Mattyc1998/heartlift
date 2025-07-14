import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Zap, Coffee, Sparkles, Star } from "lucide-react";

const coaches = [
  {
    id: "flirty",
    name: "Luna Love",
    icon: Heart,
    emoji: "💖",
    description: "Your confidence coach for dating, flirting, and magnetic attraction",
    personality: "Playful, empowering, and charmingly bold",
    specialties: ["Dating confidence", "Flirting tips", "Self-love"],
    greeting: "Hey gorgeous! Ready to turn heads? ✨",
    color: "from-pink-400 to-rose-500",
    bgColor: "from-pink-50 to-rose-50",
    accent: "text-pink-600",
    shadowColor: "shadow-pink-200/50"
  },
  {
    id: "therapist",
    name: "Dr. Sage",
    icon: Brain,
    emoji: "🧠",
    description: "Licensed therapist specializing in attachment and relationship patterns",
    personality: "Compassionate, insightful, and evidence-based",
    specialties: ["Attachment styles", "Communication", "Healing trauma"],
    greeting: "I'm here to help you understand yourself better.",
    color: "from-purple-400 to-indigo-500",
    bgColor: "from-purple-50 to-indigo-50",
    accent: "text-purple-600",
    shadowColor: "shadow-purple-200/50"
  },
  {
    id: "tough-love",
    name: "Phoenix Fire",
    icon: Zap,
    emoji: "🔥",
    description: "Your no-BS mentor for radical self-transformation and boundary setting",
    personality: "Direct, motivating, and courageously honest",
    specialties: ["Tough love", "Boundaries", "Self-respect"],
    greeting: "Time for some real talk. Ready to level up?",
    color: "from-orange-400 to-red-500",
    bgColor: "from-orange-50 to-red-50",
    accent: "text-orange-600",
    shadowColor: "shadow-orange-200/50"
  },
  {
    id: "chill",
    name: "River Calm",
    icon: Coffee,
    emoji: "🌊",
    description: "Your laid-back friend for mindful healing and gentle perspective",
    personality: "Zen, supportive, and naturally wise",
    specialties: ["Mindfulness", "Gentle healing", "Perspective"],
    greeting: "Take a deep breath. Let's figure this out together.",
    color: "from-emerald-400 to-teal-500",
    bgColor: "from-emerald-50 to-teal-50",
    accent: "text-emerald-600",
    shadowColor: "shadow-emerald-200/50"
  }
];

interface CoachPersonasProps {
  onSelectCoach: (coachId: string) => void;
  selectedCoach?: string;
}

export const CoachPersonas = ({ onSelectCoach, selectedCoach }: CoachPersonasProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse-warm" />
          <h2 className="text-3xl font-bold text-foreground">Meet Your Coaches</h2>
          <Sparkles className="w-6 h-6 text-primary animate-pulse-warm" />
        </div>
        <p className="text-muted-foreground text-lg">Each coach brings their unique personality and wisdom to guide your journey</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {coaches.map((coach, index) => {
          const Icon = coach.icon;
          const isSelected = selectedCoach === coach.id;
          
          return (
            <Card 
              key={coach.id} 
              className={`cursor-pointer transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden animate-fade-in-scale ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-float bg-gradient-to-br ' + coach.bgColor 
                  : 'hover:shadow-warm bg-card'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => onSelectCoach(coach.id)}
            >
              {/* Floating background decoration */}
              <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r ${coach.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700`} />
              
              <CardHeader className="pb-4 relative">
                <div className="flex items-start space-x-4">
                  <div className={`relative p-3 rounded-2xl bg-gradient-to-r ${coach.color} shadow-lg group-hover:animate-bounce-gentle`}>
                    <Icon className="w-6 h-6 text-white" />
                    <div className="absolute -top-1 -right-1 text-lg">
                      {coach.emoji}
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                      {coach.name}
                    </CardTitle>
                    <CardDescription className={`text-sm font-medium ${coach.accent}`}>
                      {coach.personality}
                    </CardDescription>
                  </div>
                  {isSelected && (
                    <Star className="w-5 h-5 text-primary animate-pulse-warm" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {coach.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((specialty) => (
                    <span 
                      key={specialty}
                      className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${coach.color} text-white shadow-sm`}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                
                <div className={`p-3 rounded-lg bg-gradient-to-r ${coach.bgColor} border border-current border-opacity-10`}>
                  <p className={`text-sm italic ${coach.accent} font-medium`}>
                    "{coach.greeting}"
                  </p>
                </div>
                
                <Button 
                  variant={isSelected ? coach.id as any : "gentle"} 
                  size="sm" 
                  className="w-full transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCoach(coach.id);
                  }}
                >
                  {isSelected ? (
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Your Coach
                    </span>
                  ) : (
                    `Chat with ${coach.name.split(' ')[0]}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};