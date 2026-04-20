export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  matricNumber?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  department?: { id: string; name: string } | string;
  departmentLevel?: { id: string; level: number };
  role: "STUDENT" | "COURSE_REP";
};
