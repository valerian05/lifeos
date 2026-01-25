import { useState } from "react";

export default function CommandExecutor() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);

  // Make sure NEXT_PUBLIC_API_URL is set in Vercel env
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const sendCommand = async () => {
    if (!command) return;

    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to reach backend" });
    }
  };

  return (
    <div style={{ margin: "20px" }}>
      <h2>LIFE OS Command Executor</h2>
      <input
        type="text"
        placeholder="Type your command..."
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        style={{ width: "300px", marginRight: "10px" }}
      />
      <button onClick={sendCommand}>Send</button>

      {result && (
        <pre style={{ marginTop: "20px", background: "#f0f0f0", padding: "10px" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
