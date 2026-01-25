import { useState, useEffect } from "react";

// ---------------------------
// Main Dashboard Component
// ---------------------------
export default function Dashboard() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // ---------------------------
  // State
  // ---------------------------
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [command, setCommand] = useState("");
  const [commandResponse, setCommandResponse] = useState("");

  // ---------------------------
  // Fetch initial data
  // ---------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tasksRes = await fetch(`${API_BASE_URL}/tasks`);
        setTasks(await tasksRes.json());

        const projectsRes = await fetch(`${API_BASE_URL}/projects`);
        setProjects(await projectsRes.json());
      } catch (err) {
        console.error("Backend fetch failed", err);
      }
    };

    fetchData();
  }, []);

  // ---------------------------
  // Task functions
  // ---------------------------
  const addTask = async () => {
    if (!newTaskTitle) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tasks.length + 1, title: newTaskTitle, done: false }),
      });
      const data = await res.json();
      setTasks([...tasks, data]);
      setNewTaskTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: "PATCH" });
      const data = await res.json();
      setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // Project functions
  // ---------------------------
  const addProject = async () => {
    if (!newProjectName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projects.length + 1, name: newProjectName, status: "Planning" }),
      });
      const data = await res.json();
      setProjects([...projects, data]);
      setNewProjectName("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProjectStatus = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: "PATCH" });
      const data = await res.json();
      setProjects(projects.map((p) => (p.id === projectId ? data : p)));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // Command Executor
  // ---------------------------
  const sendCommand = async () => {
    if (!command) return;
    setCommandResponse("Processing...");
    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      setCommandResponse(data.message || JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setCommandResponse("Backend not reachable");
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>LifeOS Dashboard</h1>

      {/* --------------------------- */}
      {/* Command Executor */}
      {/* --------------------------- */}
      <h2>Command Executor</h2>
      <input
        style={{ width: "60%", padding: 5 }}
        placeholder="Tell LifeOS what to do"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />
      <button style={{ padding: 5, marginLeft: 5 }} onClick={sendCommand}>
        Send
      </button>
      <pre style={{ marginTop: 10 }}>{commandResponse}</pre>

      {/* --------------------------- */}
      {/* Tasks Section */}
      {/* --------------------------- */}
      <h2>Tasks:</h2>
      <input
        style={{ width: "60%", padding: 5 }}
        placeholder="New task title"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />
      <button style={{ padding: 5, marginLeft: 5 }} onClick={addTask}>
        Add Task
      </button>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.title}</td>
              <td>{t.done ? "✅ Done" : "❌ Pending"}</td>
              <td>
                <button onClick={() => toggleTask(t.id)}>Toggle</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --------------------------- */}
      {/* Projects Section */}
      {/* --------------------------- */}
      <h2>Projects:</h2>
      <input
        style={{ width: "60%", padding: 5 }}
        placeholder="New project name"
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
      />
      <button style={{ padding: 5, marginLeft: 5 }} onClick={addProject}>
        Add Project
      </button>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={() => toggleProjectStatus(p.id)}>Toggle Status</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
