from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# -------------------------------
# CORS Configuration
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lifeos-vert.vercel.app"],  # your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Root Route
# -------------------------------
@app.get("/")
def root():
    return {"status": "LifeOS backend running"}

# -------------------------------
# Health Check Route
# -------------------------------
@app.get("/health")
def health():
    return {"ok": True}

# -------------------------------
# Users Route (Example)
# -------------------------------
@app.get("/users")
def get_users():
    return [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"},
        {"id": 3, "name": "Charlie"}
    ]

# -------------------------------
# Template for New Routes
# -------------------------------

# Example: /tasks
@app.get("/tasks")
def get_tasks():
    """
    Returns a list of tasks.
    Replace this with database logic later.
    """
    return [
        {"id": 1, "title": "Finish project", "done": False},
        {"id": 2, "title": "Review PR", "done": True},
    ]

# Example: /projects
@app.get("/projects")
def get_projects():
    """
    Returns a list of projects.
    """
    return [
        {"id": 1, "name": "LifeOS", "status": "active"},
        {"id": 2, "name": "Personal AI", "status": "planning"},
    ]
