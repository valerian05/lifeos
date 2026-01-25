import { useState, useEffect } from "react";

export default function Dashboard() {
  // All state & functions go here
}
const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);
const [newTaskTitle, setNewTaskTitle] = useState("");
const [newProjectName, setNewProjectName] = useState("");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

const toggleTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: "PATCH" });
  const data = await res.json();
  setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
};
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

const toggleProjectStatus = async (projectId) => {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: "PATCH" });
  const data = await res.json();
  setProjects(projects.map((p) => (p.id === projectId ? data : p)));
};
return (
  <div style={{ padding: 20, fontFamily: "Arial" }}>
    <h1>LifeOS Dashboard</h1>

    {/* Tasks Section */}
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

    {/* Projects Section */}
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
