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

  const badge = (text, color) => (
    <span
      style={{
        backgroundColor: color,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        fontWeight: "bold",
      }}
    >
      {text}
    </span>
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>LifeOS Dashboard</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Root Status:</h2>
        <p>{root ? root.status : "Loading..."}</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Health Check:</h2>
        <p>{health ? (health.ok ? badge("Healthy ✅", "green") : badge("Problem ⚠️", "red")) : "Loading..."}</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Users:</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ backgroundColor: "#f4f4f4" }}>
                <td>{u.id}</td>
                <td>{u.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Tasks:</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ backgroundColor: "#f9f9f9" }}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.done ? badge("Done ✅", "green") : badge("Pending ❌", "orange")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Projects:</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#333", color: "#fff" }}>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ backgroundColor: "#f4f4f4" }}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>
                  {p.status === "active" && badge("Active", "green")}
                  {p.status === "planning" && badge("Planning", "blue")}
                  {p.status === "completed" && badge("Completed", "gray")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
