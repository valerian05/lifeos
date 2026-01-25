// pages/HealthCheck.js
import { useEffect, useState } from "react";

export default function HealthCheck() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Make sure this is set in Vercel

  const [status, setStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  // Fetch Root status
  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => setError(err.message));

    // Fetch Health
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setError(err.message));

    // Fetch Users
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Failed to fetch users:", err));
  }, [API_BASE_URL]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>LifeOS Backend Status</h1>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div>
        <h2>Root Status:</h2>
        <pre>{status ? JSON.stringify(status, null, 2) : "Loading..."}</pre>
      </div>

      <div>
        <h2>Health Check:</h2>
        <pre>{health ? JSON.stringify(health, null, 2) : "Loading..."}</pre>
      </div>

      <div>
        <h2>Users:</h2>
        <pre>{users ? JSON.stringify(users, null, 2) : "Loading..."}</pre>
      </div>
    </div>
  );
}
