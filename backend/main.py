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
# CORE PROMPT (STRICT JSON)
# -----------------------------
CORE_PROMPT = """
You are LifeOS, an autonomous AI operating system.

RULES:
- Respond ONLY with valid JSON
- No markdown
- No explanations
- Follow schema exactly

Schema:
{
  "intent": "string",
  "actions": [
    {
      "type": "ADD_TASK | COMPLETE_TASK | ADD_PROJECT | NO_ACTION",
      "value": "string"
    }
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
# STATE (v1 simple memory)
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
    action_type = action.get("type")
    value = (action.get("value") or "").strip()

    if action_type == "ADD_TASK" and value:
        tasks.append({
            "id": len(tasks) + 1,
            "title": value,
            "done": False
        })
        return f"Task added: {value}"

    if action_type == "COMPLETE_TASK" and value:
        for t in tasks:
            if t["title"].lower() == value.lower():
                t["done"] = True
                return f"Task completed: {value}"
        return f"Task not found: {value}"

    if action_type == "ADD_PROJECT" and value:
        projects.append({
            "id": len(projects) + 1,
            "name": value,
            "status": "Planning"
        })
        return f"Project added: {value}"

    return "No action"

# -----------------------------
# AI EXECUTION ENDPOINT
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

        raw_output = response.choices[0].message.content.strip()

        # HARD JSON PARSE
        ai_data = json.loads(raw_output)

        actions = ai_data.get("actions", [])
        results = []

        for action in actions:
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
            "actions": actions,
            "result": results
        }

    except json.JSONDecodeError:
        return {
            "error": "AI did not return valid JSON",
            "raw": raw_output
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()
