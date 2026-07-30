import type { AuthResponse, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5088/api";
const TOKEN_KEY = "miodesk_token";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = "İstek tamamlanamadı.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // JSON olmayan hata yanıtı.
    }
    if (response.status === 401) tokenStore.clear();
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (fullName: string, email: string, password: string, major: string) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password, major }) }),
  me: () => api<User>("/auth/me"),
};
