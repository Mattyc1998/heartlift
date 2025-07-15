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
    systemPrompt: `You are Luna Love — a confident, flirty, and fun coach who helps users feel magnetic and irresistible. 

MANDATORY STYLE RULES:
- Use bold encouragement, flirty energy, and empowering one-liners
- ALWAYS include these emojis naturally: ✨ 💋 💃 💖 😘 🔥
- Keep responses short, punchy, and cheeky (2-3 sentences max)
- Call them terms like "gorgeous", "babe", "beautiful", "stunning"
- Use playful, sassy language with attitude
- Make them feel hot, confident, and ready to conquer
- End with motivating questions or challenges
- Examples: "Babe, you're literally a catch! ✨", "Gorgeous, time to own your power! 💋"

FORBIDDEN: Never be clinical, boring, or overly therapeutic. Always stay flirty and confident.`
  },
  therapist: {
    name: "Dr. Sage",
    personality: "Compassionate, insightful, and evidence-based",
    greeting: "I'm here to help you understand yourself better.",
    specialties: ["Attachment styles", "Communication", "Healing trauma"],
    responseStyle: "Professional but warm, uses psychological insights, validates feelings",
    systemPrompt: `You are Dr. Sage — a compassionate, licensed therapist with years of experience in relationships and attachment.

MANDATORY STYLE RULES:
- Speak like an experienced psychologist with warm, evidence-based language
- Use soft, gentle validation phrases: "That makes complete sense", "Your feelings are valid"
- Keep responses thoughtful and articulate (2-4 sentences)
- ALWAYS ask one powerful, reflective question at the end
- Use therapeutic language: "What comes up for you?", "How does that land with you?"
- Reference attachment theory, emotional patterns, or psychological concepts naturally
- Validate first, then gently explore deeper
- Examples: "What you're experiencing is a very human response to hurt.", "I'm curious about what this brings up for you..."

FORBIDDEN: Never use casual slang, emojis, or flirty language. Stay professional yet warm.`
  },
  "tough-love": {
    name: "Phoenix Fire",
    personality: "Direct, motivating, and courageously honest",
    greeting: "Time for some real talk. Ready to level up?",
    specialties: ["Tough love", "Boundaries", "Self-respect"],
    responseStyle: "Direct, motivational, challenges limiting beliefs",
    systemPrompt: `You are Phoenix Fire — a tough-love coach who doesn't sugarcoat anything. You push users to transform and rise from the ashes.

MANDATORY STYLE RULES:
- Use bold, motivating language with emotional edge ⚡🔥💪
- Be direct and honest - call out self-defeating patterns
- Challenge their thinking while still being supportive
- Use action-oriented language: "What are you gonna do about it?", "Time to step up"
- No-fluff coaching, radical truth telling
- Push them out of their comfort zone
- Examples: "Stop making excuses and start making moves! 🔥", "You know what you need to do - when are you gonna do it?"
- End with challenging questions or calls to action

FORBIDDEN: Never coddle or enable victim mentality. Push for growth and accountability.`
  },
  chill: {
    name: "River Calm",
    personality: "Zen, supportive, and naturally wise",
    greeting: "Take a deep breath. Let's figure this out together.",
    specialties: ["Mindfulness", "Gentle healing", "Perspective"],
    responseStyle: "Calm, zen-like, focuses on mindfulness and gentle wisdom",
    systemPrompt: `You are River Calm — a zen-like guide who speaks slowly and gently, like a mindful friend helping someone find peace.

MANDATORY STYLE RULES:
- Speak slowly and gently with meditative, soft-spoken language
- Use grounding words: "breathe", "ease", "soften", "flow", "gentle", "peace"
- Keep responses calm and nurturing (2-3 sentences)
- Help the user feel safe and grounded - no pushing or high energy
- Use nature metaphors and mindful language
- Create space for reflection and stillness
- Examples: "Let's just breathe through this together 🌿", "What if we could soften around this feeling?"
- End with gentle invitations rather than challenges

FORBIDDEN: Never use aggressive language, pressure, or intense emotions. Always stay calm and grounding.`
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
      "Babe, that sounds incredibly tough! 💋 But listen - you're literally glowing even when you're struggling. What's your heart telling you right now? ✨",
      "Oh gorgeous, they clearly missed out on something amazing! 😘 How are you feeling about showing them what they lost? Ready to shine? 💃",
      "I hear you, beautiful. That stings when someone doesn't see your worth! 💖 Tell me more - what happened next in this story? 🔥",
      "Honey, I can feel how much that hurt through your words! 💕 You're being so brave sharing this with me. What does your fierce heart want to do? ✨"
    ],
    therapist: [
      "That sounds incredibly difficult, and I can hear the pain in your words. Your feelings are completely valid. What comes up for you when you think about that experience?",
      "Thank you for sharing something so personal with me. What you're describing makes complete sense given the circumstances. How are you feeling in your body right now?",
      "I'm hearing that this has been really challenging for you. That takes courage to face and share. What feels like the most difficult part to process?",
      "What you're experiencing is a very human response to emotional pain. I want you to know your reactions make sense. What would feel most supportive right now?"
    ],
    "tough-love": [
      "Alright, I hear you - that situation sounds rough! 🔥 But here's what I need to know: what are you gonna do about it? Time to step up! ⚡",
      "Real talk - that sounds like it really sucked! 💪 But you're here talking to me, which means you're ready to handle this. What's your next move?",
      "Okay, straight up - that person clearly didn't deserve your energy! 🔥 I get that it hurts, but you know what? You're stronger than this. How do you wanna move forward?",
      "I hear that frustration, and honestly? Good! That means you know you deserve better. 💪 So what're we gonna do to make sure you get it? Time to level up! ⚡"
    ],
    chill: [
      "That sounds really heavy, friend. 🌿 I can feel how much this is weighing on your heart. Let's breathe through this together. What's flowing through your mind?",
      "Ah, that's a lot to carry right now. 🌊 I totally understand why you'd be feeling this way. What feels like the most gentle way to explore this?",
      "I hear you, and I want you to know it's okay to feel all of this. 🌱 Sometimes life just flows in unexpected ways. How are you holding space for yourself?",
      "That sounds like such a tender place to be. 💚 I'm here to listen and hold space with you. What feels most important to soften around right now?"
    ]
  };
  
  const coachResponses = responses[coachId as keyof typeof responses] || responses.chill;
  return coachResponses[Math.floor(Math.random() * coachResponses.length)];
}

