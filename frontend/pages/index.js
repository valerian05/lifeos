// ---------------------------
// Tasks Section
// ---------------------------
<h2>Tasks:</h2>

{/* Add New Task */}
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
// ---------------------------
// New state for task input
// ---------------------------
const [newTaskTitle, setNewTaskTitle] = useState("");

// ---------------------------
// Task functions
// ---------------------------
const addTask = async () => {
  if (!newTaskTitle) return;
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tasks.length + 1, title: newTaskTitle, done: false }),
    });
    const data = await res.json();
    setTasks([...tasks, data]);
    setNewTaskTitle("");
  } catch (err) {
    console.error(err);
  }
};

const toggleTask = async (taskId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PATCH",
    });
    const data = await res.json();
    setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
  } catch (err) {
    console.error(err);
  }
};
<h2>Projects:</h2>

{/* Add New Project */}
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

// ---------------------------
// Project input state
// ---------------------------
const [newProjectName, setNewProjectName] = useState("");

// ---------------------------
// Project functions
// ---------------------------
const addProject = async () => {
  if (!newProjectName) return;
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projects.length + 1, name: newProjectName, status: "Planning" }),
    });
    const data = await res.json();
    setProjects([...projects, data]);
    setNewProjectName("");
  } catch (err) {
    console.error(err);
  }
};

const toggleProjectStatus = async (projectId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "PATCH",
    });
    const data = await res.json();
    setProjects(projects.map((p) => (p.id === projectId ? data : p)));
  } catch (err) {
    console.error(err);
  }
};
