import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Crown, Clock, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PremiumUpgradeModal } from "./PremiumUpgradeModal";
import { UsageCounter } from "./UsageCounter";
import { WelcomeToPremiumModal } from "./WelcomeToPremiumModal";
import { PremiumBadge } from "./PremiumBadge";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  isPremiumTeaser?: boolean;
}

interface ChatInterfaceProps {
  coachName: string;
  coachPersonality: string;
  coachGreeting?: string;
}

export const ChatInterface = ({ coachName, coachPersonality, coachGreeting }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [remainingMessages, setRemainingMessages] = useState(10);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<"usage_limit" | "premium_teaser">("usage_limit");
  const [conversationLoaded, setConversationLoaded] = useState(false);

  const { user, isPremium, checkSubscription } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUsageCount();
    }
  }, [user, coachPersonality]);

  useEffect(() => {
    // Show welcome modal when user becomes premium
    if (isPremium && !showWelcomeModal) {
      const hasSeenWelcome = localStorage.getItem('hasSeenPremiumWelcome');
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        localStorage.setItem('hasSeenPremiumWelcome', 'true');
      }
    }
  }, [isPremium]);

  // Load conversation history when coach changes
  useEffect(() => {
    if (user && coachPersonality) {
      loadConversationHistory();
    }
  }, [user, coachPersonality]);

  const loadConversationHistory = async () => {
    if (!user) return;

    try {
      const { data: history, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('coach_id', coachPersonality)
        .order('created_at', { ascending: true })
        .limit(50); // Load last 50 messages

      if (error) throw error;

      if (history && history.length > 0) {
        const loadedMessages: Message[] = history.map((msg, index) => ({
          id: `${msg.id}-${index}`,
          content: msg.message_content,
          sender: msg.sender as 'user' | 'coach',
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(loadedMessages);
      } else {
        // No history found, show default greeting
        setMessages([
          {
            id: '1',
            content: coachGreeting || `Hi there! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?`,
            sender: 'coach',
            timestamp: new Date()
          }
        ]);
      }
      
      setConversationLoaded(true);
    } catch (error) {
      console.error("Error loading conversation history:", error);
      // Fallback to default greeting
      setMessages([
        {
          id: '1',
          content: coachGreeting || `Hi there! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?`,
          sender: 'coach',
          timestamp: new Date()
        }
      ]);
      setConversationLoaded(true);
    }
  };

  const loadUsageCount = async () => {
    if (!user) return;

    try {
      const { data: usageData } = await supabase
        .rpc("get_user_daily_usage", { user_uuid: user.id, coach_id: coachPersonality })
        .single();

      if (usageData) {
        const totalUsed = usageData.message_count || 0;
        const remaining = Math.max(0, 10 - totalUsed);
        setUsageCount(totalUsed);
        setRemainingMessages(remaining);
        setCanSendMessage(usageData.can_send_message || false);
      }
    } catch (error) {
      console.error("Error loading usage count:", error);
    }
  };


  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !user) return;

    if (!canSendMessage && !isPremium) {
      setUpgradeModalTrigger("usage_limit");
      setShowUpgradeModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputMessage,
          coachId: coachPersonality,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          requestRegenerate: false
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        if (error.message?.includes("usage_limit_reached")) {
          setCanSendMessage(false);
          setUpgradeModalTrigger("usage_limit");
          setShowUpgradeModal(true);
          return;
        }
        throw error;
      }

      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'coach',
        timestamp: new Date(),
        isPremiumTeaser: data.isPremiumTeaser || false
      };

      setMessages(prev => [...prev, coachResponse]);
      setUsageCount(data.usageCount || 0);
      setRemainingMessages(data.remainingMessages || 0);
      setCanSendMessage(data.canSendMore !== false);
      

      // Refresh usage data to update the counter display
      await loadUsageCount();

      if (data.isPremiumTeaser) {
        setUpgradeModalTrigger("premium_teaser");
        setShowUpgradeModal(true);
      }

      if (data.showUpgradeModal) {
        setUpgradeModalTrigger("usage_limit");
        setShowUpgradeModal(true);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const regenerateResponse = async (messageId: string) => {
    if (!isPremium) return;
    
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.sender !== 'user') return;
    
    setIsTyping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          coachId: coachPersonality,
          conversationHistory: messages.slice(0, messageIndex - 1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          requestRegenerate: true
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Replace the bot response
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(updatedMessages);
      
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const refreshConversation = async () => {
    if (!user) return;

    try {
      // Clear conversation history from database
      await supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', user.id)
        .eq('coach_id', coachPersonality);

      // Reset to default greeting
      const greeting = coachGreeting || `Hi there! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?`;
      setMessages([{
        id: '1',
        content: greeting,
        sender: 'coach',
        timestamp: new Date()
      }]);

      toast({
        title: "Conversation refreshed",
        description: "Started a fresh conversation with " + coachName,
      });
    } catch (error) {
      console.error('Error refreshing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to refresh conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <UsageCounter 
        currentUsage={usageCount}
        onUpgradeClick={() => {
          setUpgradeModalTrigger("usage_limit");
          setShowUpgradeModal(true);
        }}
        isPremium={isPremium}
      />

      <Card className="h-[500px] sm:h-[600px] flex flex-col shadow-gentle">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary-glow">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <span>{coachName}</span>
              {isPremium && <PremiumBadge variant="compact" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshConversation}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              disabled={isTyping}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 px-4 h-full">
            <div className="space-y-4 pb-4 pt-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.isPremiumTeaser
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border border-orange-200'
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
                    
                    {message.isPremiumTeaser && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUpgradeModalTrigger("premium_teaser");
                            setShowUpgradeModal(true);
                          }}
                          className="bg-gradient-to-r from-primary to-primary-glow text-white border-0"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          Unlock Premium
                        </Button>
                      </div>
                    )}
                    
                    {message.sender === 'coach' && isPremium && !message.isPremiumTeaser && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateResponse(message.id)}
                          className="text-xs"
                          disabled={isTyping}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    )}
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
          
          
          <div className="p-3 sm:p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  !canSendMessage && !isPremium
                    ? "Daily limit reached - upgrade to continue"
                    : isPremium
                    ? "Ask me anything... (Premium)"
                     : `Share what's on your heart... (${remainingMessages} left)`
                }
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
                disabled={(!canSendMessage && !isPremium) || isTyping}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isTyping || (!canSendMessage && !isPremium)}
                variant="warm"
                size="icon"
              >
                {(!canSendMessage && !isPremium) ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {!canSendMessage && !isPremium && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">Daily limit reached</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpgradeModal(true)}
                  className="ml-auto bg-gradient-to-r from-primary to-primary-glow text-white border-0"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={upgradeModalTrigger}
        coachName={coachName}
      />
      
      <WelcomeToPremiumModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userName={user?.user_metadata?.full_name || "there"}
      />
    </div>
  );
};