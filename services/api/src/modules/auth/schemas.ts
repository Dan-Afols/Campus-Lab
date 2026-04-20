import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
  matricNumber: z.string().min(3),
  phoneNumber: z.string().min(7),
  dateOfBirth: z.string().min(4),
  gender: z.enum(["MALE", "FEMALE"]),
  schoolId: z.string(),
  collegeId: z.string(),
  departmentId: z.string(),
  departmentLevelId: z.string(),
  role: z.enum(["STUDENT", "COURSE_REP"]).default("STUDENT"),
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(7),
  profilePhotoUrl: z.string().url().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string().min(3),
  os: z.string().min(2),
  pushToken: z.string().min(20).optional(),
  platform: z.enum(["android", "ios", "web"]).optional(),
  totpCode: z.string().length(6).optional()
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6)
});

export const requestResetSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6),
  newPassword: z.string().regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
});

export const unlockAccountSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().length(6)
});

export const twoFaVerifySchema = z.object({
  code: z.string().length(6)
});
