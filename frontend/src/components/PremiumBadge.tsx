import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";

interface PremiumBadgeProps {
  variant?: "default" | "compact" | "floating";
  className?: string;
}

export const PremiumBadge = ({ variant = "default", className = "" }: PremiumBadgeProps) => {
  if (variant === "compact") {
    return (
      <Badge 
        variant="outline" 
        className={`bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 animate-pulse-warm ${className}`}
      >
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  }

  if (variant === "floating") {
    return (
      <div className={`fixed top-4 right-4 z-50 animate-float-gentle ${className}`}>
        <Badge 
          variant="outline" 
          className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 shadow-warm px-3 py-1"
        >
          <Crown className="w-4 h-4 mr-1" />
          Premium Active
          <Sparkles className="w-3 h-3 ml-1 animate-pulse-warm" />
        </Badge>
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 animate-glow ${className}`}
    >
      <Crown className="w-4 h-4 mr-2" />
      Premium Member
      <Sparkles className="w-3 h-3 ml-2 animate-pulse-warm" />
    </Badge>
  );
};