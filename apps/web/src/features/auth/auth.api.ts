import { apiFetch } from "../../lib/api";
import type { AuthResponse, MeResponse } from "./types";

export function register(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
}) {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuth: true,
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuth: true,
  });
}

export function refresh() {
  return apiFetch<{ accessToken: string }>("/api/v1/auth/refresh", {
    method: "POST",
    skipAuth: true,
  });
}

export function logout() {
  return apiFetch<{ ok: boolean }>("/api/v1/auth/logout", {
    method: "POST",
    skipAuth: true,
  });
}

export function me() {
  return apiFetch<MeResponse>("/api/v1/auth/me");
}