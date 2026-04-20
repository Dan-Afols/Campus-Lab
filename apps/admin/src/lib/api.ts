import axios from "axios";

// Vite's import.meta.env typing workaround
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export async function apiRequest<T>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: any
): Promise<T> {
  const response = await apiClient[method]<T>(url, data);
  return response.data;
}
