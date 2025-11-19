from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta, date
from ai_service import ai_service
from supabase import create_client, Client


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Supabase connection
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")
    raise RuntimeError("Supabase credentials not configured")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
logger.info(f"✅ Supabase connected to: {SUPABASE_URL}")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# AI Chat Models
class ChatMessage(BaseModel):
    content: str
    sender: str  # 'user' or 'coach'
    
class ChatRequest(BaseModel):
    message: str
    coach_id: str
    conversation_history: List[ChatMessage] = []
    user_name: Optional[str] = None
    user_id: Optional[str] = None  # Add user_id to fetch reflections

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Quiz Models
class QuizRequest(BaseModel):
    category: str = "attachment_style"
    num_questions: int = 10

# Conversation Analysis Models
class ConversationAnalysisRequest(BaseModel):
    conversation_text: str
    analysis_type: str = "general"

# Text Suggestions Models
class TextSuggestionsRequest(BaseModel):
    context: str
    situation: str
    tone: str = "balanced"

# Quiz Analysis Models
class QuizAnalysisRequest(BaseModel):
    questions_and_answers: List[Dict]
    user_id: Optional[str] = None

# Heart Vision Models
class HeartVisionRequest(BaseModel):
    prompt: str
    user_name: Optional[str] = None

# Insights Models
class InsightsRequest(BaseModel):
    user_id: str

# Text to Speech Models
class TextToSpeechRequest(BaseModel):
    text: str
    voice: str = "shimmer"  # Default to shimmer (most soothing)

# Daily Reflection Models
class DailyReflectionSave(BaseModel):
    user_id: str
    reflection_date: str
    coaches_chatted_with: List[str]
    conversation_rating: Optional[int] = None
    helpful_moments: Optional[str] = None
    areas_for_improvement: Optional[str] = None

class DailyReflectionResponse(BaseModel):
    id: str
    user_id: str
    reflection_date: str
    coaches_chatted_with: List[str]
    conversation_rating: Optional[int]
    helpful_moments: Optional[str]
    areas_for_improvement: Optional[str]
    created_at: str
    updated_at: str

# Usage Tracking Models
class UsageTrackRequest(BaseModel):
    user_id: str
    coach_id: str

class UsageResponse(BaseModel):
    message_count: int
    can_send_message: bool
    remaining_messages: int

# Insights Models
class InsightsSaveRequest(BaseModel):
    user_id: str
    insights: Dict
    conversation_count: int
    mood_entries_analyzed: int
    attachment_style: str
    healing_progress_score: int
    analysis_period_start: str
    analysis_period_end: str

class InsightsResponse(BaseModel):
    id: str
    user_id: str
    report_type: str
    insights: Dict
    conversation_count: int
    mood_entries_analyzed: int
    attachment_style: str
    healing_progress_score: int
    analysis_period_start: str
    analysis_period_end: str
    created_at: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World - Powered by Supabase"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Create a status check (for testing)"""
    try:
        status_obj = StatusCheck(client_name=input.client_name)
        
        # Insert into Supabase (not critical, just for testing)
        # We'll skip this for now as it's just a test endpoint
        
        return status_obj
    except Exception as e:
        logger.error(f"Error creating status check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/status")
async def get_status_checks():
    """Get status checks (for testing)"""
    return {"message": "Status check endpoint - MongoDB removed, using Supabase"}

# ============ AI ENDPOINTS ============

