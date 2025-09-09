import { Heart, BookOpen, Target, Calendar, Award, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HealingKitNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const HealingKitNav = ({ activeSection, onSectionChange }: HealingKitNavProps) => {
  const sections = [
    { id: "plan", label: "Healing Plan", icon: Target },
    { id: "affirmations", label: "Daily Affirmations", icon: Heart },
    { id: "visualisations", label: "Visualisation Practices", icon: BookOpen },
    { id: "tracker", label: "No Contact Tracker", icon: Calendar },
    { id: "journal", label: "Journal Prompts", icon: PenTool },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            onClick={() => onSectionChange(section.id)}
            className="flex items-center gap-2"
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};