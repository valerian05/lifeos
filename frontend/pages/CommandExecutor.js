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
  const fetchTasks = async () => {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    const data = await res.json();
    setTasks(data);
  };

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE_URL}/projects`);
    const data = await res.json();
    setProjects(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
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
      setCommandResponse(`${data.plan}\n\n${data.result}`);
      setCommandText("");
      fetchTasks();
      fetchProjects();
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
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, done: false }),
      });
      await res.json();
      setNewTaskTitle("");
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "PATCH" });
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // Project Functions
  // ---------------------------
  const addProject = async () => {
    if (!newProjectName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, status: "Planning" }),
      });
      await res.json();
      setNewProjectName("");
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProjectStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "PATCH" });
      await res.json();
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
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
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />
      <button onClick={addTask}>Add Task</button>
      <ul>
        {tasks.map((t) => (
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
        onChange={(e) => setNewProjectName(e.target.value)}
      />
      <button onClick={addProject}>Add Project</button>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            {p.name} - {p.status}
            <button onClick={() => toggleProjectStatus(p.id)}>Toggle Status</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
