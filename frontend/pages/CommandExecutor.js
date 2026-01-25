// frontend/pages/CommandExecutor.js
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CommandExecutor() {
  const [commandText, setCommandText] = useState("");
  const [commandResponse, setCommandResponse] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  // ---------------------------
  // Fetch tasks & projects
  // ---------------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/tasks`).then(r => r.json()).then(setTasks);
    fetch(`${API_BASE_URL}/projects`).then(r => r.json()).then(setProjects);
  }, []);

  // ---------------------------
  // Command Executor
  // ---------------------------
  const sendCommand = async () => {
    setCommandResponse("Processing...");
    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandText }),
      });
      const data = await res.json();
      setCommandResponse(data.message);
      setCommandText("");
    } catch (err) {
      setCommandResponse("Backend not reachable");
      console.error(err);
    }
  };

  // ---------------------------
  // Task Functions
  // ---------------------------
  const addTask = async () => {
    if (!newTaskTitle) return;
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tasks.length + 1, title: newTaskTitle, done: false }),
    });
    const data = await res.json();
    setTasks([...tasks, data]);
    setNewTaskTitle("");
  };

  const toggleTask = async (id) => {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "PATCH" });
    const data = await res.json();
    setTasks(tasks.map(t => t.id === id ? data : t));
  };

  // ---------------------------
  // Project Functions
  // ---------------------------
  const addProject = async () => {
    if (!newProjectName) return;
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projects.length + 1, name: newProjectName, status: "Planning" }),
    });
    const data = await res.json();
    setProjects([...projects, data]);
    setNewProjectName("");
  };

  const toggleProjectStatus = async (id) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "PATCH" });
    const data = await res.json();
    setProjects(projects.map(p => p.id === id ? data : p));
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>Command Executor</h2>
      <input
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell LifeOS what to do"
        value={commandText}
        onChange={(e) => setCommandText(e.target.value)}
      />
      <button style={{ marginTop: 10, padding: 10 }} onClick={sendCommand}>
        Send
      </button>
      <pre style={{ marginTop: 20 }}>{commandResponse}</pre>

      {/* Tasks */}
      <h3>Tasks</h3>
      <input
        placeholder="New task"
        value={newTaskTitle}
        onChange={e => setNewTaskTitle(e.target.value)}
      />
      <button onClick={addTask}>Add Task</button>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            {t.title} - {t.done ? "✅" : "❌"}
            <button onClick={() => toggleTask(t.id)}>Toggle</button>
          </li>
        ))}
      </ul>

      {/* Projects */}
      <h3>Projects</h3>
      <input
        placeholder="New project"
        value={newProjectName}
        onChange={e => setNewProjectName(e.target.value)}
      />
      <button onClick={addProject}>Add Project</button>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            {p.name} - {p.status}
            <button onClick={() => toggleProjectStatus(p.id)}>Toggle Status</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
