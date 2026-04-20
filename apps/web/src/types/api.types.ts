export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "COURSE_REP" | "ADMIN";
  school?: { id: string; name: string } | string;
  college?: { id: string; name: string } | string;
  department?: { id: string; name: string } | string;
  departmentLevel?: { id: string; level: number };
  level?: string | number | { level?: number };
  matricNumber?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profilePhotoUrl?: string;
  waterGoalCups?: number;
  stepGoal?: number;
  bodyWeightKg?: number;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};
