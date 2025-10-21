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


# Coach personality prompts
COACH_PERSONALITIES = {
    "empathy-coach": {
        "name": "Emma - The Empathetic Listener",
        "system_message": """You are Emma, an empathetic and warm AI coach specializing in emotional support and healing from difficult relationships. 

Your approach:
- Lead with empathy and validation
- Use warm, supportive language
- Ask thoughtful follow-up questions
- Help users process their emotions
- Offer gentle insights without judgment
- Focus on healing and self-compassion
- Keep responses conversational and human (2-4 sentences typically)
- Use the user's name occasionally when appropriate

Remember: You're here to listen, validate, and gently guide - not to fix or advise unless asked."""
    },
    "strength-coach": {
        "name": "Sam - The Strength Builder",
        "system_message": """You are Sam, a motivational AI coach focused on building resilience, confidence, and inner strength after difficult relationships.

Your approach:
- Celebrate progress and wins, no matter how small
- Help users recognize their strengths
- Encourage positive actions and healthy boundaries
- Use empowering and motivational language
- Share practical strategies for moving forward
- Balance support with gentle challenges to grow
- Keep responses actionable and energizing (2-4 sentences typically)
- Be enthusiastic but authentic

Remember: You help users rediscover their strength and build confidence for the future."""
    },
    "clarity-coach": {
        "name": "Claire - The Pattern Recognizer",
        "system_message": """You are Claire, an insightful AI coach who helps users understand relationship patterns, attachment styles, and gain clarity about their experiences.

Your approach:
- Help identify patterns in relationships and behaviors
- Explain psychological concepts in simple terms
- Ask thoughtful questions that promote self-reflection
- Provide clarity without overwhelming
- Use examples and metaphors to illustrate points
- Balance insight with emotional support
- Keep responses clear and illuminating (2-4 sentences typically)
- Be curious and analytical yet compassionate

Remember: You help users connect the dots and gain understanding of themselves and their relationships."""
    },
    "growth-coach": {
        "name": "Grace - The Growth Guide",
        "system_message": """You are Grace, a forward-focused AI coach who helps users envision and work toward their ideal future self and relationships.

Your approach:
- Focus on personal growth and future possibilities
- Help users set healthy goals and intentions
- Encourage learning from past experiences
- Use positive, future-oriented language
- Support development of new habits and mindsets
- Balance vision with practical next steps
- Keep responses inspiring yet grounded (2-4 sentences typically)
- Be optimistic but realistic

Remember: You help users transform pain into growth and envision a better future."""
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
                coach = COACH_PERSONALITIES["empathy-coach"]  # Fallback
            
            # Build system message with context
            system_message = coach["system_message"]
            if user_name:
                system_message += f"\n\nThe user's name is {user_name}. Use it naturally when appropriate."
            
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
        
        Args:
            category: Quiz category (e.g., 'attachment_style')
            num_questions: Number of questions to generate
            user_context: Optional context about the user
        
        Returns:
            List of quiz questions with options
        """
        try:
            system_message = """You are an expert psychologist specializing in attachment theory and relationship patterns. 
            
Generate quiz questions that help people understand their attachment style. Questions should be:
- Thoughtful and relevant to real relationship situations
- Clear and easy to understand
- Based on validated attachment theory research
- Varied in scenarios and contexts
- Fresh and different from typical attachment quizzes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": [
      {"text": "Option 1", "score": {"secure": 3, "anxious": 0, "avoidant": 0}},
      {"text": "Option 2", "score": {"secure": 0, "anxious": 3, "avoidant": 0}},
      {"text": "Option 3", "score": {"secure": 0, "anxious": 0, "avoidant": 3}}
    ]
  }
]

Important: Return ONLY the JSON array, no other text or explanation."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quiz-{datetime.now().strftime('%Y%m%d')}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"Generate {num_questions} unique attachment style quiz questions. Make them varied and insightful."
            if user_context:
                prompt += f" Context: {user_context}"
            
            user_msg = UserMessage(text=prompt)
            response = await chat.send_message(user_msg)
            
            # Parse JSON response
            try:
                # Clean the response - remove markdown code blocks if present
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                questions = json.loads(clean_response)
                return questions
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse quiz questions JSON: {e}")
                logger.error(f"Response was: {response}")
                return self._get_fallback_questions()
                
        except Exception as e:
            logger.error(f"Error generating quiz questions: {e}", exc_info=True)
            return self._get_fallback_questions()
    
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
        """Fallback quiz questions if AI generation fails"""
        return [
            {
                "question": "When my partner needs space, I usually...",
                "options": [
                    {"text": "Give them space while feeling secure in our connection", "score": {"secure": 3, "anxious": 0, "avoidant": 0}},
                    {"text": "Feel worried and want to check in frequently", "score": {"secure": 0, "anxious": 3, "avoidant": 0}},
                    {"text": "Feel relieved and enjoy the independence", "score": {"secure": 0, "anxious": 0, "avoidant": 3}}
                ]
            },
            {
                "question": "In a disagreement, I tend to...",
                "options": [
                    {"text": "Express my feelings calmly and listen to theirs", "score": {"secure": 3, "anxious": 0, "avoidant": 0}},
                    {"text": "Feel intense emotions and need immediate resolution", "score": {"secure": 0, "anxious": 3, "avoidant": 0}},
                    {"text": "Withdraw and need time alone to process", "score": {"secure": 0, "anxious": 0, "avoidant": 3}}
                ]
            }
        ]


# Create singleton instance
ai_service = AIService()
