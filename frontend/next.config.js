import os
import json
import httpx
import asyncio
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LifeOS Autonomous Core")

# Enable CORS for Next.js (Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your Vercel domain
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
# The environment provides the key at runtime via GEMINI_API_KEY
API_KEY = os.environ.get("GEMINI_API_KEY", "")

def get_system_prompt():
    """Loads system instructions from core_prompt.txt."""
    try:
        prompt_path = os.path.join(os.path.dirname(__file__), "core_prompt.txt")
        with open(prompt_path, "r") as f:
            return f.read()
    except Exception as e:
        # Fallback to a basic autonomous prompt if file is missing
        return "You are LifeOS, an autonomous agentic operating system. You optimize the user's health, wealth, and focus. Return structured JSON only."

class LifeOSAction(BaseModel):
    action_type: str
    target: str
    description: str
    priority: int

async def call_gemini_with_retry(payload: dict, retries: int = 5):
    """
    Implementation of mandatory exponential backoff for Gemini API.
    Retries: 1s, 2s, 4s, 8s, 16s
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={API_KEY}"
    
    async with httpx.AsyncClient() as client:
        for i in range(retries):
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    return response.json()
                # If rate limited or server error, trigger retry
                if response.status_code in [429, 500, 503]:
                    await asyncio.sleep(2 ** i)
                    continue
                response.raise_for_status()
            except Exception as e:
                if i == retries - 1:
                    raise e
                await asyncio.sleep(2 ** i)
    return None

@app.get("/api/status")
async def get_life_status():
    """
    Calculates current Life Alignment Score and identifies autonomous actions.
    """
    # Simulated User Context - In production, pull from your database/wearable APIs
    user_context = {
        "hrv": "Low (Stress Detected)",
        "sleep_quality": "58%",
        "available_capital": "$4,200",
        "calendar_load": "High (Back-to-back meetings)",
        "current_focus": "Degraded",
        "last_optimized": "4 hours ago"
    }

    system_instruction = get_system_prompt()

    payload = {
        "contents": [{"parts": [{"text": f"Current Context: {json.dumps(user_context)}"}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
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

    try:
        result = await call_gemini_with_retry(payload)
        if result:
            raw_content = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(raw_content)
    except Exception as e:
        print(f"Gemini API Error: {e}")
    
    # Fallback response if AI is unavailable after retries
    return {
        "score": 50,
        "health_index": 50,
        "wealth_index": 50,
        "focus_index": 50,
        "insight": "AI Intelligence Core is currently recalibrating. System running in localized safety mode.",
        "pending_actions": []
    }

@app.post("/api/execute")
async def execute_action(action: LifeOSAction):
    """
    Endpoint to execute an autonomous life optimization.
    """
    # In a real build, this would trigger external API calls (e.g., Plaid, Google Calendar)
    print(f"LifeOS EXECUTION: {action.action_type} for {action.target} - {action.description}")
    return {"status": "success", "message": f"Autonomous action '{action.action_type}' completed successfully."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
