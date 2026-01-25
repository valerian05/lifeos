import CommandExecutor from "./CommandExecutor";

export default function Dashboard() {
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>LifeOS Dashboard</h1>
      <CommandExecutor />
    </div>
  );
}
