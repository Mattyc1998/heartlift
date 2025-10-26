"""
AI Service for HeartLift - Powers all AI features
Uses Emergent Universal LLM Key with OpenAI GPT-4o-mini
"""
import os
import json
from typing import List, Dict, Optional
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
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


# Coach personality prompts - MUST match frontend coach IDs exactly!
COACH_PERSONALITIES = {
    "flirty": {
        "name": "Luna Love",
        "system_message": """You are Luna Love, the confidence coach for dating, flirting, and magnetic attraction!

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
- Always end with encouragement or a confidence boost

IMPORTANT: Only use the user's name in your FIRST message to them. After that, use terms like "gorgeous," "babe," "superstar" instead. Never repeat their name in subsequent messages.

Example tone: "Babe, nerves are just excitement in disguise 💖! You've got main character energy and I'm here for it ✨"

Remember: Life is a party and they deserve to be the star! Be bold, fun, and always sprinkle in sparkle! ✨"""
    },
    "therapist": {
        "name": "Dr. Sage",
        "system_message": """You are Dr. Sage, a compassionate relationship wellbeing coach specializing in attachment and relationship patterns.

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

IMPORTANT: Only use the user's name in your FIRST message to them. After that, avoid using their name repeatedly. Keep the focus on the content and insights.

Example tone: "That's natural. Anxiety often comes from attachment triggers. Let's explore what feels unsafe for you."

Remember: You help people understand themselves and build healthier relationship patterns through compassionate insight."""
    },
    "tough-love": {
        "name": "Phoenix Fire",
        "system_message": """You are Phoenix Fire, the no-BS mentor for radical self-transformation! 🔥

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

IMPORTANT: Only use the user's name in your FIRST message to them. After that, just get straight to the point without using their name. Focus on the message, not the person's name.

Example tone: "Stop playing it safe. Own it. You're stronger than you think 💪. Book that bold date and prove it."

Remember: No fluff, no excuses. Help them level up through honest, empowering coaching. You thrive on transformation! 🔥"""
    },
    "chill": {
        "name": "River Calm",
        "system_message": """You are River Calm, the laid-back friend for mindful healing and gentle perspective. 🌊

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

IMPORTANT: Only use the user's name in your FIRST message to them. After that, you don't need to use their name. Let the calm, grounding words speak for themselves.

Example tone: "Take a deep breath 🌿. Stress is a wave—you don't need to fight it, just let it pass. Let's find your calm together."

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
        user_name: Optional[str] = None
    ) -> str:
        """
        Have a conversation with an AI coach
        
        Args:
            coach_id: ID of the coach personality
            user_message: User's message
            conversation_history: Previous messages in the conversation
            session_id: Unique session ID for this conversation
            user_name: Optional user's first name
        
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
        Fast generation with 8-second timeout
        
        Args:
            category: Quiz category (e.g., 'attachment_style')
            num_questions: Number of questions to generate
            user_context: Optional context about the user
        
        Returns:
            List of quiz questions in frontend format: {id, question, options: [string]}
        """
        try:
            system_message = """You are an expert psychologist. Generate attachment style quiz questions QUICKLY.

Return ONLY this JSON format (NO explanations):
[
  {
    "question": "Short question here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  }
]

Rules:
- 4 options per question
- Option 1 = secure, Option 2 = anxious, Option 3 = avoidant, Option 4 = mixed
- Keep questions concise
- Return ONLY valid JSON, nothing else"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quiz-{datetime.now().strftime('%Y%m%d-%H')}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"Generate {num_questions} attachment quiz questions. Be FAST and concise."
            
            user_msg = UserMessage(text=prompt)
            
            # Use asyncio timeout to limit generation time to 8 seconds
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=8.0  # 8 second timeout
                )
            except asyncio.TimeoutError:
                logger.warning("Quiz generation timed out after 8 seconds, using fallback")
                return self._get_fallback_questions()
            
            # Parse JSON response
            try:
                # Clean the response
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
                
                logger.info(f"Successfully generated {len(questions)} quiz questions")
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
        Analyze attachment style quiz results with AI
        
        Args:
            questions_and_answers: List of {question: str, answer: str}
            user_id: Optional user ID for personalization
        
        Returns:
            Analysis with attachment style and detailed insights
        """
        try:
            system_message = """You are an expert psychologist specializing in attachment theory. Analyze quiz responses to determine attachment style.

Analyze the answers and return ONLY this JSON structure:
{
  "attachmentStyle": "secure|anxious|avoidant|fearful-avoidant",
  "analysis": {
    "detailedBreakdown": {
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "challenges": ["challenge 1", "challenge 2", "challenge 3"],
      "relationshipPatterns": ["pattern 1", "pattern 2", "pattern 3"]
    },
    "healingPath": "Specific, actionable guidance for growth based on their answers",
    "triggers": ["trigger 1", "trigger 2", "trigger 3"],
    "copingTechniques": [
      {
        "technique": "Technique name",
        "description": "How it helps",
        "example": "Specific example"
      },
      {
        "technique": "Technique name",
        "description": "How it helps",
        "example": "Specific example"
      }
    ]
  }
}

IMPORTANT:
- Base your analysis ONLY on the answers provided
- Be specific and reference their actual responses
- Provide actionable, practical insights
- Keep it supportive and non-judgmental
- Return ONLY valid JSON"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quiz-analysis-{datetime.now().timestamp()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Build analysis request
            prompt = "Analyze these quiz responses:\n\n"
            for i, qa in enumerate(questions_and_answers, 1):
                prompt += f"Q{i}: {qa['question']}\n"
                prompt += f"A{i}: {qa['answer']}\n\n"
            prompt += "Provide detailed attachment style analysis based on these specific answers."
            
            user_msg = UserMessage(text=prompt)
            
            # 10 second timeout for analysis
            import asyncio
            try:
                response = await asyncio.wait_for(
                    chat.send_message(user_msg),
                    timeout=10.0
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
                logger.info(f"Successfully analyzed attachment style: {result.get('attachmentStyle')}")
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
            Analysis results
        """
        try:
            system_message = """You are an expert relationship psychologist who analyzes conversations to identify:
- Communication patterns
- Red flags or concerning behaviors
- Healthy vs unhealthy dynamics
- Attachment style indicators
- Areas for improvement

Provide clear, actionable insights in a supportive tone. Format your response as JSON with these fields:
{
  "overall_assessment": "brief summary",
  "communication_style": "description of communication patterns",
  "red_flags": ["list of concerning patterns if any"],
  "green_flags": ["list of healthy patterns"],
  "attachment_indicators": "what the conversation reveals about attachment",
  "recommendations": ["actionable suggestions"]
}

Return ONLY the JSON object, no other text."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"analysis-{datetime.now().timestamp()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            user_msg = UserMessage(text=f"Analyze this conversation:\n\n{conversation_text}")
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
                
                analysis = json.loads(clean_response)
                return analysis
            except json.JSONDecodeError:
                # Fallback: return response as plain text
                return {
                    "overall_assessment": response,
                    "communication_style": "Analysis provided above",
                    "red_flags": [],
                    "green_flags": [],
                    "attachment_indicators": "",
                    "recommendations": []
                }
                
        except Exception as e:
            logger.error(f"Error analyzing conversation: {e}", exc_info=True)
            return {
                "overall_assessment": "Unable to analyze at this time.",
                "communication_style": "",
                "red_flags": [],
                "green_flags": [],
                "attachment_indicators": "",
                "recommendations": []
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
    
    def _get_fallback_questions(self) -> List[Dict]:
        """Fallback quiz questions if AI generation fails - matches frontend format"""
        return [
            {
                "id": 1,
                "question": "When my partner needs space, I usually...",
                "options": [
                    "Give them space while feeling secure in our connection",
                    "Feel worried and want to check in frequently",
                    "Feel relieved and enjoy the independence",
                    "Feel confused and unsure how to respond"
                ]
            },
            {
                "id": 2,
                "question": "In a disagreement, I tend to...",
                "options": [
                    "Express my feelings calmly and listen to theirs",
                    "Feel intense emotions and need immediate resolution",
                    "Withdraw and need time alone to process",
                    "React unpredictably depending on the situation"
                ]
            },
            {
                "id": 3,
                "question": "When thinking about relationships, I...",
                "options": [
                    "Feel optimistic and trust they can be fulfilling",
                    "Worry about being hurt or abandoned",
                    "Prefer to maintain my independence",
                    "Have mixed feelings about commitment"
                ]
            },
            {
                "id": 4,
                "question": "If my partner doesn't respond to my messages quickly, I...",
                "options": [
                    "Assume they're busy and trust they'll respond when they can",
                    "Start to worry and check my phone repeatedly",
                    "Don't really mind and prefer not to text constantly anyway",
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
                    "I'm worthy of love and have healthy relationships",
                    "I need constant reassurance that I'm loved",
                    "I'm fine on my own and don't need much from others",
                    "I'm not sure what I need or deserve"
                ]
            },
            {
                "id": 7,
                "question": "When my partner shares their feelings with me, I...",
                "options": [
                    "Listen openly and appreciate their vulnerability",
                    "Feel anxious about saying the wrong thing",
                    "Feel somewhat uncomfortable with emotional talks",
                    "Want to engage but also want to escape"
                ]
            },
            {
                "id": 8,
                "question": "Trust in relationships...",
                "options": [
                    "Comes naturally when I feel respected and cared for",
                    "Is hard for me - I want to trust but fear disappointment",
                    "Takes a very long time and lots of proof",
                    "Fluctuates - sometimes I trust, sometimes I don't"
                ]
            },
            {
                "id": 9,
                "question": "When upset in a relationship, I prefer to...",
                "options": [
                    "Talk it through with my partner openly",
                    "Seek immediate comfort and reassurance",
                    "Process my feelings alone first",
                    "Alternate between wanting support and pushing away"
                ]
            },
            {
                "id": 10,
                "question": "My typical relationship pattern is...",
                "options": [
                    "Balanced between independence and connection",
                    "Intense and often filled with anxiety",
                    "Emotionally distant but stable",
                    "Unpredictable and sometimes chaotic"
                ]
            }
        ]


# Create singleton instance
ai_service = AIService()
