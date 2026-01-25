import { useEffect, useState } from "react";
import CommandExecutor from "./CommandExecutor";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rootStatus, setRootStatus] = useState("");
  const [health, setHealth] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(API_BASE_URL + "/")
      .then((res) => res.json())
      .then((data) => setRootStatus(data.status))
      .catch(() => setRootStatus("Backend not reachable"));

    fetch(API_BASE_URL + "/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.ok))
      .catch(() => setHealth(false));

    fetch(API_BASE_URL + "/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setUsers([]));

    fetch(API_BASE_URL + "/tasks")
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => setTasks([]));

    fetch(API_BASE_URL + "/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>LifeOS Dashboard</h1>

      <h2>Root Status:</h2>
      <p>{rootStatus}</p>

      <h2>Health Check:</h2>
      <p>{health ? "✅ Healthy" : "❌ Unhealthy"}</p>

      <h2>Users:</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Tasks:</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.title}</td>
              <td>{t.done ? "✅ Done" : "❌ Pending"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Projects:</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CommandExecutor />
    </div>
  );
}
