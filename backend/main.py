import os
import json
import httpx
from typing import List, Dict, Any
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LifeOS Autonomous Core")

# Enable CORS for Next.js (Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Load System Prompt from core_prompt.txt
def get_system_prompt():
    try:
        # Assuming core_prompt.txt is in the same directory as main.py
        prompt_path = os.path.join(os.path.dirname(__file__), "core_prompt.txt")
        with open(prompt_path, "r") as f:
            return f.read()
    except Exception as e:
        print(f"Error loading core_prompt.txt: {e}")
        return "You are LifeOS, an autonomous operating system. Optimize the user's life."

class LifeOSAction(BaseModel):
    action_type: str
    target: str
    description: str
    priority: int

@app.get("/api/status")
async def get_life_status():
    # Simulated User Context
    user_context = {
        "hrv": "Low (Stress Detected)",
        "sleep": "5.2 hours",
        "cash_idle": "$4,200",
        "calendar_density": "High (6 back-to-back meetings)",
        "focus_score": "22%"
    }

    system_instruction = get_system_prompt()

    payload = {
        "contents": [{"parts": [{"text": f"Context: {json.dumps(user_context)}"}]}],
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

    async with httpx.AsyncClient() as client:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={API_KEY}"
        response = await client.post(url, json=payload, timeout=30.0)
        
        if response.status_code == 200:
            raw_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            return json.loads(raw_text)
        
        return {"error": "AI Engine Offline", "score": 50, "insight": "System running in limited mode."}

@app.post("/api/execute")
async def execute_action(action: LifeOSAction):
    # Log the autonomous execution
    print(f"Executing {action.action_type}: {action.description}")
    return {"status": "success", "message": f"Action '{action.action_type}' completed."}

if __name__ == "__main__":
    import uvicorn
    # Railway sets the PORT environment variable automatically
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
