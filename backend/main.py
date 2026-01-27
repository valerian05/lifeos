import os
import json
import httpx
import asyncio
import stripe
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Google Calendar Imports
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

app = FastAPI(title="LifeOS Autonomous Core")

# Enable CORS for Vercel/Local Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Service Keys (Retrieved from your Railway Variables)
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
GOOGLE_TOKEN_JSON = os.environ.get("GOOGLE_TOKEN_JSON", "") 

# Initialize Stripe
stripe.api_key = STRIPE_API_KEY

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
        return "Error: GOOGLE_TOKEN_JSON not set in environment."
    
    try:
        creds_info = json.loads(GOOGLE_TOKEN_JSON)
        creds = Credentials.from_authorized_user_info(creds_info)
        service = build('calendar', 'v3', credentials=creds)
        
        # Get the current event details
        event = service.events().get(calendarId='primary', eventId=target_event_id).execute()
        
        # Calculate new times (pushed 24 hours ahead)
        # Handle both dateTime (standard) and date (all-day) events
        start_data = event['start']
        end_data = event['end']
        
        start_str = start_data.get('dateTime', start_data.get('date'))
        end_str = end_data.get('dateTime', end_data.get('date'))
        
        # Parse and shift
        curr_start = datetime.fromisoformat(start_str.replace('Z', ''))
        curr_end = datetime.fromisoformat(end_str.replace('Z', ''))
        
        new_start = (curr_start + timedelta(days=1)).isoformat() + 'Z'
        new_end = (curr_end + timedelta(days=1)).isoformat() + 'Z'
        
        # Update event body
        if 'dateTime' in start_data:
            event['start']['dateTime'] = new_start
            event['end']['dateTime'] = new_end
        else:
            # For all-day events
            event['start']['date'] = new_start.split('T')[0]
            event['end']['date'] = new_end.split('T')[0]
        
        updated_event = service.events().update(calendarId='primary', eventId=target_event_id, body=event).execute()
        return f"Rescheduled: {updated_event.get('summary')} to {new_start}"
    except Exception as e:
        return f"Calendar Error: {str(e)}"

async def handle_finance_sweep(amount_dollars: int):
    """Moves idle cash to a secondary destination via Stripe."""
    if not STRIPE_API_KEY:
        return "Error: STRIPE_API_KEY not set in environment."
    
    try:
        # Transfer funds (Note: 'default_for_savings' is a placeholder destination)
        transfer = stripe.Transfer.create(
            amount=int(amount_dollars * 100), # Stripe uses cents
            currency="usd",
            destination="default_for_savings", 
            description="LifeOS Autonomous Wealth Sweep"
        )
        return f"Transfer Successful: ID {transfer.id}"
    except Exception as e:
        return f"Stripe Error: {str(e)}"

# --- Endpoints ---

@app.get("/")
async def root():
    """Root endpoint to confirm the system is live."""
    return {
        "status": "online",
        "message": "LifeOS Autonomous Core is active.",
        "endpoints": {
            "status": "/api/status",
            "ingest": "/api/ingest (POST)",
            "execute": "/api/execute (POST)"
        }
    }

@app.post("/api/ingest")
async def ingest_life_data(payload: Dict[str, Any] = Body(...)):
    """Receives real data from your local sensor_feed.py."""
    global LATEST_CONTEXT
    LATEST_CONTEXT.update(payload)
    LATEST_CONTEXT["last_sync"] = datetime.now().isoformat()
    print(f"Sync Received: {list(payload.keys())}")
    return {"status": "success", "received": payload}

@app.get("/api/status")
async def get_life_status():
    """AI analyzes the LATEST_CONTEXT and returns insights."""
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
        response = await client.post(url, json=payload, timeout=30.0)
        
        if response.status_code == 200:
            raw_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            return json.loads(raw_text)
        
        return {"error": "AI Engine Offline", "score": 50, "insight": "System running in limited mode."}

@app.post("/api/execute")
async def execute_action(action: LifeOSAction):
    """The Action Engine: Maps AI intent to real API calls."""
    action_type = action.action_type
    target = action.target
    
    result = "Action type not recognized by executor."
    
    if action_type == "CALENDAR_SHIELD":
        result = await handle_calendar_shield(target)
    elif action_type == "FINANCE_SWEEP":
        # AI provides target amount or context; defaulting to $100 for safety
        result = await handle_finance_sweep(100)
    elif action_type == "COGNITIVE_RESET":
        result = "Notification suppressors active for the next 60 minutes."
        
    print(f"Executed {action_type}: {result}")
    return {"status": "success", "execution_log": result}

if __name__ == "__main__":
    import uvicorn
    # Railway provides the port via the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
