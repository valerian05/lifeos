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

# -------------------------------
# In-memory data (example)
# -------------------------------
tasks = [
    {"id": 1, "title": "Finish project", "done": False},
    {"id": 2, "title": "Review PR", "done": True},
]

users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "name": "Charlie"},
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

@app.get("/users", response_model=List[User])
def get_users():
    return users

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

# -------------------------------
# Update a task (toggle done)
# -------------------------------
@app.patch("/tasks/{task_id}")
def update_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = not task["done"]
            return task
    return {"error": "Task not found"}, 404

# -------------------------------
# Add a new task
# -------------------------------
@app.post("/tasks")
def add_task(task: Task):
    tasks.append(task.dict())
    return task
