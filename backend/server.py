from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
from ai_service import ai_service
from supabase import create_client, Client


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase connection (for reading conversation history)
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
supabase_client: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

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
                cursor = db.daily_reflections.find({
                    "user_id": request.user_id
                }).sort("reflection_date", -1).limit(3)  # Get last 3 reflections
                
                reflections = await cursor.to_list(length=3)
                if reflections:
                    user_reflections = reflections
                    logger.info(f"Found {len(reflections)} reflections for context")
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
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"Error in ai_chat endpoint: {e}", exc_info=True)
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
        
        if supabase_client:
            try:
                # Get recent conversations from last 30 days
                thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
                conv_response = supabase_client.table('conversation_history') \
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
        
        # Fetch daily reflections from MongoDB
        recent_moods = []
        mood_entries_count = 0
        
        try:
            thirty_days_ago_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
            reflections_cursor = db.daily_reflections.find({
                'user_id': user_id,
                'reflection_date': {'$gte': thirty_days_ago_date}
            }).sort('reflection_date', -1).limit(20)
            
            reflections = await reflections_cursor.to_list(length=20)
            mood_entries_count = len(reflections)
            
            # Extract mood/emotional themes from reflections
            for reflection in reflections[:10]:
                if 'gratitude' in reflection:
                    recent_moods.append(f"Grateful for: {reflection['gratitude'][:50]}")
                if 'proud_of' in reflection:
                    recent_moods.append(f"Proud of: {reflection['proud_of'][:50]}")
                if 'helpful_moment' in reflection:
                    recent_moods.append(f"Helpful: {reflection['helpful_moment'][:50]}")
            
            logger.info(f"Found {mood_entries_count} reflections for user")
        except Exception as e:
            logger.warning(f"Could not fetch reflections from MongoDB: {e}")
        
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
        existing = await db.daily_reflections.find_one({
            "user_id": request.user_id,
            "reflection_date": request.reflection_date
        })
        
        now = datetime.utcnow().isoformat()
        
        if existing:
            # Update existing reflection
            logger.info(f"Updating existing reflection: {existing['_id']}")
            update_data = {
                "coaches_chatted_with": request.coaches_chatted_with,
                "conversation_rating": request.conversation_rating,
                "helpful_moments": request.helpful_moments,
                "areas_for_improvement": request.areas_for_improvement,
                "updated_at": now
            }
            
            await db.daily_reflections.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
            
            # Fetch updated reflection
            updated = await db.daily_reflections.find_one({"_id": existing["_id"]})
            updated["id"] = str(updated["_id"])
            del updated["_id"]
            
            logger.info(f"Reflection updated successfully: {updated['id']}")
            return updated
        else:
            # Insert new reflection
            logger.info("Inserting new reflection")
            reflection_id = str(uuid.uuid4())
            reflection_data = {
                "id": reflection_id,
                "user_id": request.user_id,
                "reflection_date": request.reflection_date,
                "coaches_chatted_with": request.coaches_chatted_with,
                "conversation_rating": request.conversation_rating,
                "helpful_moments": request.helpful_moments,
                "areas_for_improvement": request.areas_for_improvement,
                "created_at": now,
                "updated_at": now
            }
            
            await db.daily_reflections.insert_one(reflection_data)
            
            # Remove MongoDB _id for response
            reflection_data.pop("_id", None)
            
            logger.info(f"Reflection inserted successfully: {reflection_id}")
            return reflection_data
            
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
        
        reflection = await db.daily_reflections.find_one({
            "user_id": user_id,
            "reflection_date": today
        })
        
        if reflection:
            reflection["id"] = str(reflection.get("_id", reflection.get("id")))
            reflection.pop("_id", None)
            logger.info(f"Found reflection: {reflection['id']}")
            return reflection
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
        
        cursor = db.daily_reflections.find({
            "user_id": user_id
        }).sort("reflection_date", -1).limit(limit)
        
        reflections = await cursor.to_list(length=limit)
        
        # Convert MongoDB _id to id
        for reflection in reflections:
            reflection["id"] = str(reflection.get("_id", reflection.get("id")))
            reflection.pop("_id", None)
        
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
        
        report_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        report_data = {
            "id": report_id,
            "user_id": request.user_id,
            "report_type": "comprehensive",
            "insights": request.insights,
            "conversation_count": request.conversation_count,
            "mood_entries_analyzed": request.mood_entries_analyzed,
            "attachment_style": request.attachment_style,
            "healing_progress_score": request.healing_progress_score,
            "analysis_period_start": request.analysis_period_start,
            "analysis_period_end": request.analysis_period_end,
            "created_at": now
        }
        
        await db.insights_reports.insert_one(report_data)
        
        # Remove MongoDB _id for response
        report_data.pop("_id", None)
        
        logger.info(f"Insights report saved successfully: {report_id}")
        return report_data
        
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
        
        cursor = db.insights_reports.find({
            "user_id": user_id
        }).sort("created_at", -1).limit(limit)
        
        reports = await cursor.to_list(length=limit)
        
        # Convert MongoDB _id to id
        for report in reports:
            report["id"] = str(report.get("_id", report.get("id")))
            report.pop("_id", None)
        
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
        existing = await db.daily_usage.find_one({
            "user_id": request.user_id,
            "date": today
        })
        
        if existing:
            # Increment count
            new_count = existing.get("message_count", 0) + 1
            await db.daily_usage.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "message_count": new_count,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            logger.info(f"Updated usage count to {new_count}")
        else:
            # Create new usage record
            await db.daily_usage.insert_one({
                "user_id": request.user_id,
                "date": today,
                "message_count": 1,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })
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
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        logger.info(f"🚨 EMERGENCY FIX: Restoring premium for user {user_id}")
        
        # Update subscribers table to set premium active
        response = supabase_client.table('subscribers').update({
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
        subscription = await db.subscriptions.find_one({"user_id": user_id})
        
        if subscription and subscription.get("has_premium", False):
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
        
        # Cleanup: Delete usage records older than 7 days (async, don't wait)
        seven_days_ago = (datetime.utcnow().date() - timedelta(days=7)).isoformat()
        try:
            await db.daily_usage.delete_many({
                "date": {"$lt": seven_days_ago}
            })
        except Exception as cleanup_error:
            logger.warning(f"Cleanup failed but continuing: {cleanup_error}")
        
        usage = await db.daily_usage.find_one({
            "user_id": user_id,
            "date": today
        })
        
        if usage:
            count = usage.get("message_count", 0)
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

# Include the router in the main app

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
