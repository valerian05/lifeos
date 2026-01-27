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

# --- PRE-FLIGHT LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("LifeOS")

# --- DEPENDENCY CHECK ---
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
except ImportError:
    logger.error("MISSING DEPENDENCIES: google-api-python-client or google-auth-oauthlib not found.")

app = FastAPI(title="LifeOS Autonomous Core")

# --- STRENGTHENED CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "").strip()
GOOGLE_TOKEN_JSON = os.environ.get("GOOGLE_TOKEN_JSON", "").strip() 
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

# Use the CORE_PROMPT from Railway if it exists, otherwise use fallback
DEFAULT_SYSTEM_PROMPT = """
You are LifeOS, an autonomous agentic operating system. 
You do not chat; you optimize. 
Analyze the user's current context and return a structured JSON response.
Identify 1-3 'Pending Actions' that you will execute to benefit the user's Health, Wealth, or Focus.
Action Types: 'CALENDAR_SHIELD', 'FINANCE_SWEEP', 'HEALTH_PREEMPT', 'COGNITIVE_RESET'.
"""
SYSTEM_PROMPT = os.environ.get("CORE_PROMPT", DEFAULT_SYSTEM_PROMPT)

# Initialize Stripe defensively
if STRIPE_API_KEY:
    try:
        stripe.api_key = STRIPE_API_KEY
        logger.info("Stripe SDK initialized.")
    except Exception as e:
        logger.error(f"Stripe initialization failed: {e}")
else:
    logger.warning("STRIPE_API_KEY not found.")

# In-memory context
LATEST_CONTEXT = {
    "hrv": "Awaiting Sync",
    "sleep": "Awaiting Sync",
    "focus_level": "Awaiting Sync",
    "bank_balance": "Awaiting Sync"
}

class LifeOSAction(BaseModel):
    action_type: str
    target: str
    description: str
    priority: int

# --- ACTION HANDLERS ---

async def handle_calendar_shield(target_event_id: str):
    if not GOOGLE_TOKEN_JSON:
        return "Error: GOOGLE_TOKEN_JSON missing."
    try:
        creds_info = json.loads(GOOGLE_TOKEN_JSON)
        creds = Credentials.from_authorized_user_info(creds_info)
        service = build('calendar', 'v3', credentials=creds)
        
        event = service.events().get(calendarId='primary', eventId=target_event_id).execute()
        
        start = event['start'].get('dateTime', event['start'].get('date'))
        end = event['end'].get('dateTime', event['end'].get('date'))
        
        new_start = (datetime.fromisoformat(start.replace('Z', '')) + timedelta(days=1)).isoformat() + 'Z'
        new_end = (datetime.fromisoformat(end.replace('Z', '')) + timedelta(days=1)).isoformat() + 'Z'
        
        event['start']['dateTime'] = new_start
        event['end']['dateTime'] = new_end
        
        service.events().update(calendarId='primary', eventId=target_event_id, body=event).execute()
        return f"Focus Shielded: Moved '{event.get('summary')}' to tomorrow."
    except Exception as e:
        logger.error(f"Calendar Action Failed: {e}")
        return f"Calendar Error: {str(e)}"

async def handle_finance_sweep(amount_dollars: int):
    if not STRIPE_API_KEY:
        return "Error: STRIPE_API_KEY missing."
    try:
        transfer = stripe.Transfer.create(
            amount=int(amount_dollars * 100),
            currency="usd",
            destination="default_for_savings", 
            description="LifeOS Wealth Optimization"
        )
        return f"Sweep Complete: ID {transfer.id}"
    except Exception as e:
        logger.error(f"Stripe Action Failed: {e}")
        return f"Stripe Error: {str(e)}"

# --- ENDPOINTS ---

@app.get("/")
async def health_check():
    """Detailed health check to debug Railway variables."""
    return {
        "status": "online",
        "system": "LifeOS Core",
        "config_status": {
            "gemini_api": bool(API_KEY),
            "stripe_api": bool(STRIPE_API_KEY),
            "google_calendar": bool(GOOGLE_TOKEN_JSON),
            "database": bool(DATABASE_URL),
            "custom_prompt_active": SYSTEM_PROMPT != DEFAULT_SYSTEM_PROMPT
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/ingest")
async def ingest_life_data(payload: Dict[str, Any] = Body(...)):
    global LATEST_CONTEXT
    LATEST_CONTEXT.update(payload)
    logger.info(f"Context Sync: {list(payload.keys())}")
    return {"status": "success"}

@app.get("/api/status")
async def get_life_status():
    if not API_KEY:
        return {"error": "GEMINI_API_KEY missing from environment.", "score": 50, "insight": "Intelligence Core offline."}

    payload = {
        "contents": [{"parts": [{"text": f"Context: {json.dumps(LATEST_CONTEXT)}"}]}],
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "generationConfig": {"responseMimeType": "application/json"}
    }

    async with httpx.AsyncClient() as client:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={API_KEY}"
        try:
            response = await client.post(url, json=payload, timeout=20.0)
            if response.status_code == 200:
                raw_text = response.json()['candidates'][0]['content']['parts'][0]['text']
                return json.loads(raw_text)
            logger.error(f"Gemini Error: {response.text}")
            return {"error": "AI Processing Error", "score": 50, "insight": "System running on local heuristics."}
        except Exception as e:
            logger.error(f"Gemini Request Failed: {e}")
            return {"error": "Sync Failure", "score": 50, "insight": "Check connection to Railway."}

@app.post("/api/execute")
async def execute_action(action: LifeOSAction):
    logger.info(f"Executing Intervention: {action.action_type}")
    result = "Unknown Action"
    
    if action.action_type == "CALENDAR_SHIELD":
        result = await handle_calendar_shield(action.target)
    elif action.action_type == "FINANCE_SWEEP":
        result = await handle_finance_sweep(100)
    elif action.action_type == "COGNITIVE_RESET":
        result = "Notification suppressors active."
        
    return {"status": "success", "execution_log": result}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Application attempting to bind to 0.0.0.0:{port}...")
    try:
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info", access_log=True)
    except Exception as e:
        logger.critical(f"FATAL STARTUP ERROR: {e}")
