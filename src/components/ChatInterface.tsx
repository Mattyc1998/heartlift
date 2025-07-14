import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

interface ChatInterfaceProps {
  coachName: string;
  coachPersonality: string;
}

const generateCoachResponse = (message: string, personality: string): string => {
  const responses = {
    flirty: [
      "Oh honey, I love that you're putting yourself out there! 💕 Dating is like a dance - sometimes you lead, sometimes you follow. What's got your heart all fluttery?",
      "Sweetie, confidence is your best accessory! Tell me more about what's making you feel uncertain - we'll get you glowing again! ✨",
      "You're already taking the right step by reaching out! Let's turn that dating anxiety into excitement, shall we? 😘"
    ],
    therapist: [
      "Thank you for sharing that with me. It sounds like you're experiencing some complex emotions around this situation. Can you tell me more about what you're feeling right now?",
      "I hear you, and what you're experiencing is completely valid. Many people go through similar challenges in relationships. Let's explore this together.",
      "It's important to acknowledge these feelings you're having. They're telling us something valuable about your needs and boundaries."
    ],
    "tough-love": [
      "Alright, let's get real here. You know what you need to do, but you're looking for permission to avoid the hard truth. I'm here to give you the reality check you need.",
      "Stop making excuses and start making moves! You deserve better than settling for breadcrumbs. What's really holding you back?",
      "Time for some tough love: you can't control other people, only your response to them. So what are you going to choose to do differently?"
    ],
    chill: [
      "Hey there! 😊 Sounds like you've got some relationship stuff on your mind. No worries, we've all been there. Want to talk it through?",
      "Life's too short to stress about things we can't control, you know? Let's figure out what you CAN control and go from there.",
      "Breathe for a second. Whatever's going on, we'll figure it out together. No judgment here, just good vibes and real talk."
    ]
  };

  const coachResponses = responses[personality as keyof typeof responses] || responses.therapist;
  return coachResponses[Math.floor(Math.random() * coachResponses.length)];
};

export const ChatInterface = ({ coachName, coachPersonality }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi there! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?`,
      sender: 'coach',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateCoachResponse(inputMessage, coachPersonality),
        sender: 'coach',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, coachResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card className="h-[600px] flex flex-col shadow-gentle">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary-glow">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span>{coachName}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-3 h-3" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse-warm"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse-warm" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse-warm" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share what's on your heart..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              variant="warm"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};