@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest):
    """
    Chat with an AI coach
    """
    try:
        # Generate session ID based on coach and timestamp
        session_id = f"{request.coach_id}-{datetime.now().strftime('%Y%m%d-%H')}"
        
        # Convert ChatMessage models to dicts for the AI service
        history_dicts = [{"content": msg.content, "sender": msg.sender} for msg in request.conversation_history]
        
        # Fetch user's recent reflections for personalization
        user_reflections = None
        if request.user_id:
            try:
                logger.info(f"Fetching reflections for user {request.user_id} to personalize chat")
                
                # Fetch from Supabase daily_reflections table
                response = supabase.table('daily_reflections') \
                    .select('*') \
                    .eq('user_id', request.user_id) \
                    .order('reflection_date', desc=True) \
                    .limit(3) \
                    .execute()
                
                if response.data:
                    user_reflections = response.data
                    logger.info(f"Found {len(response.data)} reflections for context")
            except Exception as e:
                logger.warning(f"Could not fetch reflections: {e}")
                # Continue without reflections if fetch fails
        
        response = await ai_service.chat_with_coach(
            coach_id=request.coach_id,
            user_message=request.message,
            conversation_history=history_dicts,
            session_id=session_id,
            user_name=request.user_name,
            user_reflections=user_reflections
        )
        
        # Track usage for monitoring
        try:
            supabase.table('usage_tracking').insert({
                "type": "coach_chat",
                "coach_id": request.coach_id,
                "user_id": request.user_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                "message_length": len(request.message),
                "response_length": len(response),
                "success": True
            }).execute()
        except Exception as track_error:
            logger.warning(f"Failed to track usage: {track_error}")
            # Don't fail the request if tracking fails
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Error in ai_chat endpoint: {e}", exc_info=True)
        
        # Track failed request
        try:
            supabase.table('usage_tracking').insert({
                "type": "coach_chat",
                "coach_id": request.coach_id,
                "user_id": request.user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "success": False,
                "error": str(e)
            }).execute()
        except Exception as track_error:
            logger.warning(f"Failed to track error: {track_error}")
        
        raise HTTPException(status_code=500, detail="Failed to get AI response")

@api_router.post("/ai/quiz/generate")
async def generate_quiz(request: QuizRequest):
    """
    Generate fresh daily quiz questions
    """
    try:
        questions = await ai_service.generate_daily_quiz_questions(
            category=request.category,
            num_questions=request.num_questions
        )
        
        return {"questions": questions}
        
    except Exception as e:
        logger.error(f"Error generating quiz: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate quiz")

