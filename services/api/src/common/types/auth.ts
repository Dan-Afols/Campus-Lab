import { UserRole } from "@prisma/client";

export type JwtPayload = {
  sub: string;
  role: UserRole;
  sid: string;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  sessionId: string;
  schoolId: string;
  collegeId: string;
  departmentId: string;
  departmentLevelId: string;
  gender: "MALE" | "FEMALE";
};
