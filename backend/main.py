# main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import openai

# -------------------------------
# Load OpenAI API key
# -------------------------------
openai.api_key = os.getenv("OPENAI_API_KEY")

# -------------------------------
# Load Core Prompt
# -------------------------------
with open("core_prompt.txt") as f:
    CORE_PROMPT = f.read()

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lifeos-vert.vercel.app"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Models
# -------------------------------
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

# -------------------------------
# In-memory data
# -------------------------------
tasks = [
    {"id": 1, "title": "Finish project", "done": True},
    {"id": 2, "title": "Review PR", "done": True},
]

users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "name": "Charlie"},
]

projects = [
    {"id": 1, "name": "LifeOS", "status": "Active"},
    {"id": 2, "name": "Personal AI", "status": "Planning"},
]

memory = []  # Optional AI memory

# -------------------------------
# Basic Routes
# -------------------------------
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

# -------------------------------
# CRUD Routes
# -------------------------------
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
def toggle_project_status(project_id: int):
    status_order = ["Planning", "Active", "Completed"]
    for p in projects:
        if p["id"] == project_id:
            current_index = status_order.index(p["status"])
            p["status"] = status_order[(current_index + 1) % len(status_order)]
            return p
    return {"error": "Project not found"}, 404

# -------------------------------
# AI Command Executor
# -------------------------------
@app.post("/execute")
def execute_intent(intent: Intent):
    user_command = intent.command
    try:
        # Include memory in prompt (optional)
        memory_prompt = ""
        for m in memory[-10:]:  # last 10 commands
            memory_prompt += f"Command: {m['command']}\nResponse: {m['response']}\n"

        messages = [
            {"role": "system", "content": CORE_PROMPT},
            {"role": "user", "content": memory_prompt + f"User command: {user_command}"}
        ]

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7
        )

        ai_message = response.choices[0].message.content

        # Save to memory
        memory.append({"command": user_command, "response": ai_message})

        return {
            "command_received": user_command,
            "status": "executed",
            "message": ai_message
        }

    except Exception as e:
        return {"error": str(e)}