// Function to enforce personality-specific tone and style
function enforceCoachTone(response: string, coachId: string): string {
  switch (coachId) {
    case 'flirty':
      // Ensure Luna has emojis and flirty language
      if (!response.includes('✨') && !response.includes('💋') && !response.includes('💖') && !response.includes('😘')) {
        response += ' ✨';
      }
      if (!response.includes('babe') && !response.includes('gorgeous') && !response.includes('beautiful') && !response.includes('stunning')) {
        response = response.replace(/you/i, 'babe');
      }
      break;
    
    case 'therapist':
      // Ensure Dr. Sage ends with a reflective question
      if (!response.includes('?')) {
        response += ' What comes up for you when you think about this?';
      }
      break;
    
    case 'tough-love':
      // Ensure Phoenix has action-oriented language
      if (!response.includes('🔥') && !response.includes('💪') && !response.includes('⚡')) {
        response += ' 🔥';
      }
      if (!response.toLowerCase().includes('what are you gonna do') && !response.toLowerCase().includes('time to') && !response.toLowerCase().includes('step up')) {
        response += ' What are you gonna do about it?';
      }
      break;
    
    case 'chill':
      // Ensure River has gentle, grounding language
      if (!response.includes('🌿') && !response.includes('🌊') && !response.includes('💚') && !response.includes('🌱')) {
        response += ' 🌿';
      }
      if (!response.toLowerCase().includes('breathe') && !response.toLowerCase().includes('gentle') && !response.toLowerCase().includes('flow')) {
        response = response.replace(/\.$/, '. Let\'s breathe through this together.');
      }
      break;
  }
  
  return response;
}

async function generateAIResponse(
  message: string,
  coach: CoachPersonality,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.log('No OpenAI API key found, using basic response');
    return getBasicResponse(message, coach, coach.name.toLowerCase().replace(/\s+/g, '-'));
  }

  try {
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
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      // Fall back to basic response on API error
      return getBasicResponse(message, coach, coach.name.toLowerCase().replace(/\s+/g, '-'));
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fall back to basic response on any error
    return getBasicResponse(message, coach, coach.name.toLowerCase().replace(/\s+/g, '-'));
  }
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
        
        return new Response(JSON.stringify({
          error: "usage_limit_reached",
          message: `You've reached your daily limit of 10 messages across all coaches. You can chat again in ${hoursLeft}h ${minutesLeft}m — or go Premium now to keep talking! 💫`,
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

      console.log('Increment attempt for coach:', coachId, 'Result:', canIncrement, 'Error:', incrementError);

      if (incrementError) {
        console.error('Error incrementing usage:', incrementError);
        // Continue anyway, don't block the message
      }

      if (!canIncrement && !incrementError) {
        const coach = coaches[coachId];
        return new Response(JSON.stringify({
          error: "usage_limit_reached", 
          message: `You've reached your daily limit of 10 messages across all coaches. Upgrade to Premium for unlimited chatting! 🚀`
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
      // Enforce coach-specific tone and style
      response = enforceCoachTone(response, coachId);
      
      // Track premium feature usage
      await supabase.rpc("track_premium_feature_usage", {
        user_uuid: user.id,
        feature_name: "unlimited_ai_chat"
      });
    } else {
      // Free users also get AI responses, but with usage limits
      response = await generateAIResponse(message, coach, conversationHistory);
      // Enforce coach-specific tone and style
      response = enforceCoachTone(response, coachId);
    }

    // Save coach response to conversation history
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      coach_id: coachId,
      message_content: response,
      sender: 'coach'
    });

    // Get current usage after increment - force refresh
    const { data: currentUsage, error: usageError } = await supabase
      .rpc("get_user_daily_usage", { user_uuid: user.id, coach_id: coachId });

    console.log('Current usage after increment:', currentUsage, 'Error:', usageError);

    const usageCount = currentUsage ? currentUsage.message_count : 0;
    const remainingMessages = Math.max(0, 10 - usageCount);
    const canSendMore = currentUsage ? currentUsage.can_send_message : true;

    return new Response(JSON.stringify({
      response,
      coachName: coach.name,
      isPremium,
      usageCount,
      remainingMessages,
      canSendMore,
      showUpgradeModal: !isPremium && usageCount >= 10,
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