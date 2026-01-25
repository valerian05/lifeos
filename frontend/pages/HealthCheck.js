import { useEffect, useState } from "react";

export default function HealthCheck() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [root, setRoot] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/`).then(res => res.json()).then(setRoot).catch(console.error);
    fetch(`${API_BASE_URL}/health`).then(res => res.json()).then(setHealth).catch(console.error);
    fetch(`${API_BASE_URL}/users`).then(res => res.json()).then(setUsers).catch(console.error);
    fetch(`${API_BASE_URL}/tasks`).then(res => res.json()).then(setTasks).catch(console.error);
    fetch(`${API_BASE_URL}/projects`).then(res => res.json()).then(setProjects).catch(console.error);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>LifeOS Dashboard</h1>

      <section>
        <h2>Root Status:</h2>
        <p>{root ? root.status : "Loading..."}</p>
      </section>

      <section>
        <h2>Health Check:</h2>
        <p>{health ? (health.ok ? "✅ Healthy" : "⚠️ Problem") : "Loading..."}</p>
      </section>

      <section>
        <h2>Users:</h2>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Tasks:</h2>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Done</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.done ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Projects:</h2>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
