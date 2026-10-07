const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Não foi possível concluir a requisição.");
  }

  return response.json();
}
