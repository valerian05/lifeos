import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HealthCheck() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [root, setRoot] = useState({});
  const [health, setHealth] = useState({});

  const fetchData = async () => {
    try {
      const [rootRes, healthRes, usersRes, tasksRes, projectsRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/`).then(r => r.json()),
          fetch(`${API_BASE_URL}/health`).then(r => r.json()),
          fetch(`${API_BASE_URL}/users`).then(r => r.json()),
          fetch(`${API_BASE_URL}/tasks`).then(r => r.json()),
          fetch(`${API_BASE_URL}/projects`).then(r => r.json()),
        ]);

      setRoot(rootRes);
      setHealth(healthRes);
      setUsers(usersRes);
      setTasks(tasksRes);
      setProjects(projectsRes);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>LifeOS Dashboard</h2>
      <h3>Root Status:</h3>
      <pre>{JSON.stringify(root, null, 2)}</pre>

      <h3>Health Check:</h3>
      <pre>{JSON.stringify(health, null, 2)}</pre>

      <h3>Users:</h3>
      <table border="1" cellPadding="5">
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

      <h3>Tasks:</h3>
      <table border="1" cellPadding="5">
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

      <h3>Projects:</h3>
      <table border="1" cellPadding="5">
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
    </div>
  );
}
