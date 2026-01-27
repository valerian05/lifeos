import os
import json
import httpx
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# In-memory store for the latest context (In production, use PostgreSQL/database.py)
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
    # Simulated API execution (Stripe, Google Calendar, etc.)
    print(f"Executing {action.action_type}: {action.description}")
    # In a real setup, call handle_calendar_shield(target) here
    return {"status": "success", "message": f"Action '{action.action_type}' completed."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
