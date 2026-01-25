import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# -----------------------------
# ENV & OpenAI
# -----------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    OPENAI_API_KEY = ""
openai.api_key = OPENAI_API_KEY

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/lifeos.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

CORE_PROMPT = os.getenv(
    "CORE_PROMPT",
    """You are LifeOS, an AI operating system.
You MUST respond in this format:
PLAN:
- short reasoning
ACTION:
- ADD TASK: <title>
- COMPLETE TASK: <title>
- ADD PROJECT: <name>
- NO ACTION
Never explain outside this format."""
)

# -----------------------------
# DB Model
# -----------------------------
class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    command = Column(Text)
    ai_plan = Column(Text)
    action_result = Column(Text)

Base.metadata.create_all(bind=engine)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now to avoid frontend CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Models
# -----------------------------
class Task(BaseModel):
    id: int
    title: str
    done: bool

class Project(BaseModel):
    id: int
    name: str
    status: str

class Intent(BaseModel):
    command: str

# -----------------------------
# In-Memory State
# -----------------------------
tasks = [{"id": 1, "title": "Finish project", "done": True}]
projects = [{"id": 1, "name": "LifeOS", "status": "Active"}]

# -----------------------------
# Routes
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

@app.post("/tasks")
def add_task(task: Task):
    task_dict = task.dict()
    task_dict["id"] = len(tasks) + 1
    tasks.append(task_dict)
    return task_dict

@app.patch("/tasks/{task_id}")
def toggle_task(task_id: int):
    for t in tasks:
        if t["id"] == task_id:
            t["done"] = not t["done"]
            return t
    return {"error": "Task not found"}, 404

@app.post("/projects")
def add_project(project: Project):
    project_dict = project.dict()
    project_dict["id"] = len(projects) + 1
    projects.append(project_dict)
    return project_dict

@app.patch("/projects/{project_id}")
def toggle_project(project_id: int):
    order = ["Planning", "Active", "Completed"]
    for p in projects:
        if p["id"] == project_id:
            p["status"] = order[(order.index(p["status"]) + 1) % len(order)]
            return p
    return {"error": "Project not found"}, 404

# -----------------------------
# AI Executor
# -----------------------------
def apply_ai_action(ai_text: str):
    if "ADD TASK:" in ai_text:
        title = ai_text.split("ADD TASK:")[-1].strip()
        task = {"id": len(tasks) + 1, "title": title, "done": False}
        tasks.append(task)
        return f"✅ Task added: {title}"

    if "COMPLETE TASK:" in ai_text:
        title = ai_text.split("COMPLETE TASK:")[-1].strip()
        for t in tasks:
            if t["title"].lower() == title.lower():
                t["done"] = True
                return f"✅ Task completed: {title}"

    if "ADD PROJECT:" in ai_text:
        name = ai_text.split("ADD PROJECT:")[-1].strip()
        project = {"id": len(projects) + 1, "name": name, "status": "Planning"}
        projects.append(project)
        return f"✅ Project added: {name}"

    return "ℹ️ No action executed"

@app.post("/execute")
def execute_intent(intent: Intent):
    db: Session = SessionLocal()
    try:
        if not OPENAI_API_KEY:
            return {"error": "OPENAI_API_KEY not set"}
        messages = [
            {"role": "system", "content": CORE_PROMPT},
            {"role": "user", "content": intent.command}
        ]
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7
        )
        ai_plan = response.choices[0].message.content
        action_result = apply_ai_action(ai_plan)

        db.add(Memory(user_id="demo-user", command=intent.command, ai_plan=ai_plan, action_result=action_result))
        db.commit()

        return {"plan": ai_plan, "result": action_result}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
