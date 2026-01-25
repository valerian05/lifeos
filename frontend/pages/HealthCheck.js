// pages/HealthCheck.js
import { useEffect, useState } from "react";
import { fetchStatus, fetchHealth, fetchUsers } from "../src/api";

export default function HealthCheck() {
  const [status, setStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus()
      .then(data => setStatus(data))
      .catch(err => setError(err.message));

    fetchHealth()
      .then(data => setHealth(data))
      .catch(err => setError(err.message));

    fetchUsers()
      .then(data => setUsers(data))
      .catch(err => setError(err.message));
  }, []);

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
        <h2>Users (example route):</h2>
        <pre>{users ? JSON.stringify(users, null, 2) : "Loading..."}</pre>
      </div>
    </div>
  );
}
