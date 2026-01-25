// frontend/pages/CommandExecutor.js
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CommandExecutor() {
  const [commandText, setCommandText] = useState("");
  const [commandResponse, setCommandResponse] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [aiPlan, setAiPlan] = useState([]); // Stores AI planned actions
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  // ---------------------------
  // Fetch tasks & projects
  // ---------------------------
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  // ---------------------------
  // AI Command Executor
  // ---------------------------
  const sendCommand = async () => {
    if (!commandText.trim()) return;
    setCommandResponse("Processing...");
    setAiPlan([]);
    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandText }),
      });
      const data = await res.json();

      if (data.error) {
        setCommandResponse(`Error: ${data.error}`);
      } else {
        // Split AI response into actionable lines
        const actions = data.plan.split("\n").filter(line => line.trim() !== "");
        setAiPlan(actions);
        setCommandResponse("AI has proposed the following actions. Review and apply:");
      }
    } catch (err) {
      console.error(err);
      setCommandResponse("Backend not reachable");
    }
  };

  // ---------------------------
  // Apply single AI action
  // ---------------------------
  const applyAiAction = async (actionText) => {
    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: actionText }),
      });
      const data = await res.json();
      setCommandResponse(prev => prev + `\n✅ Applied: ${actionText}\nResult: ${data.result}`);
      fetchTasks();
      fetchProjects();
      // Remove applied action from plan
      setAiPlan(aiPlan.filter(a => a !== actionText));
    } catch (err) {
      console.error("Error applying AI action:", err);
    }
  };

  // ---------------------------
  // Task / Project Manual Functions
  // ---------------------------
  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tasks.length + 1, title: newTaskTitle, done: false }),
      });
      setNewTaskTitle("");
      fetchTasks();
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const toggleTask = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "PATCH" });
      fetchTasks();
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const addProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projects.length + 1, name: newProjectName, status: "Planning" }),
      });
      setNewProjectName("");
      fetchProjects();
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const toggleProjectStatus = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/projects/${id}`, { method: "PATCH" });
      fetchProjects();
    } catch (err) {
      console.error("Error toggling project status:", err);
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>LifeOS Command Executor</h2>

      {/* Command Input */}
      <input
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell LifeOS what to do"
        value={commandText}
        onChange={(e) => setCommandText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendCommand()}
      />
      <button style={{ marginTop: 10, padding: 10 }} onClick={sendCommand}>
        Send Command
      </button>

      <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{commandResponse}</pre>

      {/* AI Planned Actions */}
      {aiPlan.length > 0 && (
        <div>
          <h3>AI Planned Actions</h3>
          <ul>
            {aiPlan.map((action, idx) => (
              <li key={idx}>
                {action}{" "}
                <button onClick={() => applyAiAction(action)}>Apply</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tasks */}
      <h3>Tasks</h3>
      <input
        placeholder="New task"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />
      <button onClick={addTask}>Add Task</button>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title} - {t.done ? "✅" : "❌"}{" "}
            <button onClick={() => toggleTask(t.id)}>Toggle</button>
          </li>
        ))}
      </ul>

      {/* Projects */}
      <h3>Projects</h3>
      <input
        placeholder="New project"
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
      />
      <button onClick={addProject}>Add Project</button>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            {p.name} - {p.status}{" "}
            <button onClick={() => toggleProjectStatus(p.id)}>Toggle Status</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
