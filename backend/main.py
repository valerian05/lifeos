import os
import json
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# -----------------------------
# ENV
# -----------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/lifeos.db")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# -----------------------------
# DB
# -----------------------------
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
CORE_PROMPT = """
You are LifeOS, an autonomous AI operating system.

Respond ONLY with valid JSON.
No markdown. No explanations.

Schema:
{
  "intent": "string",
  "actions": [
    { "type": "ADD_TASK | COMPLETE_TASK | ADD_PROJECT | NO_ACTION", "value": "string" }
  ]
}
"""

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

# -----------------------------
# ROUTES
# -----------------------------
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

@app.get("/projects", response_model=List[Project])
def get_projects():
    return projects

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
# AI EXECUTION
# -----------------------------
@app.post("/execute")
def execute_intent(intent: Intent):
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
        data = json.loads(raw)

        results = [execute_action(a) for a in data.get("actions", [])]

        db.add(
            Memory(
                command=intent.command,
                ai_json=json.dumps(data),
                action_result=" | ".join(results),
            )
        )
        db.commit()

        return {
            "intent": data.get("intent"),
            "actions": data.get("actions"),
            "result": results,
        }

    except json.JSONDecodeError:
        return {"error": "AI returned invalid JSON"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()
