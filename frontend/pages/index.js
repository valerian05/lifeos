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

