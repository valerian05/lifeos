import { useEffect, useState } from "react";

export default function HealthCheck() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [root, setRoot] = useState(null);
  const [health, setHealth] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");

  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");

  // Fetch all data
  const fetchData = () => {
    fetch(`${API_BASE_URL}/`).then(r => r.json()).then(setRoot);
    fetch(`${API_BASE_URL}/health`).then(r => r.json()).then(setHealth);
    fetch(`${API_BASE_URL}/tasks`).then(r => r.json()).then(setTasks);
    fetch(`${API_BASE_URL}/users`).then(r => r.json()).then(setUsers);
    fetch(`${API_BASE_URL}/projects`).then(r => r.json()).then(setProjects);
  };

  useEffect(() => { fetchData(); }, []);

  const badge = (text, color) => (
    <span style={{ backgroundColor: color, color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>{text}</span>
  );

  // ---------------- Tasks ----------------
  const toggleTask = async (id) => {
    await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "PATCH" });
    fetchData();
  };
  const addTask = async () => {
    if (!newTaskTitle) return;
    const nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: nextId, title: newTaskTitle, done: false }),
    });
    setNewTaskTitle("");
    fetchData();
  };

  // ---------------- Users ----------------
  const addUser = async () => {
    if (!newUserName) return;
    const nextId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: nextId, name: newUserName }),
    });
    setNewUserName("");
    fetchData();
  };

  // ---------------- Projects ----------------
  const addProject = async () => {
    if (!newProjectName) return;
    const nextId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: nextId, name: newProjectName, status: "Planning" }),
    });
    setNewProjectName("");
    fetchData();
  };

  const toggleProject = async (id) => {
    await fetch(`${API_BASE_URL}/projects/${id}`, { method: "PATCH" });
    fetchData();
  };

  // ---------------- UI ----------------
  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1>LifeOS Dashboard</h1>

      <section>
        <h2>Root Status:</h2>
        <p>{root ? root.status : "Loading..."}</p>
      </section>

      <section>
        <h2>Health Check:</h2>
        <p>{health ? (health.ok ? badge("Healthy ✅", "green") : badge("Problem ⚠️", "red")) : "Loading..."}</p>
      </section>

      <section>
        <h2>Tasks:</h2>
        <input
          type="text"
          placeholder="New task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button onClick={addTask}>Add Task</button>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th><th>Title</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ backgroundColor: "#f9f9f9" }}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.done ? badge("Done ✅", "green") : badge("Pending ❌", "orange")}</td>
                <td><button onClick={() => toggleTask(t.id)}>Toggle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Users:</h2>
        <input
          type="text"
          placeholder="New user name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
        />
        <button onClick={addUser}>Add User</button>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th><th>Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ backgroundColor: "#f9f9f9" }}>
                <td>{u.id}</td><td>{u.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Projects:</h2>
        <input
          type="text"
          placeholder="New project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <button onClick={addProject}>Add Project</button>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th><th>Name</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ backgroundColor: "#f9f9f9" }}>
                <td>{p.id}</td><td>{p.name}</td>
                <td>{badge(p.status, p.status==="Active"?"green":p.status==="Planning"?"orange":"blue")}</td>
                <td><button onClick={() => toggleProject(p.id)}>Next Status</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}