@api_router.post("/ai/quiz/analyze")
async def analyze_quiz(request: QuizAnalysisRequest):
    """
    Analyze attachment style quiz results with AI
    """
    try:
        result = await ai_service.analyze_attachment_quiz(
            questions_and_answers=request.questions_and_answers,
            user_id=request.user_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing quiz: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze quiz")

@api_router.post("/ai/analyze-conversation")
async def analyze_conversation(request: ConversationAnalysisRequest):
    """
    Analyze a conversation for patterns and insights
    """
    try:
        analysis = await ai_service.analyze_conversation(
            conversation_text=request.conversation_text,
            analysis_type=request.analysis_type
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing conversation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze conversation")

@api_router.post("/ai/text-suggestions")
async def generate_text_suggestions(request: TextSuggestionsRequest):
    """
    Generate text message suggestions
    """
    try:
        suggestions = await ai_service.generate_text_suggestions(
            context=request.context,
            situation=request.situation,
            tone=request.tone
        )
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")

@api_router.post("/ai/heart-vision")
async def generate_heart_vision(request: HeartVisionRequest):
    """
    Generate a professional, photorealistic HeartVision image
    """
    try:
        result = await ai_service.generate_heart_vision(
            prompt=request.prompt,
            user_name=request.user_name
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating heart vision: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/insights")
async def generate_insights(request: InsightsRequest):
    """
    Generate personalized insights report based on actual user data
    """
    try:
        user_id = request.user_id
        logger.info(f"Generating insights for user {user_id}")
        
        # Fetch actual conversation data from Supabase
        recent_conversations = []
        conversation_count = 0
        
        try:
            # Get recent conversations from last 30 days
            thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
            conv_response = supabase.table('conversation_history') \
                .select('message, coach_name') \
                .eq('user_id', user_id) \
                .eq('sender', 'user') \
                .gte('created_at', thirty_days_ago) \
                .order('created_at', desc=True) \
                .limit(50) \
                .execute()
            
            if conv_response.data:
                conversation_count = len(conv_response.data)
                # Extract conversation topics/themes from user messages
                recent_conversations = [msg['message'][:100] for msg in conv_response.data[:10]]
                logger.info(f"Found {conversation_count} conversations for user")
        except Exception as e:
            logger.warning(f"Could not fetch conversations from Supabase: {e}")
        
        # Fetch daily reflections from Supabase
        recent_moods = []
        mood_entries_count = 0
        
        try:
            thirty_days_ago_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
            reflections_response = supabase.table('daily_reflections') \
                .select('*') \
                .eq('user_id', user_id) \
                .gte('reflection_date', thirty_days_ago_date) \
                .order('reflection_date', desc=True) \
                .limit(20) \
                .execute()
            
            reflections = reflections_response.data if reflections_response.data else []
            mood_entries_count = len(reflections)
            
            # Extract mood/emotional themes from reflections
            for reflection in reflections[:10]:
                if reflection.get('grateful_for'):
                    recent_moods.append(f"Grateful for: {reflection['grateful_for'][:50]}")
                if reflection.get('proud_of'):
                    recent_moods.append(f"Proud of: {reflection['proud_of'][:50]}")
                if reflection.get('helpful_moment'):
                    recent_moods.append(f"Helpful: {reflection['helpful_moment'][:50]}")
            
            logger.info(f"Found {mood_entries_count} reflections for user")
        except Exception as e:
            logger.warning(f"Could not fetch reflections from Supabase: {e}")
        
        # Generate insights with real data
        insights = await ai_service.generate_personalized_insights(
            user_id=user_id,
            conversation_count=conversation_count,
            mood_entries_count=mood_entries_count,
            recent_conversations=recent_conversations if recent_conversations else ["Starting healing journey"],
            recent_moods=recent_moods if recent_moods else ["Building self-awareness"]
        )
        
        logger.info(f"Successfully generated insights for user {user_id}")
        return insights
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate insights")

@api_router.post("/ai/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Generate soothing text-to-speech audio for visualization practices
    """
    try:
        audio_base64 = await ai_service.generate_text_to_speech(
            text=request.text,
            voice=request.voice
        )
        
        return {"audio": audio_base64}
        
    except Exception as e:
        logger.error(f"Error generating TTS: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ============ DAILY REFLECTION ENDPOINTS ============

@api_router.post("/reflections/save")
async def save_daily_reflection(request: DailyReflectionSave):
    """
    Save or update daily reflection
    """
    try:
        logger.info(f"Saving reflection for user {request.user_id} on {request.reflection_date}")
        
        # Check if reflection already exists for this user and date
        existing_response = supabase.table('daily_reflections') \
            .select('*') \
            .eq('user_id', request.user_id) \
            .eq('reflection_date', request.reflection_date) \
            .execute()
        
        now = datetime.utcnow().isoformat()
        
        if existing_response.data and len(existing_response.data) > 0:
            # Update existing reflection
            existing = existing_response.data[0]
            logger.info(f"Updating existing reflection: {existing['id']}")
            
            update_data = {
                "coaches_chatted_with": request.coaches_chatted_with,
                "conversation_rating": request.conversation_rating,
                "helpful_moments": request.helpful_moments,
                "areas_for_improvement": request.areas_for_improvement,
                "updated_at": now
            }
            
            updated_response = supabase.table('daily_reflections') \
                .update(update_data) \
                .eq('id', existing['id']) \
                .execute()
            
            logger.info(f"Reflection updated successfully: {existing['id']}")
            return updated_response.data[0] if updated_response.data else existing
        else:
            # Insert new reflection
            logger.info("Inserting new reflection")
            reflection_data = {
                "user_id": request.user_id,
                "reflection_date": request.reflection_date,
                "coaches_chatted_with": request.coaches_chatted_with,
                "conversation_rating": request.conversation_rating,
                "helpful_moments": request.helpful_moments,
                "areas_for_improvement": request.areas_for_improvement,
            }
            
            insert_response = supabase.table('daily_reflections') \
                .insert(reflection_data) \
                .execute()
            
            logger.info(f"Reflection inserted successfully")
            return insert_response.data[0] if insert_response.data else reflection_data
            
    except Exception as e:
        logger.error(f"Error saving reflection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save reflection: {str(e)}")

@api_router.get("/reflections/today/{user_id}")
async def get_today_reflection(user_id: str):
    """
    Get today's reflection for a user
    """
    try:
        today = datetime.utcnow().date().isoformat()
        logger.info(f"Fetching today's reflection for user {user_id} on {today}")
        
        response = supabase.table('daily_reflections') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('reflection_date', today) \
            .execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Found reflection: {response.data[0]['id']}")
            return response.data[0]
        else:
            logger.info("No reflection found for today")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching today's reflection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch reflection")

@api_router.get("/reflections/past/{user_id}")
async def get_past_reflections(user_id: str, limit: int = 30):
    """
    Get ALL reflections for a user (including today)
    """
    try:
        logger.info(f"Fetching ALL reflections for user {user_id}")
        
        response = supabase.table('daily_reflections') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('reflection_date', desc=True) \
            .limit(limit) \
            .execute()
        
        reflections = response.data if response.data else []
        
        logger.info(f"Found {len(reflections)} reflections")
        return reflections
        
    except Exception as e:
        logger.error(f"Error fetching reflections: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch reflections")

# ============ INSIGHTS ENDPOINTS ============

@api_router.post("/insights/save")
async def save_insights_report(request: InsightsSaveRequest):
    """
    Save a generated insights report
    """
    try:
        logger.info(f"Saving insights report for user {request.user_id}")
        
        now = datetime.utcnow().isoformat()
        
        report_data = {
            "user_id": request.user_id,
            "report_type": "comprehensive",
            "insights": request.insights,
            "conversation_count": request.conversation_count,
            "mood_entries_analyzed": request.mood_entries_analyzed,
            "attachment_style": request.attachment_style,
            "healing_progress_score": request.healing_progress_score,
            "period_start": request.analysis_period_start,
            "period_end": request.analysis_period_end,
        }
        
        response = supabase.table('insights_reports') \
            .insert(report_data) \
            .execute()
        
        logger.info(f"Insights report saved successfully")
        return response.data[0] if response.data else report_data
        
    except Exception as e:
        logger.error(f"Error saving insights report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save insights report")

@api_router.get("/insights/reports/{user_id}")
async def get_user_insights_reports(user_id: str, limit: int = 10):
    """
    Get all insights reports for a user
    """
    try:
        logger.info(f"Fetching insights reports for user {user_id}")
        
        response = supabase.table('insights_reports') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .limit(limit) \
            .execute()
        
        reports = response.data if response.data else []
        
        logger.info(f"Found {len(reports)} insights reports")
        return reports
        
    except Exception as e:
        logger.error(f"Error fetching insights reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch insights reports")

# ============ USAGE TRACKING ENDPOINTS ============

@api_router.post("/usage/track")
async def track_message_usage(request: UsageTrackRequest):
    """
    Track message usage (10 per day for free users, resets midnight UTC)
    Premium users from Supabase have unlimited messages
    """
    try:
        logger.info(f"Tracking usage for user {request.user_id}")
        
        # For now, give unlimited to ALL users (will be controlled by frontend Supabase check)
        # Frontend AuthContext checks Supabase for premium status
        # Premium users won't hit this endpoint anyway
        
        today = datetime.utcnow().date().isoformat()
        logger.info(f"Tracking message usage for FREE user {request.user_id} with coach {request.coach_id}")
        
        # Check if usage record exists for today
        existing_response = supabase.table('daily_usage') \
            .select('*') \
            .eq('user_id', request.user_id) \
            .eq('date', today) \
            .execute()
        
        if existing_response.data and len(existing_response.data) > 0:
            # Increment count
            existing = existing_response.data[0]
            new_count = existing.get("message_count", 0) + 1
            
            supabase.table('daily_usage') \
                .update({
                    "message_count": new_count,
                    "updated_at": datetime.utcnow().isoformat()
                }) \
                .eq('id', existing['id']) \
                .execute()
            
            logger.info(f"Updated usage count to {new_count}")
        else:
            # Create new usage record
            supabase.table('daily_usage').insert({
                "user_id": request.user_id,
                "date": today,
                "message_count": 1,
            }).execute()
            
            new_count = 1
            logger.info("Created new usage record with count 1")
        
        can_send = new_count < 10
        remaining = max(0, 10 - new_count)
        
        return UsageResponse(
            message_count=new_count,
            can_send_message=can_send,
            remaining_messages=remaining
        )
        
    except Exception as e:
        logger.error(f"Error tracking usage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to track usage")

@api_router.post("/fix-premium/{user_id}")
async def fix_premium_access(user_id: str):
    """
    Emergency fix for Apple IAP premium access
    """
    try:
        logger.info(f"🚨 EMERGENCY FIX: Restoring premium for user {user_id}")
        
        # Update subscribers table to set premium active
        response = supabase.table('subscribers').update({
            'plan_type': 'premium',
            'status': 'active',
            'subscribed': True,
            'payment_status': 'active',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('user_id', user_id).execute()
        
        logger.info(f"✅ Premium fixed for user {user_id}")
        
        return {
            "success": True,
            "message": "Premium access restored",
            "data": response.data
        }
    except Exception as e:
        logger.error(f"Error fixing premium: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/usage/check/{user_id}")
async def check_message_usage(user_id: str):
    """
    Check current daily usage for a user
    Premium users have unlimited messages
    """
    try:
        logger.info(f"Checking usage for user {user_id}")
        
        # 🚨 CHECK PREMIUM STATUS FIRST - Premium users have unlimited messages
        # Check subscribers table for premium status
        subscriber_response = supabase.table('subscribers') \
            .select('*') \
            .eq('user_id', user_id) \
            .execute()
        
        if subscriber_response.data and len(subscriber_response.data) > 0:
            subscriber = subscriber_response.data[0]
            has_premium = subscriber.get("subscribed", False) or subscriber.get("status") == "active"
            
            if has_premium:
                logger.info(f"✅ User {user_id} is PREMIUM - unlimited messages")
                return {
                    "message_count": 0,  # Don't track for premium users
                    "can_send_message": True,
                    "remaining_messages": 999,  # Show as unlimited
                    "is_premium": True,
                    "seconds_until_reset": None,  # No reset needed for premium
                    "reset_time": None
                }
        
        # Free user - check usage and enforce limits
        today = datetime.utcnow().date().isoformat()
        logger.info(f"Checking usage for FREE user {user_id}")
        
        usage_response = supabase.table('daily_usage') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('date', today) \
            .execute()
        
        if usage_response.data and len(usage_response.data) > 0:
            count = usage_response.data[0].get("message_count", 0)
        else:
            count = 0
        
        can_send = count < 10
        remaining = max(0, 10 - count)
        
        # Calculate time until midnight UTC (reset time)
        now = datetime.utcnow()
        tomorrow = datetime(now.year, now.month, now.day) + timedelta(days=1)
        seconds_until_reset = int((tomorrow - now).total_seconds())
        
        return {
            "message_count": count,
            "can_send_message": can_send,
            "remaining_messages": remaining,
            "seconds_until_reset": seconds_until_reset,
            "reset_time": tomorrow.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error checking usage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to check usage")

@api_router.get("/admin/usage-stats")
async def get_usage_stats(days: int = 7):
    """
    Get usage statistics for monitoring
    Shows message volume and success rates
    """
    try:
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        # Get all usage tracking from Supabase
        response = supabase.table('usage_tracking') \
            .select('*') \
            .eq('type', 'coach_chat') \
            .gte('timestamp', cutoff_date) \
            .execute()
        
        all_messages = response.data if response.data else []
        total_messages = len(all_messages)
        
        # Count successful and failed
        successful = sum(1 for msg in all_messages if msg.get('success', True))
        failed = total_messages - successful
        
        success_rate = (successful / total_messages * 100) if total_messages > 0 else 100
        
        # Group by coach for popular coaches
        coach_counts = {}
        for msg in all_messages:
            if msg.get('success', True):
                coach_id = msg.get('coach_id', 'unknown')
                coach_counts[coach_id] = coach_counts.get(coach_id, 0) + 1
        
        popular_coaches = [{"_id": coach, "count": count} 
                          for coach, count in sorted(coach_counts.items(), 
                                                     key=lambda x: x[1], reverse=True)]
        
        return {
            "period_days": days,
            "total_messages": total_messages,
            "successful_messages": successful,
            "failed_messages": failed,
            "success_rate": round(success_rate, 2),
            "popular_coaches": popular_coaches[:10],
            "average_per_day": round(total_messages / days, 1) if days > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error fetching usage stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    logger.info("Application shutting down")
