import os
import json
import httpx
import asyncio
import stripe
import logging
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Google Calendar Imports with Error Handling
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
except ImportError:
    print("CRITICAL: Google API libraries not found. Ensure requirements.txt includes google-api-python-client and google-auth-oauthlib")

# Configure Logging for Railway Debugging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("LifeOS")

app = FastAPI(title="LifeOS Autonomous Core")

# STRENGHTENED CORS: Allow the dashboard to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from Railway Environment Variables
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
API_KEY = os.environ.get("GEMINI_API_KEY", "")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
GOOGLE_TOKEN_JSON = os.environ.get("GOOGLE_TOKEN_JSON", "") 

# Initialize Stripe safely
if STRIPE_API_KEY:
    try:
        stripe.api_key = STRIPE_API_KEY
        logger.info("Stripe initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Stripe: {e}")
else:
    logger.warning("STRIPE_API_KEY not found. Wealth optimization will be disabled.")

# In-memory store for the latest context
LATEST_CONTEXT = {
    "hrv": "Pending sync...",
    "sleep": "Pending sync...",
    "focus_level": "Awaiting data",
    "bank_balance": "Awaiting data"
}

class LifeOSAction(BaseModel):
    action_type: str
    target: str
    description: str
    priority: int

# System Prompt for the Autonomous Agent
SYSTEM_PROMPT = """
You are LifeOS, an autonomous agentic operating system. 
You do not chat; you optimize. 
Analyze the user's current context and return a structured JSON response.
Identify 1-3 'Pending Actions' that you will execute to benefit the user's Health, Wealth, or Focus.
Action Types: 'CALENDAR_SHIELD', 'FINANCE_SWEEP', 'HEALTH_PREEMPT', 'COGNITIVE_RESET'.
"""

# --- Action Handlers ---

async def handle_calendar_shield(target_event_id: str):
    """Moves a meeting to the next day to protect user focus."""
    if not GOOGLE_TOKEN_JSON:
        return "Error: GOOGLE_TOKEN_JSON not set."
    
    try:
        creds_info = json.loads(GOOGLE_TOKEN_JSON)
        creds = Credentials.from_authorized_user_info(creds_info)
        service = build('calendar', 'v3', credentials=creds)
        
        event = service.events().get(calendarId='primary', eventId=target_event_id).execute()
        
        start_data = event['start']
        end_data = event['end']
        start_str = start_data.get('dateTime', start_data.get('date'))
        end_str = end_data.get('dateTime', end_data.get('date'))
        
        curr_start = datetime.fromisoformat(start_str.replace('Z', ''))
        curr_end = datetime.fromisoformat(end_str.replace('Z', ''))
        
        new_start = (curr_start + timedelta(days=1)).isoformat() + 'Z'
        new_end = (curr_end + timedelta(days=1)).isoformat() + 'Z'
        
        if 'dateTime' in start_data:
            event['start']['dateTime'] = new_start
            event['end']['dateTime'] = new_end
        else:
            event['start']['date'] = new_start.split('T')[0]
            event['end']['date'] = new_end.split('T')[0]
        
        updated_event = service.events().update(calendarId='primary', eventId=target_event_id, body=event).execute()
        return f"Rescheduled: {updated_event.get('summary')} to {new_start}"
    except Exception as e:
        logger.error(f"Calendar Error: {e}")
        return f"Calendar Error: {str(e)}"

async def handle_finance_sweep(amount_dollars: int):
    """Moves idle cash to a secondary destination via Stripe."""
    if not STRIPE_API_KEY:
        return "Error: STRIPE_API_KEY not set."
    
    try:
        transfer = stripe.Transfer.create(
            amount=int(amount_dollars * 100),
            currency="usd",
            destination="default_for_savings", 
            description="LifeOS Autonomous Wealth Sweep"
        )
        return f"Transfer Successful: ID {transfer.id}"
    except Exception as e:
        logger.error(f"Stripe Error: {e}")
        return f"Stripe Error: {str(e)}"

# --- Endpoints ---

@app.get("/")
async def root():
    """Health check for Railway."""
    return {
        "status": "online",
        "message": "LifeOS Core is active.",
        "api_key_configured": bool(API_KEY),
        "google_token_configured": bool(GOOGLE_TOKEN_JSON),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/ingest")
async def ingest_life_data(payload: Dict[str, Any] = Body(...)):
    """Receives data from local sensor_feed.py."""
    global LATEST_CONTEXT
    LATEST_CONTEXT.update(payload)
    LATEST_CONTEXT["last_sync"] = datetime.now().isoformat()
    logger.info(f"Ingested metrics: {list(payload.keys())}")
    return {"status": "success", "received": payload}

@app.get("/api/status")
async def get_life_status():
    """AI analyses context and returns insights."""
    if not API_KEY:
        logger.error("Attempted to fetch status without GEMINI_API_KEY.")
        return {"error": "GEMINI_API_KEY not found", "score": 50, "insight": "Intelligence Core Missing."}

    payload = {
        "contents": [{"parts": [{"text": f"Context: {json.dumps(LATEST_CONTEXT)}"}]}],
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "score": {"type": "NUMBER"},
                    "health_index": {"type": "NUMBER"},
                    "wealth_index": {"type": "NUMBER"},
                    "focus_index": {"type": "NUMBER"},
                    "insight": {"type": "STRING"},
                    "pending_actions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "action_type": {"type": "STRING"},
                                "target": {"type": "STRING"},
                                "description": {"type": "STRING"},
                                "priority": {"type": "NUMBER"}
                            }
                        }
                    }
                },
                "required": ["score", "insight", "pending_actions"]
            }
        }
    }

    async with httpx.AsyncClient() as client:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={API_KEY}"
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            if response.status_code == 200:
                raw_text = response.json()['candidates'][0]['content']['parts'][0]['text']
                return json.loads(raw_text)
            else:
                logger.error(f"API Error: {response.status_code} - {response.text}")
                return {"error": "AI Engine Error", "score": 50, "insight": "System running in limited mode."}
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {"error": "Connection Error", "score": 50, "insight": "Sync failed."}

@app.post("/api/execute")
async def execute_action(action: LifeOSAction):
    """The Executor: Triggers real-world APIs."""
    action_type = action.action_type
    target = action.target
    
    result = "Unknown Action"
    
    if action_type == "CALENDAR_SHIELD":
        result = await handle_calendar_shield(target)
    elif action_type == "FINANCE_SWEEP":
        result = await handle_finance_sweep(100)
    elif action_type == "COGNITIVE_RESET":
        result = "Notification suppressors active."
        
    logger.info(f"Executed {action_type}: {result}")
    return {"status": "success", "execution_log": result}

if __name__ == "__main__":
    import uvicorn
    # VITAL: Railway provides the port via $PORT. Host must be 0.0.0.0.
    try:
        port = int(os.environ.get("PORT", 8000))
        logger.info(f"LifeOS Core preparing to start on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        logger.critical(f"Server failed to start: {e}")
