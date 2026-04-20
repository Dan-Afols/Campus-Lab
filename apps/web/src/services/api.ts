import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

function resolveApiBaseUrl(rawBase: string) {
  if (!rawBase.startsWith("http")) {
    return rawBase;
  }

  try {
    const url = new URL(rawBase);
    const isLoopbackTarget = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const currentHost = window.location.hostname;
    const isCurrentLoopback = currentHost === "localhost" || currentHost === "127.0.0.1";

    if (isLoopbackTarget && !isCurrentLoopback) {
      url.hostname = currentHost;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return rawBase;
  }
}

const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "/api/v1");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushPendingQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401 || (originalRequest as any)._retry) {
      return Promise.reject(error);
    }

    (originalRequest as any)._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          if (originalRequest.headers) {
            (originalRequest.headers as any).Authorization = `Bearer ${token}`;
          }
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const storedRefreshToken = localStorage.getItem("campuslab_refresh_token");
      if (!storedRefreshToken) {
        throw new Error("Missing refresh token");
      }

      const refreshResponse = await axios.post(
        `${apiBaseUrl}/auth/refresh`,
        { refreshToken: storedRefreshToken },
        { withCredentials: true }
      );
      const token = refreshResponse.data?.accessToken as string;
      const nextRefresh = refreshResponse.data?.refreshToken as string;
      useAuthStore.getState().setAccessToken(token);
      localStorage.setItem("campuslab_access_token", token);
      localStorage.setItem("campuslab_refresh_token", nextRefresh);
      flushPendingQueue(token);
      if (originalRequest.headers) {
        (originalRequest.headers as any).Authorization = `Bearer ${token}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clear();
      localStorage.removeItem("campuslab_access_token");
      localStorage.removeItem("campuslab_refresh_token");
      flushPendingQueue(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
