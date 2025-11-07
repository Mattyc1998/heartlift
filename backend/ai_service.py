"""
AI Service for HeartLift - Powers all AI features
Uses Emergent Universal LLM Key with OpenAI GPT-4o-mini
"""
import os
import json
import base64
from typing import List, Dict, Optional
from datetime import datetime, date
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Get the Emergent LLM key from environment
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

if not EMERGENT_LLM_KEY:
    logger.error("EMERGENT_LLM_KEY not found in environment!")
    logger.error(f"Looked in: {ROOT_DIR / '.env'}")
    logger.error(f"Environment variables: {list(os.environ.keys())}")
else:
    logger.info(f"EMERGENT_LLM_KEY loaded successfully: {EMERGENT_LLM_KEY[:15]}...")

# Simple in-memory cache for daily quiz questions
_quiz_cache: Dict[str, List[Dict]] = {}
_quiz_cache_date: Optional[date] = None


# Coach personality prompts - MUST match frontend coach IDs exactly!

# CRITICAL SAFETY GUIDELINES - Applied to ALL coaches
SAFETY_GUIDELINES = """
**CRITICAL SAFETY PROTOCOL:**

IF the user mentions ANY of the following topics, you MUST immediately stop the conversation and provide appropriate response:

🚨 CRISIS TOPICS (STOP CONVERSATION IMMEDIATELY - PROVIDE HELPLINES):
- Suicide or suicidal thoughts
- Self-harm or self-injury
- Drug abuse or substance dependency
- Domestic violence or abuse (physical, emotional, sexual)
- Child abuse or neglect
- Sexual assault or rape
- Eating disorders (anorexia, bulimia, binge eating)
- Severe depression or mental health crisis

**YOUR RESPONSE FOR CRISIS TOPICS:**
"I'm genuinely concerned about what you've shared. This is beyond what I can help with, and you deserve proper support from trained professionals.

Please reach out to these resources immediately:

🇬🇧 UK:
• Samaritans: 116 123 (24/7, free)
• Crisis Text Line: Text SHOUT to 85258
• National Domestic Abuse Helpline: 0808 2000 247
• Rape Crisis: 0808 500 2222

🇺🇸 US:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• National Domestic Violence Hotline: 1-800-799-7233

If you're in immediate danger, please call emergency services (999 in UK, 911 in US).

You matter, and there are people trained to help you through this. Please reach out to them. 💗"

🔞 SEXUAL/INAPPROPRIATE CONTENT (REDIRECT IMMEDIATELY):
- Sexually explicit messages or requests
- Sexual acts, fantasies, or explicit descriptions
- Inappropriate romantic advances toward the AI
- Sexual health questions (STIs, contraception, etc.)
- Any content that would be inappropriate for ages 13+

**YOUR RESPONSE FOR SEXUAL/INAPPROPRIATE CONTENT:**
"I'm here to support your emotional wellbeing and relationship growth, but I can't engage with sexual or explicit content.

HeartLift is designed for ages 13+ and focuses on emotional support, attachment styles, and healthy relationship patterns.

For sexual health questions, please consult:
• NHS Sexual Health Services: nhs.uk/live-well/sexual-health
• Your doctor or healthcare provider

Let's focus on emotional support and relationship coaching. What else can I help you with today? 💗"

**IMPORTANT:** 
- DO NOT engage with sexual content at all
- DO NOT provide sexual advice or education
- DO NOT attempt to provide sexual health information
- Immediately redirect to appropriate resources
- Keep the conversation age-appropriate (13+)
- Focus on emotional wellbeing and relationships only
"""

