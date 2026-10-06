import axios from "axios";

/**
 * Axios instance for the Spring Cloud Gateway.
 * The prototype runs on static data, so nothing calls this yet; it is wired
 * so that services can be swapped from mock data to REST without touching UI.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  // Keycloak access token would be attached here once OIDC is integrated.
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("hrd.accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("hrd.accessToken");
    }
    return Promise.reject(error);
  }
);

/** Endpoint map mirroring the planned microservices. */
export const endpoints = {
  students: "/students",
  attendance: "/attendance",
  scores: "/scores",
  extraClasses: "/extra-classes",
  allowances: "/allowances",
  feedback: "/feedback",
  alumni: "/alumni",
  files: "/files",
  notifications: "/notifications",
  chat: "/ai/chat",
  agents: "/ai/agents",
} as const;
