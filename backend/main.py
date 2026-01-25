from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# -------------------------------
# CORS Configuration
# -------------------------------
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
    status: str  # e.g., Active, Planning, Completed

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

# -------------------------------
# Routes
# -------------------------------
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

@app.get("/health")
def health():
    return {"ok": True}

# -------------------------------
# Users
# -------------------------------
@app.get("/users", response_model=List[User])
def get_users():
    return users

@app.post("/users")
def add_user(user: User):
    users.append(user.dict())
    return user

@app.patch("/users/{user_id}")
def edit_user(user_id: int, user: User):
    for u in users:
        if u["id"] == user_id:
            u["name"] = user.name
            return u
    return {"error": "User not found"}, 404

# -------------------------------
# Tasks
# -------------------------------
@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

@app.post("/tasks")
def add_task(task: Task):
    tasks.append(task.dict())
    return task

@app.patch("/tasks/{task_id}")
def toggle_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = not task["done"]
            return task
    return {"error": "Task not found"}, 404

@app.patch("/tasks/{task_id}/edit")
def edit_task(task_id: int, task: Task):
    for t in tasks:
        if t["id"] == task_id:
            t["title"] = task.title
            return t
    return {"error": "Task not found"}, 404

# -------------------------------
# Projects
# -------------------------------
@app.get("/projects", response_model=List[Project])
def get_projects():
    return projects

@app.post("/projects")
def add_project(project: Project):
    projects.append(project.dict())
    return project

@app.patch("/projects/{project_id}")
def toggle_project_status(project_id: int):
    status_order = ["Planning", "Active", "Completed"]
    for project in projects:
        if project["id"] == project_id:
            current_index = status_order.index(project["status"])
            project["status"] = status_order[(current_index + 1) % len(status_order)]
            return project
    return {"error": "Project not found"}, 404

@app.patch("/projects/{project_id}/edit")
def edit_project(project_id: int, project: Project):
    for p in projects:
        if p["id"] == project_id:
            p["name"] = project.name
            return p
    return {"error": "Project not found"}, 404
from pydantic import BaseModel

# -------------------------------
# Intent Model
# -------------------------------
class Intent(BaseModel):
    command: str

# -------------------------------
# Execute Intent Route
# -------------------------------
@app.post("/execute")
def execute_intent(intent: Intent):
    """
    Receives a user command and returns an action response.
    For now, it just echoes back the command.
    """
    # Placeholder for AI execution logic
    return {
        "command_received": intent.command,
        "status": "executed",
        "message": f"LIFE OS received your command: '{intent.command}'"
    }
