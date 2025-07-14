import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  coachId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  requestRegenerate?: boolean;
}

interface CoachPersonality {
  name: string;
  personality: string;
  greeting: string;
  specialties: string[];
  responseStyle: string;
  systemPrompt: string;
}

const coaches: Record<string, CoachPersonality> = {
  flirty: {
    name: "Luna Love",
    personality: "Playful, empowering, and charmingly bold",
    greeting: "Hey gorgeous! Ready to turn heads? ✨",
    specialties: ["Dating confidence", "Flirting tips", "Self-love"],
    responseStyle: "Uses emojis, encouraging, focuses on confidence and attraction",
    systemPrompt: `You are Luna Love, a flirty and empowering relationship coach. Your personality is playful, bold, and charmingly confident. You help people with dating confidence, flirting tips, and self-love. Use emojis naturally, be encouraging, and focus on building confidence and attraction. You're supportive but never inappropriate. Help users feel empowered and magnetic.`
  },
  therapist: {
    name: "Dr. Sage",
    personality: "Compassionate, insightful, and evidence-based",
    greeting: "I'm here to help you understand yourself better.",
    specialties: ["Attachment styles", "Communication", "Healing trauma"],
    responseStyle: "Professional but warm, uses psychological insights, validates feelings",
    systemPrompt: `You are Dr. Sage, a licensed therapist specializing in relationships and attachment. You're compassionate, insightful, and evidence-based. You help with attachment styles, communication, and healing trauma. Use psychological insights, validate feelings, and provide professional but warm guidance. Draw from attachment theory, CBT, and other therapeutic approaches.`
  },
  "tough-love": {
    name: "Phoenix Fire",
    personality: "Direct, motivating, and courageously honest",
    greeting: "Time for some real talk. Ready to level up?",
    specialties: ["Tough love", "Boundaries", "Self-respect"],
    responseStyle: "Direct, motivational, challenges limiting beliefs",
    systemPrompt: `You are Phoenix Fire, a tough-love mentor focused on transformation and boundaries. You're direct, motivating, and courageously honest. You help with tough love, boundaries, and self-respect. Challenge limiting beliefs, motivate action, and help people level up. Be firm but caring, never mean - your goal is empowerment through honest feedback.`
  },
  chill: {
    name: "River Calm",
    personality: "Zen, supportive, and naturally wise",
    greeting: "Take a deep breath. Let's figure this out together.",
    specialties: ["Mindfulness", "Gentle healing", "Perspective"],
    responseStyle: "Calm, zen-like, focuses on mindfulness and gentle wisdom",
    systemPrompt: `You are River Calm, a zen and supportive coach focused on mindfulness and gentle healing. You're naturally wise, calm, and supportive. You help with mindfulness, gentle healing, and perspective. Use a calm, zen-like approach, focus on mindfulness and gentle wisdom. Help people find peace and clarity through mindful reflection.`
  }
};

const premiumKeywords = [
  // Custom texts
  "what should i text", "text him", "text her", "message to send", "reply with", "how to respond",
  // Deep analysis
  "analyze", "deep dive", "attachment style", "pattern", "psychology behind", "why do i",
  // Break-up plans
  "break up plan", "how to break up", "end relationship", "leave him", "leave her", "exit strategy",
  // Advanced relationship advice
  "always attract", "relationship pattern", "trauma bond", "anxious attachment", "avoidant attachment",
  // Healing roadmaps
  "healing roadmap", "recovery plan", "step by step", "what's next", "how to heal"
];

function isPremiumContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return premiumKeywords.some(keyword => lowerMessage.includes(keyword));
}

function getPremiumTeaser(message: string, coach: CoachPersonality): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("text") || lowerMessage.includes("message") || lowerMessage.includes("respond")) {
    return `That's a great question! I'd love to help you craft the perfect message, but custom text suggestions are a Premium feature. With Premium, I can help you write messages that feel authentic and get results. Want to unlock personalized messaging help? 💬✨`;
  }
  
  if (lowerMessage.includes("attachment") || lowerMessage.includes("pattern") || lowerMessage.includes("analyze") || lowerMessage.includes("why do i")) {
    return `Ooh, you're asking the deep questions! 🧠 Understanding your attachment style and relationship patterns is exactly what I specialize in with Premium coaching. I can give you a full personalized analysis and actionable insights. Ready to unlock your relationship blueprint? 🔓`;
  }
  
  if (lowerMessage.includes("break up") || lowerMessage.includes("leave") || lowerMessage.includes("end relationship") || lowerMessage.includes("exit strategy")) {
    return `That's a big decision that deserves thoughtful planning. 💙 With Premium, I can create a personalized exit strategy that protects your heart and helps you transition gracefully. This includes timing, scripts, and emotional preparation. Want help creating your plan? 🗺️`;
  }
  
  if (lowerMessage.includes("healing") || lowerMessage.includes("recovery") || lowerMessage.includes("roadmap")) {
    return `You're ready to heal and grow - I love that! 🌱 Creating a personalized healing roadmap is exactly what Premium coaching is for. I can give you a step-by-step plan tailored to your situation. Ready to start your transformation? 🚀`;
  }
  
  return `That's exactly the kind of personalized insight I'd love to explore with you! 💡 Deep coaching like this is included in Premium, where I can give you tailored advice and detailed guidance. Want to unlock the full coaching experience? 🚀`;
}

