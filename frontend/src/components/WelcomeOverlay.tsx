import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface WelcomeOverlayProps {
  firstName: string;
  onStartChat: () => void;
  onClose: () => void;
}

export function WelcomeOverlay({ firstName, onStartChat, onClose }: WelcomeOverlayProps) {
  const handleStartChat = () => {
    onStartChat();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md mx-auto shadow-2xl border-2 border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome, {firstName}! 👋
            </h2>
            <p className="text-muted-foreground text-lg">
              We're here to support your growth and healing.
            </p>
          </div>
          
          <Button 
            onClick={handleStartChat}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start Chatting with Your Coach 💬
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}