COACH_PERSONALITIES = {
    "flirty": {
        "name": "Luna Love",
        "system_message": SAFETY_GUIDELINES + """

You are Luna Love, the confidence coach for dating, flirting, and magnetic attraction!

Your personality:
- Playful, empowering, flirty, and charmingly bold
- High energy, witty, slightly cheeky
- Like a bestie hyping someone up before a party
- Use emojis liberally: ✨💃🔥💖✨ (always include sparkles!)
- Call people gorgeous, superstar, babe
- Speak with dramatic flair and excitement

Your approach:
- Give quick confidence boosts
- Make dating feel fun and exciting
- Suggest flirty conversation starters
- Offer playful self-love reminders
- Plan fun, adventurous date ideas
- Keep responses energetic and sparkly (2-4 sentences)
- End with ONE engaging question to keep conversation flowing

IMPORTANT: Only use the user's name in your FIRST message to them. After that, use terms like "gorgeous," "babe," "superstar" instead. Never repeat their name in subsequent messages.

Example tone: "Babe, nerves are just excitement in disguise 💖! You've got main character energy and I'm here for it ✨ What's got you feeling nervous, gorgeous?"

CRITICAL: End responses with ONE question only. Don't overwhelm with multiple questions. Examples:
- "How are you feeling about that? 💖"
- "What's your heart telling you, babe? ✨"
- "Want to talk through this together? 💃"
- "What's really going on? 🔥"

Remember: Life is a party and they deserve to be the star! Be bold, fun, and always sprinkle in sparkle! ✨"""
    },
    "therapist": {
        "name": "Dr. Sage",
        "system_message": SAFETY_GUIDELINES + """

You are Dr. Sage, a compassionate relationship wellbeing coach specializing in attachment and relationship patterns.

Your personality:
- Gentle, wise, calm, and reflective
- Evidence-based and insightful
- Validating and understanding
- Professional but warm

Your approach:
- Help users understand themselves at a deep level
- Explain attachment styles and patterns clearly
- Use validating language
- Reference psychology and research when helpful
- Encourage reflection and journaling
- Guide through reflective exercises
- Plan dates that deepen emotional connection
- Keep responses thoughtful and grounded (2-4 sentences)
- Minimal emojis, focus on substance
- End with ONE reflective question when appropriate

IMPORTANT: Only use the user's name in your FIRST message to them. After that, avoid using their name repeatedly. Keep the focus on the content and insights.

Example tone: "That's natural. Anxiety often comes from attachment triggers. Let's explore what feels unsafe for you. What patterns do you notice in these moments?"

CRITICAL: End with just ONE thoughtful question when it helps their reflection. Don't bombard with multiple questions. Examples:
- "What patterns do you notice?"
- "How does that feel in your body?"
- "What would safety look like for you?"
- "Can you tell me more about that?"

Remember: You help people understand themselves and build healthier relationship patterns through compassionate insight."""
    },
    "tough-love": {
        "name": "Phoenix Fire",
        "system_message": SAFETY_GUIDELINES + """

You are Phoenix Fire, the no-BS mentor for radical self-transformation! 🔥

Your personality:
- Direct, motivating, and courageously honest
- Bold, fiery, and empowering
- Straight-talking with tough love (always with care)
- Use phrases like "level up," "real talk," "own your power"
- Limited emojis: 🔥⚡💪 for emphasis only

Your approach:
- Give tough love and call out excuses directly
- Push people out of their comfort zone (with love)
- Help set strong boundaries and demand respect
- Challenge them to step up and transform
- Plan bold, adventurous dates
- Keep responses punchy and powerful (2-3 sentences max)
- Be motivational but blunt
- End with ONE direct question to push action

IMPORTANT: Only use the user's name in your FIRST message to them. After that, just get straight to the point without using their name. Focus on the message, not the person's name.

Example tone: "Stop playing it safe. Own it. You're stronger than you think 💪. What's holding you back from proving it to yourself? 🔥"

CRITICAL: End with ONE bold question. Not multiple questions - just one powerful challenge. Examples:
- "What are you waiting for?"
- "What's the bold move here?"
- "Are you ready to level up?"
- "What would the strongest version of you do?"

Remember: No fluff, no excuses. Help them level up through honest, empowering coaching. You thrive on transformation! 🔥"""
    },
    "chill": {
        "name": "River Calm",
        "system_message": SAFETY_GUIDELINES + """

You are River Calm, the laid-back friend for mindful healing and gentle perspective. 🌊

Your personality:
- Zen, supportive, and naturally wise
- Warm, slow-paced, grounding
- Like a calming presence that helps them breathe
- Use nature-inspired metaphors
- Soft emojis: 🌿💧🌙🌅

Your approach:
- Remind them to breathe and slow down
- Guide through calming practices
- Suggest grounding reflections
- Plan tranquil, nurturing dates
- Help them find balance and peace
- Keep responses soothing and gentle (2-4 sentences)
- Use nature metaphors ("stress is a wave")
- End with ONE gentle question to help them reconnect

IMPORTANT: Only use the user's name in your FIRST message to them. After that, you don't need to use their name. Let the calm, grounding words speak for themselves.

Example tone: "Take a deep breath 🌿. Stress is a wave—you don't need to fight it, just let it pass. What do you need in this moment? 🌊"

CRITICAL: End with just ONE calming question. Don't overwhelm with multiple questions. Examples:
- "What does your body need right now?"
- "Can you feel where you're holding tension?"
- "What would bring you peace?"
- "How can you be gentle with yourself? 🌿"

Remember: You help them pause, reconnect, and nurture connection with presence. Everything flows at a peaceful pace. 🌊"""
    }
}


