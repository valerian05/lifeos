# main.py
import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import openai
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# ------------------------------
# Environment & OpenAI
# ------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise Exception("OPENAI_API_KEY not set in environment!")
openai.api_key = OPENAI_API_KEY

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lifeos.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Core Prompt from ENV
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

# ------------------------------
# Database Table
# ------------------------------
class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    command = Column(Text)
    ai_plan = Column(Text)
    action_result = Column(Text)

Base.metadata.create_all(bind=engine)

# ------------------------------
# FastAPI App
# ------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lifeos-vert.vercel.app"],  # your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Pydantic Models
# ------------------------------
class Task(BaseModel):
    id: int
    title: str
    done: bool

class User(BaseModel):
    id: int
    name: str

class Project(BaseModel):
    id: int
    name: str
    status: str

class Intent(BaseModel):
    command: str

# ------------------------------
# Temporary Identity
# ------------------------------
identities = {
    "demo-user": {"user_id": "demo-user", "name": "LifeOS Owner"}
}

# ------------------------------
# In-Memory State
# ------------------------------
tasks = [
    {"id": 1, "title": "Finish project", "done": True},
    {"id": 2, "title": "Review PR", "done": True},
]

projects = [
    {"id": 1, "name": "LifeOS", "status": "Active"},
    {"id": 2, "name": "Personal AI", "status": "Planning"},
]

users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "name": "Charlie"},
]

# ------------------------------
# Basic Routes
# ------------------------------
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/users", response_model=List[User])
def get_users():
    return users

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

@app.get("/projects", response_model=List[Project])
def get_projects():
    return projects

# ------------------------------
# CRUD Routes
# ------------------------------
@app.post("/tasks")
def add_task(task: Task):
    tasks.append(task.dict())
    return task

@app.patch("/tasks/{task_id}")
def toggle_task(task_id: int):
    for t in tasks:
        if t["id"] == task_id:
            t["done"] = not t["done"]
            return t
    return {"error": "Task not found"}, 404

@app.post("/projects")
def add_project(project: Project):
    projects.append(project.dict())
    return project

@app.patch("/projects/{project_id}")
def toggle_project(project_id: int):
    order = ["Planning", "Active", "Completed"]
    for p in projects:
        if p["id"] == project_id:
            p["status"] = order[(order.index(p["status"]) + 1) % len(order)]
            return p
    return {"error": "Project not found"}, 404

# ------------------------------
# AI Action Executor (Safe)
# ------------------------------
def apply_ai_action(ai_text: str):
    result = []
    for line in ai_text.splitlines():
        line = line.strip()
        if line.startswith("ADD TASK:"):
            title = line.replace("ADD TASK:", "").strip()
            task = {"id": len(tasks)+1, "title": title, "done": False}
            tasks.append(task)
            result.append(f"✅ Task added: {title}")

        elif line.startswith("COMPLETE TASK:"):
            title = line.replace("COMPLETE TASK:", "").strip()
            for t in tasks:
                if t["title"].lower() == title.lower():
                    t["done"] = True
                    result.append(f"✅ Task completed: {title}")
                    break

        elif line.startswith("ADD PROJECT:"):
            name = line.replace("ADD PROJECT:", "").strip()
            project = {"id": len(projects)+1, "name": name, "status": "Planning"}
            projects.append(project)
            result.append(f"✅ Project added: {name}")

    if not result:
        return "ℹ️ No action executed"

    return "\n".join(result)

# ------------------------------
# AI Command Executor Endpoint
# ------------------------------
@app.post("/execute")
def execute_intent(intent: Intent):
    user_id = "demo-user"
    command = intent.command
    db: Session = SessionLocal()

    try:
        messages = [
            {"role": "system", "content": CORE_PROMPT},
            {"role": "user", "content": command}
        ]

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7
        )

        ai_plan = response.choices[0].message.content
        action_result = apply_ai_action(ai_plan)

        # Save to DB
        db.add(Memory(
            user_id=user_id,
            command=command,
            ai_plan=ai_plan,
            action_result=action_result
        ))
        db.commit()

        return {"plan": ai_plan, "result": action_result}

    except Exception as e:
        return {"error": str(e)}

    finally:
        db.close()
