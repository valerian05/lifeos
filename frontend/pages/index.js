import { useState, useEffect } from "react";

// Get backend URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  // ---------------------------
  // States
  // ---------------------------
  const [rootStatus, setRootStatus] = useState("Loading...");
  const [healthStatus, setHealthStatus] = useState("Loading...");
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [commandText, setCommandText] = useState("");
  const [commandResponse, setCommandResponse] = useState("");

  // ---------------------------
  // Fetch initial data
  // ---------------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/`).then(res => res.json()).then(data => setRootStatus(data.status));
    fetch(`${API_BASE_URL}/health`).then(res => res.json()).then(data => setHealthStatus(data.ok ? "✅ Healthy" : "❌ Unhealthy"));
    fetch(`${API_BASE_URL}/users`).then(res => res.json()).then(setUsers);
    fetch(`${API_BASE_URL}/tasks`).then(res => res.json()).then(setTasks);
    fetch(`${API_BASE_URL}/projects`).then(res => res.json()).then(setProjects);
  }, []);

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
      setCommandResponse("Backend not reachable yet");
      console.error(err);
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>LifeOS Dashboard</h1>

      <h2>Root Status:</h2>
      <p>{rootStatus}</p>

      <h2>Health Check:</h2>
      <p>{healthStatus}</p>

      <h2>Users:</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>ID</th><th>Name</th></tr>
        </thead>
        <tbody>
          {users.map(u => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td></tr>)}
        </tbody>
      </table>

      <h2>Tasks:</h2>
      <input
        style={{ width: "60%", padding: 5 }}
        placeholder="New task title"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />
      <button style={{ padding: 5, marginLeft: 5 }} onClick={addTask}>Add Task</button>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr><th>ID</th><th>Title</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.title}</td>
              <td>{t.done ? "✅ Done" : "❌ Pending"}</td>
              <td><button onClick={() => toggleTask(t.id)}>Toggle</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Projects:</h2>
      <input
        style={{ width: "60%", padding: 5 }}
        placeholder="New project name"
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
      />
      <button style={{ padding: 5, marginLeft: 5 }} onClick={addProject}>Add Project</button>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.status}</td>
              <td><button onClick={() => toggleProjectStatus(p.id)}>Toggle Status</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Command Executor</h2>
      <input
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell LifeOS what to do"
        value={commandText}
        onChange={(e) => setCommandText(e.target.value)}
      />
      <button style={{ marginTop: 10, padding: 10 }} onClick={sendCommand}>Send</button>
      <pre style={{ marginTop: 20 }}>{commandResponse}</pre>
    </div>
  );
}
