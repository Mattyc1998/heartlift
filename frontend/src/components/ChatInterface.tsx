import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Crown, Clock, AlertCircle, Sparkles, RefreshCw, LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PremiumUpgradeModal } from "./PremiumUpgradeModal";
import { UsageCounter } from "./UsageCounter";
import { WelcomeToPremiumModal } from "./WelcomeToPremiumModal";
import { PremiumBadge } from "./PremiumBadge";
import { DailyReflection } from "./DailyReflection";

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
  coachGreetings?: string[];
  coachIcon?: LucideIcon;
  coachColor?: string;
}

export const ChatInterface = ({ coachName, coachPersonality, coachGreetings, coachIcon, coachColor }: ChatInterfaceProps) => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);
  const chatCardRef = useRef<HTMLDivElement>(null);

  const { user, isPremium, checkSubscription } = useAuth();
  const { toast } = useToast();

  // Auto-scroll chat messages DOWN when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      setTimeout(() => {
        // Scroll the chat messages container to the bottom
        const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Extract first name from user metadata or email
  const getFirstName = () => {
    if (!user) return '';
    
    // Try to get from user_metadata first
    if (user.user_metadata?.full_name) {
      const fullName = user.user_metadata.full_name;
      const firstName = fullName.split(' ')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    
    // Fallback to email prefix
    const emailPrefix = user.email?.split('@')[0] || '';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (user) {
      loadUsageCount();
    }
  }, [user, coachPersonality]);

  useEffect(() => {
    // Check for midnight reset every minute
    if (!isPremium && user) {
      const checkMidnightReset = setInterval(() => {
        const now = new Date();
        const lastCheck = localStorage.getItem(`lastUsageCheck_${user.id}`);
        const today = now.toISOString().split('T')[0];
        
        if (lastCheck && lastCheck !== today) {
          // It's a new day! Reset usage
          console.log('New day detected - resetting usage count');
          loadUsageCount();
        }
        
        localStorage.setItem(`lastUsageCheck_${user.id}`, today);
      }, 60000); // Check every minute
      
      return () => clearInterval(checkMidnightReset);
    }
  }, [user, isPremium]);

  useEffect(() => {
    // Show welcome modal when user becomes premium (only once per session)
    if (isPremium && !showWelcomeModal) {
      const hasSeenWelcome = localStorage.getItem('hasSeenPremiumWelcome');
      const sessionWelcomeShown = sessionStorage.getItem('premiumWelcomeShownThisSession');
      
      if (!hasSeenWelcome && !sessionWelcomeShown) {
        setShowWelcomeModal(true);
        sessionStorage.setItem('premiumWelcomeShownThisSession', 'true');
      }
    }
  }, [isPremium]);

  // Function to get a random personalized greeting
  const getRandomGreeting = () => {
    const firstName = getFirstName();
    
    console.log('Coach greetings received:', coachGreetings);
    console.log('Coach name:', coachName);
    
    if (!coachGreetings || coachGreetings.length === 0) {
      console.warn('No greetings array provided, using fallback');
      return firstName ? `Hi ${firstName}! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?` : `Hi there! I'm ${coachName}, and I'm here to support you through whatever you're going through. What's on your heart today?`;
    }
    
    // Randomly select one of the greeting variations
    const randomIndex = Math.floor(Math.random() * coachGreetings.length);
    const selectedGreeting = coachGreetings[randomIndex];
    
    console.log('Selected greeting template:', selectedGreeting);
    
    // Replace {firstName} placeholder with actual name
    const personalizedGreeting = selectedGreeting.replace('{firstName}', firstName || 'there');
    
    console.log('Final greeting:', personalizedGreeting);
    
    return personalizedGreeting;
  };

  // Load conversation history when coach changes - ensure greeting is always present
  useEffect(() => {
    if (user && coachPersonality) {
      // Clear any existing input and reset states when coach changes
      setInputMessage('');
      setIsTyping(false);
      
      // Run checks and load history in sequence
      const loadData = async () => {
        const wasRefreshed = await checkForDailyRefresh();
        
        // Only load history if we didn't just refresh (which clears everything)
        if (!wasRefreshed) {
          await loadConversationHistory();
        } else {
          // If we refreshed, create and save a new greeting
          const personalizedGreeting = getRandomGreeting();
          
          await supabase.rpc('insert_conversation_message', {
            p_user_id: user.id,
            p_coach_id: coachPersonality,
            p_message_content: personalizedGreeting,
            p_sender: 'coach'
          });
          
          setMessages([{
            id: '1',
            content: personalizedGreeting,
            sender: 'coach',
            timestamp: new Date()
          }]);
          setConversationLoaded(true);
        }
      };
      
      loadData();
    }
  }, [user, coachPersonality]);

  const checkForDailyRefresh = async () => {
    if (!user) return;
    
    const lastRefreshKey = `lastRefresh_${user.id}_${coachPersonality}`;
    const lastRefresh = localStorage.getItem(lastRefreshKey);
    const today = new Date().toDateString();
    
    // First time with this coach - just set the date, don't do anything else
    if (!lastRefresh) {
      localStorage.setItem(lastRefreshKey, today);
      return false; // Return false to indicate no refresh happened
    }
    
    // Only delete if it's actually a different day
    if (lastRefresh !== today) {
      // New day detected, refresh conversation
      try {
        await supabase
          .from('conversation_history')
          .delete()
          .eq('user_id', user.id)
          .eq('coach_id', coachPersonality);
        
        localStorage.setItem(lastRefreshKey, today);
        return true; // Return true to indicate refresh happened
      } catch (error) {
        console.error('Error during daily refresh:', error);
        return false;
      }
    }
    
    return false; // Same day, no refresh
  };

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

      if (error) {
        console.error('❌ SUPABASE ERROR - conversation_history:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId: user.id,
          coachId: coachPersonality
        });
        throw error;
      }
      
      console.log('✅ Loaded conversation history:', {
        count: history?.length || 0,
        userId: user.id,
        coachId: coachPersonality
      });

      // Always generate a fresh greeting regardless of history
      const personalizedGreeting = getRandomGreeting();

      if (history && history.length > 0) {
        // Filter out old coach greetings (first message if it's from coach)
        const conversationMessages = history.filter((msg, index) => 
          !(index === 0 && msg.sender === 'coach')
        );
        
        // If there are actual conversation messages (user messages), load them
        if (conversationMessages.length > 0) {
          const loadedMessages: Message[] = conversationMessages.map((msg, index) => ({
            id: `${msg.id}-${index}`,
            content: msg.message_content,
            sender: msg.sender as 'user' | 'coach',
            timestamp: new Date(msg.created_at)
          }));
          
          // Add fresh greeting at the start
          setMessages([
            {
              id: '1',
              content: personalizedGreeting,
              sender: 'coach',
              timestamp: new Date()
            },
            ...loadedMessages
          ]);
        } else {
          // Only greeting existed, show fresh one
          setMessages([{
            id: '1',
            content: personalizedGreeting,
            sender: 'coach',
            timestamp: new Date()
          }]);
        }
      } else {
        // No history found, show greeting
        setMessages([{
          id: '1',
          content: personalizedGreeting,
          sender: 'coach',
          timestamp: new Date()
        }]);
      }
      
      setConversationLoaded(true);
    } catch (error) {
      console.error("Error loading conversation history:", error);
      // On error, show greeting
      const personalizedGreeting = getRandomGreeting();
      setMessages([{
        id: '1',
        content: personalizedGreeting,
        sender: 'coach',
        timestamp: new Date()
      }]);
      setConversationLoaded(true);
    }
  };

  const loadUsageCount = async () => {
    if (!user) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/usage/check/${user.id}`);
      
      if (response.ok) {
        const usageData = await response.json();
        setUsageCount(usageData.message_count || 0);
        setRemainingMessages(usageData.remaining_messages || 10);
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
      // Check if user is authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Please sign in again to continue');
      }

      // Save user message to database
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachPersonality,
        p_message_content: inputMessage,
        p_sender: 'user'
      });

      // Call the new AI backend endpoint
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          coach_id: coachPersonality,
          conversation_history: messages.slice(-5).map(msg => ({
            content: msg.content,
            sender: msg.sender
          })),
          user_name: getFirstName() || undefined,
          user_id: user.id  // Send user ID so coach can access reflections
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.statusText}`);
      }

      const data = await response.json();

      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'coach',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, coachResponse]);
      
      // Save coach response to database
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachPersonality,
        p_message_content: data.response,
        p_sender: 'coach'
      });
      
      // Update usage count
      if (!isPremium) {
        // Track usage in backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        try {
          const usageResponse = await fetch(`${backendUrl}/api/usage/track`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              coach_id: coachPersonality
            })
          });

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsageCount(usageData.message_count);
            setRemainingMessages(usageData.remaining_messages);
            setCanSendMessage(usageData.can_send_message);
            
            if (!usageData.can_send_message) {
              setUpgradeModalTrigger("usage_limit");
              setShowUpgradeModal(true);
            }
          }
        } catch (error) {
          console.error("Error tracking usage:", error);
        }
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
      // Get fresh session token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Please sign in again to continue');
      }

      // Call the new AI backend endpoint
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          coach_id: coachPersonality,
          conversation_history: messages.slice(0, messageIndex - 1).map(m => ({
            content: m.content,
            sender: m.sender
          })),
          user_name: getFirstName() || undefined,
          user_id: user?.id  // Send user ID for reflection context
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate response: ${response.statusText}`);
      }

      const data = await response.json();

      // Replace the bot response
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(updatedMessages);

      // Update the coach response in database
      // Note: We need to delete and re-insert since we're regenerating
      // The database stores messages sequentially, regeneration replaces the last coach response
      
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

      // Clear local storage for this coach
      const lastRefreshKey = `lastRefresh_${user.id}_${coachPersonality}`;
      localStorage.removeItem(lastRefreshKey);
      
      // Mark this coach as manually refreshed to prevent reload
      const manualRefreshKey = `manualRefresh_${user.id}_${coachPersonality}`;
      localStorage.setItem(manualRefreshKey, new Date().toISOString());

      // Reset to default greeting and clear all messages
      const personalizedGreeting = getRandomGreeting();
      
      // Save the greeting to the database immediately
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachPersonality,
        p_message_content: personalizedGreeting,
        p_sender: 'coach'
      });
      
      setMessages([{
        id: '1',
        content: personalizedGreeting,
        sender: 'coach',
        timestamp: new Date()
      }]);

      // Reset conversation loaded state
      setConversationLoaded(false);
      setTimeout(() => setConversationLoaded(true), 100);

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
    <div className="space-y-2 sm:space-y-4">
      <UsageCounter 
        currentUsage={usageCount}
        onUpgradeClick={() => {
          setUpgradeModalTrigger("usage_limit");
          setShowUpgradeModal(true);
        }}
        isPremium={isPremium}
      />

      <Card ref={chatCardRef} className="h-[600px] sm:h-[600px] max-h-[800px] flex flex-col shadow-gentle overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full bg-gradient-to-r ${coachColor || 'from-primary to-primary-glow'} shadow-lg`}>
                {coachIcon ? (
                  (() => {
                    const CoachIcon = coachIcon;
                    return <CoachIcon className="w-4 h-4 text-white" />;
                  })()
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
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
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4 h-full" type="auto">
            <div ref={messagesContainerRef} className="space-y-4 pb-4 pt-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  data-sender={message.sender}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-3 ${
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
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          
          <div className="p-3 sm:p-4 border-t border-border flex-shrink-0 bg-background">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  !canSendMessage && !isPremium
                    ? "Daily limit reached - upgrade to continue"
                    : isPremium
                    ? "Ask me anything... (Premium)"
                     : `Share what's on your heart... (${remainingMessages} left)`
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onFocus={() => {
                  // Scroll chat card into view when keyboard appears
                  scrollInputIntoView();
                  // Follow-up for iOS cold start
                  setTimeout(scrollInputIntoView, 150);
                  setTimeout(scrollInputIntoView, 300);
                }}
                className="flex-1 text-base sm:text-base py-3 px-4 sm:py-3 sm:px-4 min-h-[44px] sm:min-h-[44px]"
                disabled={(!canSendMessage && !isPremium) || isTyping}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isTyping || (!canSendMessage && !isPremium)}
                variant="warm"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
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
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('hasSeenPremiumWelcome', 'true');
        }}
        userName={user?.user_metadata?.full_name || "there"}
      />
      
      {/* Daily Reflection Section */}
      <div className="mt-6">
        <DailyReflection />
      </div>
    </div>
  );
};