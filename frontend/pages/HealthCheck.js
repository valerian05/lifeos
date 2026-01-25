import { useEffect, useState } from "react";

export default function HealthCheck() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [root, setRoot] = useState(null);
  const [health, setHealth] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Fetch initial data
  const fetchData = () => {
    fetch(`${API_BASE_URL}/`).then(r => r.json()).then(setRoot);
    fetch(`${API_BASE_URL}/health`).then(r => r.json()).then(setHealth);
    fetch(`${API_BASE_URL}/tasks`).then(r => r.json()).then(setTasks);
  };

  useEffect(() => { fetchData(); }, []);

  const badge = (text, color) => (
    <span style={{ backgroundColor: color, color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>{text}</span>
  );

  const toggleTask = async (id) => {
    await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "PATCH" });
    fetchData(); // refresh tasks
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

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
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
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Action</th>
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
    </div>
  );
}
