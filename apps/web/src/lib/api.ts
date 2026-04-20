import axios from "axios";

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

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "/api/v1");

function currentOriginApiBase() {
  const basePath = API_BASE_URL.startsWith("http") ? new URL(API_BASE_URL).pathname : API_BASE_URL;
  return `${window.location.origin}${basePath.replace(/\/$/, "")}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

const isNgrokBase = /ngrok-free\.(app|dev)/i.test(API_BASE_URL);

export function getDeviceId(): string {
  const existing = localStorage.getItem("campuslab_device_id");
  if (existing) {
    return existing;
  }
  const value = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem("campuslab_device_id", value);
  return value;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campuslab_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isNgrokBase) {
    config.headers["ngrok-skip-browser-warning"] = "true";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;

    if (
      !error?.response &&
      isNgrokBase &&
      !original?._retriedWithLocalhost &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      original._retriedWithLocalhost = true;
      original.baseURL = "http://localhost:4000/api/v1";
      return api.request(original);
    }

    if (error?.response?.status === 401) {
      localStorage.removeItem("campuslab_access_token");
      localStorage.removeItem("campuslab_refresh_token");
      localStorage.removeItem("campuslab_user_name");
    }
    return Promise.reject(error);
  }
);

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

export type RegistrationCatalog = {
  schools: Array<{
    id: string;
    name: string;
    colleges: Array<{
      id: string;
      name: string;
      departments: Array<{
        id: string;
        name: string;
        levels: Array<{
          id: string;
          level: number;
        }>;
      }>;
    }>;
  }>;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  matricNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  schoolId: string;
  collegeId: string;
  departmentId: string;
  departmentLevelId: string;
  role?: "STUDENT" | "COURSE_REP";
  emergencyContactName: string;
  emergencyContactPhone: string;
  profilePhotoUrl?: string;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  requiresEmailVerification?: boolean;
};

export async function login(email: string, password: string) {
  const payload = {
    email,
    password,
    deviceId: getDeviceId(),
    os: window.navigator.platform || "web",
    platform: "web" as const
  };
  const { data } = await api.post<LoginResponse>("/auth/login", payload, { baseURL: currentOriginApiBase() });
  return data;
}

export async function fetchRegistrationCatalog() {
  const { data } = await api.get<RegistrationCatalog>("/auth/catalog", { baseURL: currentOriginApiBase() });
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/auth/register", payload, { baseURL: currentOriginApiBase() });
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
    refreshToken
  }, { baseURL: currentOriginApiBase() });
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post<{ otp?: string }>("/auth/forgot-password", { email }, { baseURL: currentOriginApiBase() });
  return data;
}

export async function resetPassword(payload: { email: string; otpCode: string; newPassword: string }) {
  await api.post("/auth/reset-password", payload, { baseURL: currentOriginApiBase() });
}

export async function getCurrentUser() {
  const { data } = await api.get<any>("/users/me", { baseURL: currentOriginApiBase() });
  return data;
}

export async function updateCurrentUser(payload: FormData) {
  const { data } = await api.patch("/users/me", payload, { baseURL: currentOriginApiBase() });
  return data;
}

export async function updateNotificationPreferences(payload: {
  material: boolean;
  pastQuestion: boolean;
  timetable: boolean;
  news: boolean;
  hostel: boolean;
  health: boolean;
  classReminder: boolean;
}) {
  await api.patch("/users/notifications/preferences", payload, { baseURL: currentOriginApiBase() });
}

export async function updateCoursemateLocator(enabled: boolean) {
  await api.patch("/users/privacy/coursemate-locator", { enabled }, { baseURL: currentOriginApiBase() });
}

export async function getHostels() {
  const { data } = await api.get<any[]>("/hostel/hostels", { baseURL: currentOriginApiBase() });
  return data;
}

export async function getHostelLayout(hostelId: string) {
  const { data } = await api.get<any>(`/hostel/hostels/${hostelId}/layout`, { baseURL: currentOriginApiBase() });
  return data;
}

export async function holdHostelBed(bedId: string) {
  const { data } = await api.post(`/hostel/beds/${bedId}/hold`, undefined, { baseURL: currentOriginApiBase() });
  return data;
}

export async function bookHostelBed(bedId: string, moveInDate: string) {
  const { data } = await api.post(`/hostel/beds/${bedId}/book`, { moveInDate }, { baseURL: currentOriginApiBase() });
  return data;
}
