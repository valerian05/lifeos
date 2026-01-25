import { useEffect, useState } from "react";

export default function HealthCheck() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [root, setRoot] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    // Root
    fetch(`${API_BASE_URL}/`)
      .then(res => res.json())
      .then(setRoot)
      .catch(console.error);

    // Health
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(setHealth)
      .catch(console.error);

    // Users
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error);

    // Tasks
    fetch(`${API_BASE_URL}/tasks`)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);

    // Projects
    fetch(`${API_BASE_URL}/projects`)
      .then(res => res.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>LifeOS Backend Status</h1>

      <section>
        <h2>Root Status:</h2>
        <pre>{root ? JSON.stringify(root, null, 2) : "Loading..."}</pre>
      </section>

      <section>
        <h2>Health Check:</h2>
        <pre>{health ? JSON.stringify(health, null, 2) : "Loading..."}</pre>
      </section>

      <section>
        <h2>Users:</h2>
        <pre>{users ? JSON.stringify(users, null, 2) : "Loading..."}</pre>
      </section>

      <section>
        <h2>Tasks:</h2>
        <pre>{tasks ? JSON.stringify(tasks, null, 2) : "Loading..."}</pre>
      </section>

      <section>
        <h2>Projects:</h2>
        <pre>{projects ? JSON.stringify(projects, null, 2) : "Loading..."}</pre>
      </section>
    </div>
  );
}
