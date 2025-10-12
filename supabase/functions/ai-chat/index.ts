import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Crisis detection keywords
const crisisKeywords = {
  suicide: [
    "kill myself", "end my life", "suicide", "suicidal", "want to die", "better off dead",
    "no point living", "can't go on", "end it all", "take my own life", "hurt myself badly"
  ],
  selfHarm: [
    "cut myself", "hurt myself", "self harm", "self-harm", "cutting", "burning myself",
    "harming myself", "self injury", "self-injury", "want to hurt myself"
  ],
  domesticAbuse: [
    "hitting me", "beats me", "abusing me", "domestic violence", "domestic abuse",
    "physically hurts me", "threatens to hurt me", "afraid of my partner", "partner hits me",
    "scared of going home", "controlling everything I do", "won't let me leave"
  ],
  abuse: [
    "being abused", "someone is abusing me", "sexually abused", "physically abused",
    "emotionally abused", "verbally abused", "childhood abuse", "being molested",
    "inappropriate touching", "sexual assault", "being raped", "family member abusing me"
  ],
  childAbuse: [
    "child abuse", "child is being abused", "abusing a child", "hurting a child",
    "child being hurt", "child being molested", "child sexual abuse", "child neglect",
    "child is in danger", "someone hurting my child", "child being mistreated",
    "inappropriate behavior with child", "child safety concern", "worried about a child",
    "child being harmed", "minor being abused", "kid is being hurt", "teenager being abused"
  ],
  drugAbuse: [
    "addicted to", "drug addiction", "can't stop using", "overdosed", "overdosing",
    "drug problem", "substance abuse", "drinking too much", "alcoholic", "drug abuse",
    "using drugs", "taking pills", "cocaine", "heroin", "meth", "abusing alcohol",
    "chemical dependency", "withdrawal", "need drugs", "can't quit", "took drugs",
    "taking drugs", "doing drugs", "on drugs", "high on", "getting high", "drug use",
    "substance use", "pills", "weed", "marijuana", "ecstasy", "molly", "acid", "lsd",
    "taking substances", "using substances", "recreational drugs", "party drugs",
    "im taking drugs", "i'm taking drugs", "im doing drugs", "i'm doing drugs",
    "im using drugs", "i'm using drugs", "im on drugs", "i'm on drugs",
    "take drugs", "do drugs", "use drugs", "smoke weed", "smoking weed",
    "drunk", "drinking", "getting drunk", "been drinking", "had drinks"
  ]
};

function detectCrisisSituation(message: string): { isCrisis: boolean; type?: string } {
  const lowerMessage = message.toLowerCase();
  console.log('Checking message for crisis keywords:', lowerMessage);
  
  for (const [type, keywords] of Object.entries(crisisKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        console.log(`Crisis detected! Type: ${type}, Keyword: ${keyword}`);
        return { isCrisis: true, type };
      }
    }
  }
  
  console.log('No crisis detected');
  return { isCrisis: false };
}

function getCrisisResponse(type: string): string {
  switch (type) {
    case 'suicide':
      return "I'm really concerned about your safety. If you're thinking about harming yourself, please know you're not alone. I can't provide the help you need, but I strongly encourage you to call your local emergency number right now, or reach out to a suicide prevention hotline (for example, Samaritans at 116 123 in the UK, or find your local hotline at https://findahelpline.com).";
    
    case 'selfHarm':
      return "I hear that you're struggling with thoughts of self-harm. This is serious, and I want you to get proper support. Please reach out to a crisis helpline or trusted professional right away (for example, Samaritans at 116 123 in the UK, or find your local hotline at https://findahelpline.com). If you're in immediate danger, please call emergency services.";
    
    case 'domesticAbuse':
      return "I hear how difficult this is. I can't provide the right kind of support for this situation, but it's really important to talk to someone who can help you stay safe. If you're in immediate danger, please call emergency services. You can also reach out to a domestic violence hotline (for example, the National Domestic Abuse Helpline at 0808 2000 247 in the UK, or find your local resource at https://findahelpline.com).";
    
    case 'abuse':
      return "I'm deeply concerned about what you're experiencing. Abuse is never okay, and you deserve support and safety. I can't provide the specialized help you need, but please reach out to professionals who can help you. If you're in immediate danger, call emergency services. You can also contact an abuse helpline (for example, NSPCC at 0808 800 5000 in the UK, or find your local resource at https://findahelpline.com).";
    
    case 'childAbuse':
      return "I'm extremely concerned about child safety. This is a matter that requires immediate attention from proper authorities. I cannot and will not provide advice on this topic. Please contact emergency services immediately if a child is in immediate danger (999 in the UK, 911 in the US). You can also contact child protection services: NSPCC Helpline at 0808 800 5000 in the UK, or Childline at 0800 1111. If you suspect child abuse, please report it to the appropriate authorities immediately.";
    
    case 'drugAbuse':
      return "I'm concerned about what you're sharing regarding substance use. I can't provide the specialized help you need, but please reach out to professionals who can help you. If you're in immediate danger, call emergency services. You can contact a substance abuse helpline (for example, Frank at 0300 123 6600 in the UK, or SAMHSA's helpline at 1-800-662-4357 in the US, or find your local resource at https://findahelpline.com).";
    
    default:
      return "I'm concerned about what you're sharing. Please reach out to a crisis helpline or trusted professional who can provide proper support (for example, find your local helpline at https://findahelpline.com). If you're in immediate danger, please call emergency services.";
  }
}

