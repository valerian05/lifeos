import os
import json
import asyncio
from typing import List
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# -----------------------------
# DB SETUP
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/lifeos.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, default="demo")
    command = Column(Text)
    ai_json = Column(Text)
    action_result = Column(Text)

Base.metadata.create_all(bind=engine)

# -----------------------------
# CORE PROMPT
# -----------------------------
CORE_PROMPT = os.getenv(
    "CORE_PROMPT",
    """
You are LifeOS, an autonomous AI operating system.
Respond ONLY in valid JSON.

Schema:
{
  "intent": "string",
  "actions": [
    { "type": "ADD_TASK | COMPLETE_TASK | ADD_PROJECT | NO_ACTION", "value": "string" }
  ]
}
"""
)

# -----------------------------
# APP
# -----------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# MODELS
# -----------------------------
class Intent(BaseModel):
    command: str

class Task(BaseModel):
    id: int
    title: str
    done: bool

class Project(BaseModel):
    id: int
    name: str
    status: str

# -----------------------------
# STATE
# -----------------------------
tasks: List[dict] = []
projects: List[dict] = []
pending_commands: List[str] = []

# -----------------------------
# OPENAI LAZY LOADING
# -----------------------------
def get_openai_client():
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        return None
    return OpenAI(api_key=key)

def is_openai_configured():
    return bool(os.getenv("OPENAI_API_KEY", ""))

# -----------------------------
# ACTION EXECUTOR
# -----------------------------
def execute_action(action: dict) -> str:
    t = action.get("type")
    v = (action.get("value") or "").strip()

    if t == "ADD_TASK" and v:
        tasks.append({"id": len(tasks) + 1, "title": v, "done": False})
        return f"Task added: {v}"

    if t == "COMPLETE_TASK" and v:
        for task in tasks:
            if task["title"].lower() == v.lower():
                task["done"] = True
                return f"Task completed: {v}"
        return f"Task not found: {v}"

    if t == "ADD_PROJECT" and v:
        projects.append({"id": len(projects) + 1, "name": v, "status": "Planning"})
        return f"Project added: {v}"

    return "No action"

# -----------------------------
# PROCESS PENDING COMMANDS
# -----------------------------
async def process_pending_loop():
    """Background loop to auto-process queued commands"""
    while True:
        if pending_commands and is_openai_configured():
            client = get_openai_client()
            db: Session = SessionLocal()
            try:
                while pending_commands:
                    command = pending_commands.pop(0)
                    try:
                        response = client.chat.completions.create(
                            model="gpt-4o-mini",
                            temperature=0.2,
                            messages=[
                                {"role": "system", "content": CORE_PROMPT},
                                {"role": "user", "content": command}
                            ],
                        )
                        raw = response.choices[0].message.content
                        ai_data = json.loads(raw)

                        results = []
                        for action in ai_data.get("actions", []):
                            results.append(execute_action(action))

                        db.add(
                            Memory(
                                command=command,
                                ai_json=json.dumps(ai_data),
                                action_result=" | ".join(results)
                            )
                        )
                        db.commit()
                        print(f"[LifeOS] Auto-processed command: {command}")
                    except Exception as e:
                        print(f"[LifeOS] Error processing command: {command} | {e}")
                        pending_commands.insert(0, command)  # Retry later
                        break
            finally:
                db.close()
        await asyncio.sleep(5)  # Check every 5 seconds

# -----------------------------
# START BACKGROUND LOOP
# -----------------------------
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_pending_loop())

# -----------------------------
# ROUTES
# -----------------------------
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {
        "ok": True,
        "openai_configured": is_openai_configured(),
        "pending_commands": len(pending_commands)
    }

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

@app.get("/projects", response_model=List[Project])
def get_projects():
    return projects

@app.post("/execute")
def execute_intent(intent: Intent):
    client = get_openai_client()
    if not client:
        # Queue command if OpenAI not available
        pending_commands.append(intent.command)
        return {"status": "queued", "message": "OpenAI not configured. Command added to pending queue."}

    db: Session = SessionLocal()
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": CORE_PROMPT},
                {"role": "user", "content": intent.command}
            ],
        )

        raw = response.choices[0].message.content
        ai_data = json.loads(raw)

        results = []
        for action in ai_data.get("actions", []):
            results.append(execute_action(action))

        db.add(
            Memory(
                command=intent.command,
                ai_json=json.dumps(ai_data),
                action_result=" | ".join(results)
            )
        )
        db.commit()

        return {
            "intent": ai_data.get("intent"),
            "actions": ai_data.get("actions"),
            "result": results
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()
