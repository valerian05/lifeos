import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");

  async function sendCommand() {
    setResponse("Processing...");
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/",
        { method: "GET" }
      );
      const data = await res.json();
      setResponse(JSON.stringify(data));
    } catch (err) {
      setResponse("Backend not reachable yet");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>LifeOS</h1>
      <p>Your AI execution system</p>

      <input
        style={{ width: "100%", padding: 10 }}
        placeholder="Tell LifeOS what to do"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        style={{ marginTop: 10, padding: 10 }}
        onClick={sendCommand}
      >
        Send
      </button>

      <pre style={{ marginTop: 20 }}>{response}</pre>
    </div>
  );
}
