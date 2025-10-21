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
from datetime import datetime
from ai_service import ai_service


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
        
        response = await ai_service.chat_with_coach(
            coach_id=request.coach_id,
            user_message=request.message,
            conversation_history=history_dicts,
            session_id=session_id,
            user_name=request.user_name
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