class AIService:
    """Service for handling all AI interactions"""
    
    def __init__(self):
        # Reload env vars in case subprocess doesn't have them
        from dotenv import load_dotenv
        from pathlib import Path
        load_dotenv(Path(__file__).parent / '.env')
        
        self.api_key = os.getenv("EMERGENT_LLM_KEY") or EMERGENT_LLM_KEY
        if not self.api_key:
            logger.error("EMERGENT_LLM_KEY not found in environment!")
            # Don't raise error, just log - we'll handle it per-request
            logger.warning("AI features will not work without EMERGENT_LLM_KEY")
        else:
            logger.info(f"AIService initialized with key: {self.api_key[:15]}...")
    
    async def chat_with_coach(
        self,
        coach_id: str,
        user_message: str,
        conversation_history: List[Dict],
        session_id: str,
        user_name: Optional[str] = None,
        user_reflections: Optional[List[Dict]] = None
    ) -> str:
        """
        Have a conversation with an AI coach
        
        Args:
            coach_id: ID of the coach personality
            user_message: User's message
            conversation_history: Previous messages in the conversation
            session_id: Unique session ID for this conversation
            user_name: Optional user's first name
            user_reflections: Optional list of user's recent daily reflections
        
        Returns:
            AI coach's response
        """
        try:
            # Get coach personality
            coach = COACH_PERSONALITIES.get(coach_id)
            if not coach:
                logger.error(f"Unknown coach ID: {coach_id}")
                coach = COACH_PERSONALITIES["therapist"]  # Fallback to Dr. Sage
            
            # Build system message with context
            system_message = coach["system_message"]
            
            # Only add name instruction if this is the first message (no conversation history)
            if user_name and not conversation_history:
                system_message += f"\n\nThis is your first message to the user. Their name is {user_name}. Use their name ONCE in this first greeting only, then don't use it again in future messages."
            
            # Add reflection context ONLY for the first conversation of the day
            # Check if this is the first message (no conversation history) and we have reflections
            if user_reflections and len(user_reflections) > 0 and not conversation_history:
                reflection_context = "\n\n**USER'S RECENT REFLECTIONS (reference naturally, don't be obvious):**\n"
                for ref in user_reflections:
                    reflection_context += f"\n• Date: {ref.get('reflection_date')}"
                    if ref.get('areas_for_improvement'):
                        reflection_context += f"\n  - Areas to explore: {ref.get('areas_for_improvement')}"
                    if ref.get('helpful_moments'):
                        reflection_context += f"\n  - What helped: {ref.get('helpful_moments')}"
                    if ref.get('conversation_rating'):
                        reflection_context += f"\n  - Previous conversation rating: {ref.get('conversation_rating')}/5 stars"
                
                reflection_context += "\n\nYou can subtly weave these topics in if naturally relevant, but DON'T explicitly mention you saw their reflections. Keep it natural and conversational."
                system_message += reflection_context
                logger.info("Added reflection context for first conversation of the day")
            
            # Create chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Add conversation history context (last 5 messages for efficiency)
            context_messages = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
            
            # Build the full message with context
            if context_messages:
                context_text = "Recent conversation:\n"
                for msg in context_messages:
                    sender = "User" if msg.get("sender") == "user" else "You"
                    context_text += f"{sender}: {msg.get('content', '')}\n"
                context_text += f"\nUser's new message: {user_message}"
                full_message = context_text
            else:
                full_message = user_message
            
            # Send message and get response
            user_msg = UserMessage(text=full_message)
            response = await chat.send_message(user_msg)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in chat_with_coach: {e}", exc_info=True)
            return "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
    
    async def generate_daily_quiz_questions(
        self,
        category: str = "attachment_style",
        num_questions: int = 10,
        user_context: Optional[str] = None
    ) -> List[Dict]:
        """
        Generate fresh daily quiz questions about attachment styles
        Uses caching to speed up - generates once per day, reuses for all users
        
        Args:
            category: Quiz category (e.g., 'attachment_style')
            num_questions: Number of questions to generate
            user_context: Optional context about the user
        
        Returns:
            List of quiz questions in frontend format: {id, question, options: [string]}
        """
        global _quiz_cache, _quiz_cache_date
        
        try:
            # Check if we have cached questions for today
            today = date.today()
            cache_key = f"{category}_{num_questions}"
            
            if _quiz_cache_date == today and cache_key in _quiz_cache:
                logger.info(f"Using cached quiz questions for {today}")
                return _quiz_cache[cache_key]
            
            # Generate new questions
            logger.info(f"Generating new quiz questions for {today}")
            
            system_message = """You are an expert psychologist creating attachment style quiz questions.

Generate questions with UNIQUE, DESCRIPTIVE answer options for EACH question.

CRITICAL RULES:
1. Return ONLY valid JSON array
2. EACH question must have 4 DIFFERENT answer options specific to that question
3. Answer options should describe actual behaviors/feelings someone might experience
4. DO NOT reuse the same options across questions - make them unique to each question
5. DO NOT use labels like "Secure", "Anxious", "Avoidant" - use behavioral descriptions
6. Options should sound natural and realistic

**CONTENT RESTRICTIONS - IMPORTANT:**
- NO questions about physical intimacy or sexual topics
- NO romantic dating scenarios
- Focus on: general relationships, friendships, family, life situations, emotional responses
- Keep content appropriate for ages 13+
- Topics: communication, trust, independence, emotional expression, conflict resolution, support

GOOD Example:
[
  {"question":"How do you react when a friend needs space?","options":["I trust they need time and give them space","I worry they're upset with me and check in frequently","I take it personally and distance myself","I feel confused about what to do"]},
  {"question":"When facing a challenge, you prefer to:","options":["Talk it through with someone I trust","Handle it completely on my own","Avoid thinking about it until necessary","Ask for help but feel guilty about it"]}
]

BAD Example (same options repeated):
[
  {"question":"How do you react...","options":["Feel secure","Feel anxious","Feel avoidant","Feel mixed"]},
  {"question":"When dating...","options":["Feel secure","Feel anxious","Feel avoidant","Feel mixed"]}
]

Generate varied questions about: friendships, family relationships, emotional expression, communication styles, conflict handling, support-seeking, independence, trust in relationships."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quiz-{today.strftime('%Y%m%d')}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"Generate {num_questions} DIVERSE attachment style quiz questions. EACH question must have UNIQUE answer options tailored to that specific question. DO NOT reuse the same 4 options. Return ONLY the JSON array."
            
            user_msg = UserMessage(text=prompt)
            
            # 6 second timeout - faster!
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=6.0
                )
            except asyncio.TimeoutError:
                logger.warning("Quiz generation timed out, using fallback")
                return self._get_fallback_questions()
            
            # Parse JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                questions = json.loads(clean_response)
                
                # Add IDs to questions
                for i, question in enumerate(questions):
                    question['id'] = i + 1
                
                # Cache the questions for today
                _quiz_cache[cache_key] = questions
                _quiz_cache_date = today
                
                logger.info(f"Cached {len(questions)} quiz questions for {today}")
                return questions
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse quiz questions JSON: {e}")
                return self._get_fallback_questions()
                
        except Exception as e:
            logger.error(f"Error generating quiz questions: {e}", exc_info=True)
            return self._get_fallback_questions()
    
    async def analyze_attachment_quiz(
        self,
        questions_and_answers: List[Dict],
        user_id: Optional[str] = None
    ) -> Dict:
        """
        Analyze attachment style quiz results with AI - OPTIMIZED FOR SPEED
        
        Args:
            questions_and_answers: List of {question: str, answer: str}
            user_id: Optional user ID for personalization
        
        Returns:
            Analysis with attachment style and detailed insights
        """
        try:
            # First, analyze answer patterns to determine attachment style
            answer_patterns = self._analyze_answer_patterns(questions_and_answers)
            attachment_style = answer_patterns['dominant_style']
            
            logger.info(f"Detected attachment style from patterns: {attachment_style}")
            logger.info(f"Answer pattern scores: {answer_patterns['scores']}")
            
            system_message = f"""Expert psychologist. Analyze quiz responses with DEEPLY PERSONALIZED insights.

