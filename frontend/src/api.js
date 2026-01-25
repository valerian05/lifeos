// src/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Env variable from Vercel

// Root status
export async function fetchStatus() {
  const res = await fetch(`${API_BASE_URL}/`);
  if (!res.ok) throw new Error("Failed to fetch /");
  return res.json();
}

// Health check
export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Failed to fetch /health");
  return res.json();
}

// Placeholder: add more routes here
export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/users`); // Replace /users with your real endpoint
  if (!res.ok) throw new Error("Failed to fetch /users");
  return res.json();
}
