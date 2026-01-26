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
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, default="demo")
    command = Column(Text)
    ai_json = Column(Text)
    action_result = Column(Text)

class TaskModel(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    done = Column(Integer, default=0)

class ProjectModel(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    status = Column(String, default="Planning")

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
    db: Session = SessionLocal()
    try:
        rows = db.query(TaskModel).all()
        return [
            {"id": r.id, "title": r.title, "done": bool(r.done)}
            for r in rows
        ]
    finally:
        db.close()

@app.get("/projects", response_model=List[Project])
def get_projects():
    db: Session = SessionLocal()
    try:
        rows = db.query(ProjectModel).all()
        return [
            {"id": r.id, "name": r.name, "status": r.status}
            for r in rows
        ]
    finally:
        db.close()

# -----------------------------
# ACTION EXECUTOR
# -----------------------------
def execute_action(action: dict, db: Session) -> str:
    action_type = action.get("type")
    value = (action.get("value") or "").strip()

    if action_type == "ADD_TASK" and value:
        db.add(TaskModel(title=value, done=0))
        db.commit()
        return f"Task added: {value}"

    if action_type == "COMPLETE_TASK" and value:
        task = (
            db.query(TaskModel)
            .filter(TaskModel.title.ilike(value))
            .first()
        )
        if task:
            task.done = 1
            db.commit()
            return f"Task completed: {value}"
        return f"Task not found: {value}"

    if action_type == "ADD_PROJECT" and value:
        db.add(ProjectModel(name=value, status="Planning"))
        db.commit()
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
        ai_data = json.loads(raw_output)

        actions = ai_data.get("actions", [])
        results = []

        for action in actions:
            results.append(execute_action(action, db))

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