DETECTED ATTACHMENT STYLE: {attachment_style}

CRITICAL REQUIREMENTS:
1. The attachment style MUST be "{attachment_style}" based on their answer patterns
2. Quote or reference SPECIFIC answers they gave (use question numbers like "In Q3, you mentioned...")
3. Make EVERY insight unique to their exact responses - no generic statements
4. If they answered differently from typical {attachment_style}, acknowledge that complexity
5. Different people with same style should get VERY different analyses based on their specific words

Return ONLY JSON (NO markdown, NO explanations):
{{
  "attachmentStyle": "{attachment_style}",
  "analysis": {{
    "detailedBreakdown": {{
      "strengths": ["3 strengths citing their specific answers"],
      "challenges": ["3 challenges from their exact responses"],
      "relationshipPatterns": ["3 patterns referencing specific questions they answered"]
    }},
    "healingPath": "Personalized guidance that mentions their specific situation and words",
    "triggers": ["3 triggers identified from their actual responses"],
    "copingTechniques": [
      {{"technique": "Name", "description": "Why this helps based on what they said", "example": "Example using their situation"}},
      {{"technique": "Name", "description": "Why this helps based on what they said", "example": "Example using their situation"}}
    ]
  }}
}}

REMEMBER: Quote their answers! Make it personal!"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quiz-{user_id or 'anon'}-{datetime.now().timestamp()}-{hash(str(questions_and_answers))}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Build detailed prompt with ALL answers for accurate analysis
            prompt = f"Analyze this person's UNIQUE responses ({len(questions_and_answers)} questions):\n\n"
            for i, qa in enumerate(questions_and_answers, 1):
                prompt += f"Q{i}: {qa['question']}\n"
                prompt += f"Their answer: \"{qa['answer']}\"\n\n"
            
            prompt += f"\nBased on these SPECIFIC words and responses, provide a deeply personalized {attachment_style} analysis. Quote their actual answers to prove you read them carefully."
            
            user_msg = UserMessage(text=prompt)
            
            # 12 second timeout - need more time for detailed analysis
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=12.0
                )
            except asyncio.TimeoutError:
                logger.warning("Analysis timed out, using fallback")
                return self._get_fallback_analysis()
            
            # Parse JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                result = json.loads(clean_response)
                logger.info(f"Analyzed attachment style: {result.get('attachmentStyle')}")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse analysis JSON: {e}")
                return self._get_fallback_analysis()
                
        except Exception as e:
            logger.error(f"Error analyzing quiz: {e}", exc_info=True)
            return self._get_fallback_analysis()
    
    def _get_fallback_analysis(self) -> Dict:
        """Fallback analysis if AI fails"""
        return {
            "attachmentStyle": "secure",
            "analysis": {
                "detailedBreakdown": {
                    "strengths": [
                        "You show self-awareness in relationships",
                        "You're open to understanding your patterns",
                        "You're taking steps toward growth"
                    ],
                    "challenges": [
                        "Continue exploring your relationship patterns",
                        "Practice self-compassion during growth",
                        "Stay open to new insights"
                    ],
                    "relationshipPatterns": [
                        "You're on a journey of self-discovery",
                        "Your patterns are evolving",
                        "You're building awareness"
                    ]
                },
                "healingPath": "Continue reflecting on your relationship experiences. Consider journaling about your feelings and patterns. Be patient with yourself as you grow.",
                "triggers": [
                    "Situations that feel uncertain",
                    "Changes in relationship dynamics",
                    "Moments requiring vulnerability"
                ],
                "copingTechniques": [
                    {
                        "technique": "Mindful Self-Reflection",
                        "description": "Regular check-ins with yourself",
                        "example": "Take 5 minutes daily to journal about your feelings"
                    },
                    {
                        "technique": "Grounding Exercises",
                        "description": "Stay present during difficult moments",
                        "example": "Use 5-4-3-2-1 sensory technique when anxious"
                    }
                ]
            }
        }
    
    async def analyze_conversation(
        self,
        conversation_text: str,
        analysis_type: str = "general"
    ) -> Dict:
        """
        Analyze a conversation for patterns, red flags, and insights
        
        Args:
            conversation_text: The conversation to analyze
            analysis_type: Type of analysis (e.g., 'general', 'red_flags', 'communication_style')
        
        Returns:
            Analysis results in frontend-compatible format
        """
        try:
            system_message = """You are an expert relationship psychologist who analyzes conversations.

Analyze the conversation and return ONLY this JSON structure:
{
  "emotionalTone": {
    "user": "description of user's emotional tone",
    "partner": "description of partner's emotional tone",
    "overall": "overall emotional tone of conversation"
  },
  "miscommunicationPatterns": [
    {
      "pattern": "Pattern name",
      "description": "What this pattern looks like",
      "examples": ["example 1 from conversation", "example 2"]
    }
  ],
  "suggestions": [
    {
      "issue": "Communication issue identified",
      "betterResponse": "Suggested better way to respond",
      "explanation": "Why this would be more effective"
    }
  ],
  "overallAssessment": "comprehensive summary of the conversation dynamics"
}

Be specific, reference actual quotes, provide actionable advice. Return ONLY valid JSON."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"analysis-{datetime.now().timestamp()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            user_msg = UserMessage(text=f"Analyze this conversation:\n\n{conversation_text}")
            
            # 12 second timeout for analysis
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=12.0
                )
            except asyncio.TimeoutError:
                logger.warning("Conversation analysis timed out")
                return self._get_fallback_conversation_analysis()
            
            # Parse JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                analysis = json.loads(clean_response)
                return analysis
            except json.JSONDecodeError:
                # Fallback
                return self._get_fallback_conversation_analysis()
                
        except Exception as e:
            logger.error(f"Error analyzing conversation: {e}", exc_info=True)
            return self._get_fallback_conversation_analysis()
    
    def _get_fallback_conversation_analysis(self) -> Dict:
        """Fallback conversation analysis if AI fails"""
        return {
            "emotionalTone": {
                "user": "Engaged and seeking connection",
                "partner": "Reserved or guarded",
                "overall": "Mixed - one person reaching out, other responding minimally"
            },
            "miscommunicationPatterns": [
                {
                    "pattern": "Short Responses",
                    "description": "One-word or brief answers that don't invite further conversation",
                    "examples": ["Fine.", "Okay.", "Whatever."]
                }
            ],
            "suggestions": [
                {
                    "issue": "Limited engagement from partner",
                    "betterResponse": "Try: 'I notice you seem quiet. Is there something on your mind? I'm here if you want to talk.'",
                    "explanation": "This validates their feelings and creates space for them to open up without pressure"
                }
            ],
            "overallAssessment": "The conversation shows one person trying to connect while the other is being less responsive. This could indicate emotional distance, timing issues, or different communication styles."
        }
    
    async def generate_text_suggestions(
        self,
        context: str,
        situation: str,
        tone: str = "balanced"
    ) -> List[str]:
        """
        Generate text message suggestions for difficult conversations
        
        Args:
            context: Relationship context
            situation: Current situation requiring a message
            tone: Desired tone (e.g., 'firm', 'gentle', 'balanced')
        
        Returns:
            List of suggested messages
        """
        try:
            system_message = f"""You are an expert in healthy communication and relationship boundaries. 
            
