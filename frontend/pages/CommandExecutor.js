import { useState } from "react";

export default function CommandExecutor() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const sendCommand = async () => {
    if (!command) return;

    setResult("Processing...");

    try {
      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResult("Backend not reachable yet");
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Command Executor</h2>
      <input
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell LifeOS what to do"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />
      <button style={{ marginTop: 10, padding: 10 }} onClick={sendCommand}>
        Send
      </button>
      <pre style={{ marginTop: 20 }}>{result}</pre>
    </div>
  );
}