const coaches: Record<string, CoachPersonality> = {
  flirty: {
    name: "Luna Love",
    personality: "Playful, empowering, and charmingly bold",
    greeting: "Hey gorgeous! Ready to turn heads? ✨",
    specialties: ["Dating confidence", "Flirting tips", "Self-love"],
    responseStyle: "Uses emojis, encouraging, focuses on confidence and attraction",
    systemPrompt: `You are Luna Love — a confident, flirty, and fun coach who helps users feel magnetic and irresistible. You're like that encouraging best friend who always knows what to say to boost someone's confidence.

MANDATORY STYLE RULES:
- Be genuinely CONVERSATIONAL and engaging - ask follow-up questions about their feelings, experiences, and desires
- Use bold encouragement, flirty energy, and empowering language naturally in conversation
- ALWAYS include these emojis naturally: ✨ 💋 💃 💖 😘 🔥 but don't overuse them
- Keep responses conversational and engaging (3-4 sentences that flow naturally)
- Call them terms like "gorgeous", "babe", "beautiful", "stunning", "honey"
- Use playful, sassy language with genuine interest in their story
- Make them feel heard, understood, and then EMPOWERED
- Ask engaging questions about their situation - not just "what's your next move" but deeper questions
- Show curiosity about their feelings, what happened, how they're processing things
- Examples: "Oh honey, tell me more about how that made you feel! 💖", "Babe, I can totally see why that would mess with your head - but here's what I'm thinking... ✨"

KEY: Be a CONVERSATION partner, not just a motivational speaker. Show genuine interest, ask about details, respond to their emotions, THEN empower them.

CONVERSATION FLOW:
- If conversation history exists, CONTINUE the conversation naturally - DON'T re-greet or say "hello" again
- Jump right into responding to what they just said
- Reference previous parts of the conversation when relevant

FORBIDDEN: Never be clinical, boring, or overly therapeutic. Never just ask "what's your next move" without exploring their feelings first. Never say "hello" or "hi" again in the middle of an ongoing conversation.`
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

CONVERSATION FLOW:
- If conversation history exists, CONTINUE the conversation naturally - DON'T re-introduce yourself or say "hello" again
- Jump right into responding to what they just shared
- Build on previous exchanges when appropriate

FORBIDDEN: Never use casual slang, emojis, or flirty language. Stay professional yet warm. Never greet the user again in the middle of an ongoing conversation.`
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
- MAXIMUM 2 QUESTIONS per response to avoid overwhelming users
- Examples: "Stop making excuses and start making moves! 🔥", "You know what you need to do - when are you gonna do it?"
- End with challenging questions or calls to action (max 2 questions)

CONVERSATION FLOW:
- If conversation history exists, CONTINUE the conversation naturally - DON'T say "hello" or re-greet
- Jump straight into your tough-love response to what they just said
- Keep the momentum going, don't reset the conversation

FORBIDDEN: Never coddle or enable victim mentality. Push for growth and accountability. Never greet them again in the middle of a conversation.`
  },
  chill: {
    name: "River Calm",
    personality: "Zen, supportive, and naturally wise",
    greeting: "Take a deep breath. Let's figure this out together.",
    specialties: ["Mindfulness", "Gentle healing", "Perspective"],
    responseStyle: "Calm but conversational, zen-like wisdom with engaging questions",
    systemPrompt: `You are River Calm — a zen-like guide who speaks with gentle wisdom but stays conversational and engaging like a mindful friend.

MANDATORY STYLE RULES:
- Speak with gentle, flowing conversation - not boring or too brief
- Use grounding words: "breathe", "ease", "soften", "flow", "gentle", "peace" 
- Be conversational and engaging (3-4 sentences) while staying calm
- Use nature metaphors and mindful language naturally in conversation
- Ask thoughtful, caring questions to keep the dialogue flowing
- Create space for reflection while maintaining connection
- Include gentle emojis like 🌿 🌊 🌱 💚 ☁️ but sparingly
- Examples: "I can feel the weight of what you're carrying right now 🌿. Sometimes when life feels overwhelming, I find it helps to imagine our feelings like water - they flow through us rather than defining us. What's been the hardest part of this whole situation for you?"
- End with gentle, engaging questions that invite deeper sharing

CONVERSATION FLOW:
- If conversation history exists, CONTINUE the conversation naturally - DON'T say "hello" or re-greet
- Flow directly into your response to what they just shared
- Maintain the conversational thread without resetting

FORBIDDEN: Never be too brief, clinical, or boring. Stay conversational while being calming. Never greet the user again in the middle of an ongoing conversation.`
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
      "Oh honey, that sounds like such a whirlwind! 💖 I can totally feel the intensity of what you're going through right now. Tell me more about what's been going through your mind - are you feeling more hurt, angry, or just completely confused? Because babe, however you're feeling is totally valid! ✨",
      "Gorgeous, I can hear how much this is affecting you, and honestly? That shows how much heart you have. 💋 But here's what I want to know - when you think about this whole situation, what part is messing with your head the most? Is it what they said, what they did, or just the whole damn thing? Talk to me! 🔥",
      "Babe, first of all - thank you for trusting me with this! 💕 That takes real courage, and I'm already seeing your strength shine through. Now, I'm curious - how long has this been weighing on you? Because sometimes when we sit with these feelings, they tell us exactly what we need to know. What's your gut been saying? ✨",
      "Oh beautiful, I can feel that energy through your words! 😘 You know what though? The fact that you're here talking about it means you're already choosing yourself, and that's honestly so attractive. I want to hear more about how you're processing all this - what's been the hardest part to wrap your head around? 💃"
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
      "That sounds really heavy, friend. 🌿 I can feel how much this is weighing on your heart, and I want you to know that it's completely okay to feel overwhelmed by all of this. Sometimes when we're in the thick of difficult emotions, it can help to imagine them like clouds passing through the sky - present, but not permanent. What's been the hardest part of this whole situation for you?",
      "Ah, that's a lot to carry right now. 🌊 I totally understand why you'd be feeling this way, and honestly, the fact that you're here talking about it shows so much courage. You know, I often think about how healing isn't linear - it flows like a river, with gentle currents and sometimes rapids. What feels like the most gentle way we could start exploring this together?",
      "I hear you, and I want you to know it's okay to feel all of this. 🌱 Your emotions are like seeds right now - they might feel heavy and dark, but they're also the beginning of something new growing within you. Sometimes life flows in unexpected ways, and we have to learn to swim with the current rather than against it. How are you holding space for yourself through all of this?",
      "That sounds like such a tender place to be, and I'm really honored that you're sharing this with me. 💚 I'm here to listen and hold space with you through whatever comes up. You know, I've noticed that when we're gentle with ourselves, healing has room to breathe and unfold naturally. What feels most important for you to soften around right now?"
    ]
  };
  
  const coachResponses = responses[coachId as keyof typeof responses] || responses.chill;
  return coachResponses[Math.floor(Math.random() * coachResponses.length)];
}