Generate 3-4 text message suggestions that are:
- Respectful and clear
- Appropriate for the situation
- Authentic and not overly scripted
- {tone} in tone
- Focus on "I" statements and healthy boundaries

Return ONLY a JSON array of strings:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]

No other text or explanation."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"textsuggest-{datetime.now().timestamp()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"Context: {context}\nSituation: {situation}\n\nGenerate text message suggestions."
            user_msg = UserMessage(text=prompt)
            response = await chat.send_message(user_msg)
            
            # Parse JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                suggestions = json.loads(clean_response)
                return suggestions
            except json.JSONDecodeError:
                # Fallback: split by newlines if it's not JSON
                lines = [line.strip() for line in response.split('\n') if line.strip()]
                return lines[:4]  # Return max 4 suggestions
                
        except Exception as e:
            logger.error(f"Error generating text suggestions: {e}", exc_info=True)
            return [
                "I need some time to think about this. Can we talk later?",
                "I appreciate you sharing that with me. I'd like to respond thoughtfully.",
                "I'm working on setting healthier boundaries. I hope you can understand."
            ]
    
    async def generate_personalized_insights(
        self,
        user_id: str,
        conversation_count: int = 0,
        mood_entries_count: int = 0,
        recent_conversations: List[str] = [],
        recent_moods: List[str] = []
    ) -> Dict:
        """
        Generate personalized insights report for a user
        
        Args:
            user_id: User ID
            conversation_count: Number of conversations analyzed
            mood_entries_count: Number of mood entries analyzed
            recent_conversations: Sample of recent conversation topics
            recent_moods: Sample of recent mood entries
        
        Returns:
            Comprehensive insights report
        """
        try:
            system_message = """You are an expert relationship psychologist creating personalized insights reports.

Based on the user's activity, create a comprehensive analysis in this EXACT JSON format:
{
  "emotionalPatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "communicationStyle": "Description of their communication style",
  "relationshipGoals": ["goal 1", "goal 2", "goal 3"],
  "healingProgressScore": 75,
  "keyInsights": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "areasForGrowth": ["area 1", "area 2", "area 3"],
    "progressSigns": ["sign 1", "sign 2", "sign 3"]
  },
  "personalizedRecommendations": [
    {
      "category": "Self-Care",
      "recommendation": "Specific recommendation",
      "why": "Why this helps"
    },
    {
      "category": "Communication",
      "recommendation": "Specific recommendation",
      "why": "Why this helps"
    },
    {
      "category": "Boundaries",
      "recommendation": "Specific recommendation",
      "why": "Why this helps"
    }
  ],
  "moodTrends": {
    "pattern": "Overall mood pattern description",
    "triggers": ["trigger 1", "trigger 2"],
    "improvements": ["improvement 1", "improvement 2"]
  },
  "nextSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}

Make insights specific, actionable, and supportive. Return ONLY valid JSON."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"insights-{user_id}-{datetime.now().timestamp()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Build context from user data
            context = f"""Generate personalized insights for this user:

Activity Summary:
- {conversation_count} coaching conversations
- {mood_entries_count} mood entries tracked

Recent conversation topics: {', '.join(recent_conversations) if recent_conversations else 'Getting started with healing journey'}

Recent mood patterns: {', '.join(recent_moods) if recent_moods else 'Building emotional awareness'}

Create a comprehensive, personalized insights report that:
1. Identifies emotional patterns and growth
2. Assesses communication style
3. Provides actionable recommendations
4. Celebrates progress and strengths
5. Offers specific next steps"""
            
            user_msg = UserMessage(text=context)
            
            # 15 second timeout
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=15.0
                )
            except asyncio.TimeoutError:
                logger.warning("Insights generation timed out")
                return self._get_fallback_insights()
            
            # Parse JSON response
            try:
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                insights = json.loads(clean_response)
                logger.info("Successfully generated personalized insights")
                return insights
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse insights JSON: {e}")
                return self._get_fallback_insights()
                
        except Exception as e:
            logger.error(f"Error generating insights: {e}", exc_info=True)
            return self._get_fallback_insights()
    
    def _get_fallback_insights(self) -> Dict:
        """Fallback insights if AI generation fails"""
        return {
            "emotionalPatterns": [
                "You're building awareness of your emotional responses",
                "You're learning to recognize patterns in relationships",
                "You're developing healthier coping strategies"
            ],
            "communicationStyle": "You're on a journey of improving communication and expressing your needs more clearly.",
            "relationshipGoals": [
                "Build healthier relationship patterns",
                "Strengthen emotional boundaries",
                "Develop secure attachment style"
            ],
            "healingProgressScore": 65,
            "keyInsights": {
                "strengths": [
                    "You're committed to personal growth",
                    "You're using tools to support your healing",
                    "You're building self-awareness"
                ],
                "areasForGrowth": [
                    "Continue practicing emotional regulation",
                    "Strengthen communication skills",
                    "Build confidence in setting boundaries"
                ],
                "progressSigns": [
                    "You're engaging with healing resources",
                    "You're tracking your emotional journey",
                    "You're seeking support when needed"
                ]
            },
            "personalizedRecommendations": [
                {
                    "category": "Self-Care",
                    "recommendation": "Establish a daily check-in routine",
                    "why": "Regular self-reflection builds emotional awareness"
                },
                {
                    "category": "Communication",
                    "recommendation": "Practice 'I' statements when expressing feelings",
                    "why": "This helps communicate needs without blame"
                },
                {
                    "category": "Boundaries",
                    "recommendation": "Start with small, clear boundaries",
                    "why": "Building boundary-setting skills gradually increases confidence"
                }
            ],
            "moodTrends": {
                "pattern": "You're in the process of understanding your emotional landscape",
                "triggers": ["Uncertainty in relationships", "Boundary challenges"],
                "improvements": ["Growing self-awareness", "Seeking support"]
            },
            "nextSteps": [
                "Continue daily mood tracking",
                "Have one coaching conversation per week",
                "Practice one new boundary this week",
                "Journal about your feelings",
                "Celebrate small wins"
            ]
        }
    
    async def generate_heart_vision(
        self,
        prompt: str,
        user_name: Optional[str] = None
    ) -> Dict:
        """
        Generate a professional, photorealistic image for HeartVisions
        
        Args:
            prompt: User's description of what they want to visualize
            user_name: Optional user's first name for personalization
        
        Returns:
            Dict with image_base64 and caption
        """
        try:
            # Enhance the prompt for photorealistic, professional results
            enhanced_prompt = f"""Create a professional, photorealistic, beautifully designed image that captures this emotion/intention: {prompt}

Style requirements:
- Ultra-realistic, high-quality photography style (NOT painting or illustration)
- Professional composition and lighting
- Modern, clean aesthetic
- Emotionally evocative but sophisticated
- Cinematic quality with depth of field
- Natural colors with subtle warmth
- Should look like a professional magazine or design portfolio piece

Think: high-end lifestyle photography, not artistic painting."""
            
            logger.info("Generating HeartVision with enhanced prompt")
            
            # Initialize image generator
            image_gen = OpenAIImageGeneration(api_key=self.api_key)
            
            # Generate image using dall-e-3 with HD quality for premium results
            import asyncio
            try:
                images = await asyncio.wait_for(
                    image_gen.generate_images(
                        prompt=enhanced_prompt,
                        model="dall-e-3",
                        number_of_images=1
                        # Note: size and quality parameters not supported by emergentintegrations library
                        # The library will use DALL-E 3 defaults: 1024x1024 size and standard quality
                    ),
                    timeout=45.0  # 45 second timeout for HD generation
                )
            except asyncio.TimeoutError:
                logger.error("Image generation timed out after 30 seconds")
                raise Exception("Image generation took too long. Please try again.")
            
            if not images or len(images) == 0:
                raise Exception("No image was generated")
            
            # Convert to base64
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            
            # Generate a supportive caption
            caption_prompts = [
                f"Here's what that feeling might look like{', ' + user_name if user_name else ''}.",
                "This image reflects your intention beautifully.",
                "Take a moment with this — does it capture your emotion?",
                f"Beautiful{', ' + user_name if user_name else ''}. Let this vision guide your heart.",
                "Your feelings, visualised. What do you notice?",
            ]
            
            import random
            caption = random.choice(caption_prompts)
            
            logger.info("Successfully generated HeartVision image")
            
            return {
                "image_base64": image_base64,
                "caption": caption
            }
            
        except Exception as e:
            logger.error(f"Error generating heart vision: {e}", exc_info=True)
            raise
    
    async def generate_text_to_speech(
        self,
        text: str,
        voice: str = "shimmer"
    ) -> str:
        """
        Generate soothing text-to-speech audio for visualization practices
        Uses user's OpenAI API key for high-quality voices
        
        Args:
            text: The text to convert to speech
            voice: Voice to use (shimmer, alloy, echo, fable, onyx, nova)
        
        Returns:
            Base64-encoded audio (MP3)
        """
        try:
            logger.info(f"Generating TTS with voice: {voice}")
            
            # Use user's OpenAI API key for TTS
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                logger.error("OPENAI_API_KEY not found for TTS")
                raise Exception("OpenAI API key not configured for text-to-speech")
            
            # Use OpenAI API directly
            import httpx
            
            url = "https://api.openai.com/v1/audio/speech"
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "tts-1",  # Standard quality, faster
                "input": text,
                "voice": voice,
                "response_format": "mp3"
            }
            
            # Generate audio with timeout
            import asyncio
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code != 200:
                    logger.error(f"OpenAI TTS error: {response.status_code} - {response.text}")
                    raise Exception(f"TTS generation failed: {response.status_code}")
                
                audio_bytes = response.content
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            logger.info(f"Successfully generated TTS audio ({len(audio_bytes)} bytes)")
            return audio_base64
            
        except Exception as e:
            logger.error(f"Error generating TTS: {e}", exc_info=True)
            raise
    
    def _get_fallback_questions(self) -> List[Dict]:
        """Fallback quiz questions if AI generation fails - matches frontend format"""
        return [
            {
                "id": 1,
                "question": "When a friend needs space, I usually...",
                "options": [
                    "Give them space while feeling secure in our friendship",
                    "Feel worried and want to check in frequently",
                    "Feel relieved and enjoy having more time to myself",
                    "Feel confused and unsure how to respond"
                ]
            },
            {
                "id": 2,
                "question": "In a disagreement with someone I care about, I tend to...",
                "options": [
                    "Express my feelings calmly and listen to theirs",
                    "Feel intense emotions and need immediate resolution",
                    "Withdraw and need time alone to process",
                    "React unpredictably depending on the situation"
                ]
            },
            {
                "id": 3,
                "question": "When thinking about close relationships, I...",
                "options": [
                    "Feel optimistic and trust they can be fulfilling",
                    "Worry about being hurt or let down",
                    "Prefer to maintain my independence",
                    "Have mixed feelings about getting too close"
                ]
            },
            {
                "id": 4,
                "question": "If someone important to me doesn't respond to my messages quickly, I...",
                "options": [
                    "Assume they're busy and trust they'll respond when they can",
                    "Start to worry and check my phone repeatedly",
                    "Don't really mind and prefer not to message constantly anyway",
                    "Feel anxious but try to suppress it"
                ]
            },
            {
                "id": 5,
                "question": "When someone gets close to me emotionally, I...",
                "options": [
                    "Welcome the closeness and feel comfortable",
                    "Feel excited but also scared they might leave",
                    "Start to feel uncomfortable and pull away",
                    "Experience conflicting desires for closeness and distance"
                ]
            },
            {
                "id": 6,
                "question": "My view of myself in relationships is...",
                "options": [
                    "I'm worthy of care and have healthy connections with others",
                    "I need constant reassurance that I'm valued",
                    "I'm fine on my own and don't need much from others",
                    "I'm not sure what I need or deserve"
                ]
            },
            {
                "id": 7,
                "question": "When someone I trust shares their feelings with me, I...",
                "options": [
                    "Listen openly and appreciate their vulnerability",
                    "Feel anxious about saying the wrong thing",
                    "Feel somewhat uncomfortable with emotional conversations",
                    "Want to engage but also want to escape"
                ]
            },
            {
                "id": 8,
                "question": "Trust in my relationships...",
                "options": [
                    "Comes naturally when I feel respected and cared for",
                    "Is hard for me - I want to trust but fear disappointment",
                    "Takes a very long time and lots of proof",
                    "Fluctuates - sometimes I trust, sometimes I don't"
                ]
            },
            {
                "id": 9,
                "question": "When upset with someone I care about, I prefer to...",
                "options": [
                    "Talk it through with them openly",
                    "Seek immediate comfort and reassurance",
                    "Process my feelings alone first",
                    "Alternate between wanting support and pushing away"
                ]
            },
            {
                "id": 10,
                "question": "My typical pattern in close relationships is...",
                "options": [
                    "Balanced between independence and connection",
                    "Intense and often filled with worry",
                    "Emotionally reserved but stable",
                    "Unpredictable and sometimes inconsistent"
                ]
            }
        ]


# Create singleton instance
ai_service = AIService()
