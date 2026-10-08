// Em produção o Express serve o frontend e a API na mesma origem, então "/api" basta.
// Em desenvolvimento o Vite encaminha "/api" para localhost:8080 (ver vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const USANDO_DADOS_DEMONSTRATIVOS =
  import.meta.env.VITE_USE_MOCK === "true";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(endpoint, { params, ...options } = {}) {
  const query = params ? montarQuery(params) : "";
  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}${query}`, {
      ...options,
      headers: { Accept: "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0
    );
  }

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    const mensagem =
      corpo?.erro ||
      corpo?.error ||
      (response.status === 404
        ? "A informação solicitada não foi encontrada."
        : "O servidor não conseguiu responder agora. Tente novamente em instantes.");
    throw new ApiError(mensagem, response.status);
  }

  return response.json();
}

function montarQuery(params) {
  const search = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      search.append(chave, valor);
    }
  }
  const texto = search.toString();
  return texto ? `?${texto}` : "";
}
