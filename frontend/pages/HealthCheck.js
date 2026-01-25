const handleEdit = async (type, id, value) => {
  const endpointMap = {
    task: "tasks",
    user: "users",
    project: "projects"
  };
  const editPath = type === "task" ? `tasks/${id}/edit` :
                   type === "project" ? `projects/${id}/edit` :
                   `users/${id}`;

  await fetch(`${API_BASE_URL}/${editPath}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(type === "task" ? { id, title: value, done: false } :
                         type === "project" ? { id, name: value, status: "Planning" } :
                         { id, name: value }),
  });
  fetchData();
};
<td
  contentEditable
  suppressContentEditableWarning={true}
  onBlur={(e) => handleEdit('user', u.id, e.target.innerText)}
>{u.name}</td>

<td
  contentEditable
  suppressContentEditableWarning={true}
  onBlur={(e) => handleEdit('task', t.id, e.target.innerText)}
>{t.title}</td>

<td
  contentEditable
  suppressContentEditableWarning={true}
  onBlur={(e) => handleEdit('project', p.id, e.target.innerText)}
>{p.name}</td>