async function generateAIResponse(
  message: string,
  coach: CoachPersonality,
  conversationHistory: Array<{ role: string; content: string }> = [],
  reflectionContext: string = "",
  userId: string
): Promise<string> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.log('No Lovable API key found, using basic response');
    return getBasicResponse(message, coach, coach.name.toLowerCase().replace(/\s+/g, '-'));
  }

  try {
    // Enhanced system prompt with memory context
    let enhancedSystemPrompt = coach.systemPrompt;
    
    if (reflectionContext) {
      enhancedSystemPrompt += `\n\nMEMORY CONTEXT - Previous reflections and conversations:
${reflectionContext}

IMPORTANT: Use this context to remember what the user has shared before and reference it naturally in your responses. Ask follow-up questions about things they mentioned previously. Show that you remember their journey.`;
    }

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lovable AI API error: ${response.status} - ${errorText}`);
      // Fall back to basic response on API error
      return getBasicResponse(message, coach, coach.name.toLowerCase().replace(/\s+/g, '-'));
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Lovable AI API:', error);
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

    // Comprehensive input validation
    if (!message || typeof message !== 'string') {
      throw new Error('VALIDATION_ERROR');
    }
    
    if (message.length < 1 || message.length > 5000) {
      throw new Error('VALIDATION_ERROR');
    }
    
    // Sanitize message - remove control characters
    const sanitizedMessage = message.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Crisis detection - handle immediately before any other processing using sanitized message
    const crisisDetection = detectCrisisSituation(sanitizedMessage);
    if (crisisDetection.isCrisis) {
      const crisisResponse = getCrisisResponse(crisisDetection.type!);
      
      // Save the user message and crisis response to conversation history
      // Use secure function to ensure proper validation
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachId,
        p_message_content: sanitizedMessage,
        p_sender: 'user'
      });
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachId,
        p_message_content: crisisResponse,
        p_sender: 'assistant'
      });
      
      return new Response(JSON.stringify({
        response: crisisResponse,
        isPremium: false,
        usageCount: 0,
        canSendMessage: true,
        coachName: coaches[coachId]?.name || "Your Coach",
        isCrisisResponse: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    if (typeof coachId !== 'string' || coachId.length > 50) {
      throw new Error('Invalid coach ID format');
    }

    // Retrieve conversation history from database to ensure context
    const { data: dbHistory, error: historyError } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: true })
      .limit(16); // Get last 16 messages for context

    console.log('Retrieved conversation history:', dbHistory?.length || 0, 'messages');

    // Convert database history to OpenAI format
    const formattedHistory = dbHistory?.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message_content
    })) || [];

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

      if (usageData && !(usageData as any).can_send_message) {
        const hoursLeft = Math.max(0, (usageData as any).hours_until_reset || 0);
        const minutesLeft = Math.max(0, Math.floor(((usageData as any).hours_until_reset - hoursLeft) * 60));
        
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
        .rpc("increment_user_usage", { user_uuid: user.id, input_coach_id: coachId });

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

    console.log('Received coachId:', coachId, 'Available coaches:', Object.keys(coaches));
    const coach = coaches[coachId];
    console.log('Found coach:', coach?.name || 'UNDEFINED');
    
    // Load daily reflections context for coach memory
    let reflectionContext = '';
    try {
      const { data: reflections, error: reflectionError } = await supabase
        .from('daily_reflections')
        .select('helpful_moments, areas_for_improvement, conversation_rating, coaches_chatted_with, reflection_date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(7); // Get last week of reflections

      if (reflections && reflections.length > 0) {
        reflectionContext = reflections.map(r => {
          const date = new Date(r.reflection_date).toLocaleDateString();
          return `Reflection from ${date}: What was helpful: "${r.helpful_moments || 'Not specified'}". What user wants to explore: "${r.areas_for_improvement || 'Not specified'}". Rating: ${r.conversation_rating || 'Not rated'}/5. Coaches they talked to: ${r.coaches_chatted_with?.join(', ') || 'None specified'}`;
        }).join('\n');
      }
      
      console.log('Loaded reflection context:', reflectionContext ? reflectionContext.length : 0, 'characters');
    } catch (error) {
      console.error('Error loading reflection context:', error);
      // Continue without reflection context if there's an error
    }
    
    let response: string;

    if (!requestRegenerate) {
      // Save user message to conversation history only if not regenerating
      // Use secure function to ensure proper validation
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachId,
        p_message_content: sanitizedMessage,
        p_sender: 'user'
      });
    }

    if (isPremium) {
      // Premium users get full AI responses with conversation history and reflection context
      response = await generateAIResponse(sanitizedMessage, coach, formattedHistory, reflectionContext, user.id);
      
      // Track premium feature usage
      await supabase.rpc("track_premium_feature_usage", {
        user_uuid: user.id,
        feature_name: "unlimited_ai_chat"
      });
    } else {
      // Free users also get AI responses with memory, but with usage limits
      response = await generateAIResponse(message, coach, formattedHistory, reflectionContext, user.id);
    }

    if (!requestRegenerate) {
      // Save coach response to conversation history only if not regenerating
      // Use secure function to ensure proper validation
      await supabase.rpc('insert_conversation_message', {
        p_user_id: user.id,
        p_coach_id: coachId,
        p_message_content: response,
        p_sender: 'coach'
      });
    }

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
    console.error('[AI-CHAT-ERROR]', error); // Log full error server-side only
    
    const errorMessage = (error as Error).message;
    let statusCode = 500;
    let clientError = 'An error occurred. Please try again.';
    
    // Return safe error codes instead of detailed messages
    if (errorMessage === 'VALIDATION_ERROR') {
      statusCode = 400;
      clientError = 'Invalid input provided.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      statusCode = 503;
      clientError = 'Service temporarily unavailable. Please try again later.';
    } else if (errorMessage.includes('auth')) {
      statusCode = 401;
      clientError = 'Authentication failed.';
    }
    
    return new Response(JSON.stringify({
      error: clientError
      // No details field - never expose internal error details
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});