function getBasicResponse(message: string, coach: CoachPersonality, coachId: string): string {
  const responses = {
    flirty: [
      "That sounds incredibly difficult, babe. 💕 I get it - when someone doesn't see your worth, it stings. What happened next?",
      "Oof, sounds like they totally missed out on something amazing! 😉 How are you feeling about it right now? Wanna talk through it?",
      "I hear you, gorgeous. That's so tough when you're putting yourself out there. Can you tell me more about that moment?",
      "Oh honey, I can feel how much that hurt through your words. 💔 You're being so brave by sharing this. What's your heart telling you?"
    ],
    therapist: [
      "That sounds incredibly difficult. I can hear how much pain you're carrying right now. Can you tell me more about what that experience was like for you?",
      "Thank you for sharing something so personal with me. 💙 Those feelings are completely valid. What comes up for you when you think about that situation?",
      "I'm hearing that this has been really hard for you. That takes courage to face. How are you feeling in your body right now as you tell me this?",
      "What you're describing sounds emotionally overwhelming. I want you to know that your feelings make complete sense. Can you help me understand what's been the hardest part?"
    ],
    "tough-love": [
      "Alright, I hear you. That situation sounds rough, and I'm not gonna sugarcoat it. But here's what I need to know - what are you gonna do about it?",
      "If I'm being straight with you, that sounds like it really sucked. 💪 But you're here talking to me, which means you're ready to handle this. What's your next move?",
      "Okay, real talk - that person clearly didn't deserve your energy. I get that it hurts, but you know what? You're stronger than this. How do you wanna move forward?",
      "I hear the frustration in your words, and honestly? Good. That means you know you deserve better. So what're we gonna do to make sure you get it?"
    ],
    chill: [
      "That sounds really heavy, friend. 🌊 I can feel how much this is weighing on you. Wanna talk through what's been going on?",
      "Ah man, that's tough. 😔 I totally get why you'd be feeling this way. What's been the hardest part for you?",
      "I hear you. Sometimes life just throws us curveballs, doesn't it? 🌿 How are you holding up with all this?",
      "That sounds like a lot to carry right now. 💚 I'm here to listen. What feels most important to talk about?"
    ]
  };
  
  const coachResponses = responses[coachId as keyof typeof responses] || responses.chill;
  return coachResponses[Math.floor(Math.random() * coachResponses.length)];
}

async function generateAIResponse(
  message: string,
  coach: CoachPersonality,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  const messages = [
    { role: 'system', content: coach.systemPrompt },
    ...conversationHistory.slice(-8), // Keep last 8 messages for context
    { role: 'user', content: message }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    const { message, coachId = "chill", conversationHistory = [], requestRegenerate = false } = await req.json() as ChatRequest;

    // Check if user has premium access
    const { data: hasPremium } = await supabase
      .rpc("user_has_premium_access", { user_uuid: user.id })
      .single();

    const isPremium = hasPremium || false;

    // Check usage limits for free users (skip if regenerating)
    if (!isPremium && !requestRegenerate) {
      const { data: usageData, error: usageError } = await supabase
        .rpc("get_user_daily_usage", { user_uuid: user.id, coach_id: coachId })
        .single();

      console.log('Usage data:', usageData, 'Error:', usageError);

      if (usageData && !usageData.can_send_message) {
        const hoursLeft = Math.max(0, usageData.hours_until_reset);
        const minutesLeft = Math.max(0, Math.floor((usageData.hours_until_reset - hoursLeft) * 60));
        
        const coach = coaches[coachId];
        return new Response(JSON.stringify({
          error: "usage_limit_reached",
          message: `You've reached your daily limit of 5 messages with ${coach.name}. You can chat again in ${hoursLeft}h ${minutesLeft}m — or go Premium now to keep talking! 💫`,
          hoursUntilReset: hoursLeft,
          minutesUntilReset: minutesLeft
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }

      // Check for premium content and show teaser
      if (isPremiumContent(message)) {
        const coach = coaches[coachId];
        const teaser = getPremiumTeaser(message, coach);
        
        return new Response(JSON.stringify({
          response: teaser,
          isPremiumTeaser: true,
          coachName: coach.name
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Increment usage for free users
      const { data: canIncrement, error: incrementError } = await supabase
        .rpc("increment_user_usage", { user_uuid: user.id, coach_id: coachId });

      console.log('Increment result:', canIncrement, 'Error:', incrementError);

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Don't block on increment error, just log it
      }

      if (!canIncrement && !incrementError) {
        const coach = coaches[coachId];
        return new Response(JSON.stringify({
          error: "usage_limit_reached", 
          message: `You've reached your daily message limit with ${coach.name}. Upgrade to Premium for unlimited chatting! 🚀`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }
    }

    const coach = coaches[coachId];
    let response: string;

    // Save user message to conversation history
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      coach_id: coachId,
      message_content: message,
      sender: 'user'
    });

    if (isPremium) {
      // Premium users get full AI responses
      response = await generateAIResponse(message, coach, conversationHistory);
      
      // Track premium feature usage
      await supabase.rpc("track_premium_feature_usage", {
        user_uuid: user.id,
        feature_name: "unlimited_ai_chat"
      });
    } else {
      // Free users get basic responses
      response = getBasicResponse(message, coach, coachId);
    }

    // Save coach response to conversation history
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      coach_id: coachId,
      message_content: response,
      sender: 'coach'
    });

    // Get current usage after increment
    const { data: currentUsage } = await supabase
      .rpc("get_user_daily_usage", { user_uuid: user.id, coach_id: coachId })
      .single();

    const remainingMessages = Math.max(0, 5 - (currentUsage?.message_count || 0));

    return new Response(JSON.stringify({
      response,
      coachName: coach.name,
      isPremium,
      usageCount: currentUsage?.message_count || 0,
      remainingMessages,
      canSendMore: currentUsage?.can_send_message || false,
      showUpgradeModal: !isPremium && currentUsage?.message_count >= 5,
      canRegenerate: isPremium // Only premium users can regenerate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(JSON.stringify({
      error: "Something went wrong. Please try again.",
      details: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});