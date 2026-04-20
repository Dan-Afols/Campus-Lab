import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../common/lib/prisma.js";
import { decryptField, encryptField } from "../../common/utils/crypto.js";
import { enqueueEmailOtp } from "../../common/lib/queue.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt.js";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../../common/utils/otp.js";
import { hashToken } from "../../common/utils/tokenHash.js";
import { sendSecurityAlertEmail } from "../../common/utils/emailer.js";
import { generate2faSecret, verify2faCode } from "../../common/utils/twofa.js";
import { env } from "../../common/config/env.js";

const privateUniversityCatalog = [
  "McPherson University",
  "Covenant University",
  "Babcock University",
  "Bowen University",
  "Afe Babalola University",
  "American University of Nigeria",
  "Lead City University",
  "Nile University of Nigeria",
  "Pan-Atlantic University",
  "Redeemer's University"
].map((school) => ({
  name: school,
  colleges: [
    {
      name: "College of Computing and Engineering",
      departments: [
        "Computer Science",
        "Software Engineering",
        "Information Technology",
        "Electrical and Electronics Engineering"
      ]
    },
    {
      name: "College of Management and Social Sciences",
      departments: ["Accounting", "Business Administration", "Economics", "Mass Communication"]
    },
    {
      name: "College of Natural and Applied Sciences",
      departments: ["Microbiology", "Biochemistry", "Physics with Electronics", "Mathematics"]
    }
  ]
}));

export async function registerUser(input: any) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const requireEmailOtp = env.EMAIL_OTP_REQUIRED;
  const isCourseRep = input.role === "COURSE_REP";
  const otp = requireEmailOtp ? generateOtpCode() : null;
  const otpHash = otp ? await hashOtpCode(otp) : null;

  let user;

  try {
    user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        passwordHash,
        matricNumberEncrypted: encryptField(input.matricNumber),
        phoneNumber: input.phoneNumber,
        dobEncrypted: encryptField(input.dateOfBirth),
        gender: input.gender,
        role: input.role,
        status: isCourseRep || requireEmailOtp ? "PENDING" : "ACTIVE",
        emailVerifiedAt: requireEmailOtp ? null : new Date(),
        schoolId: input.schoolId,
        collegeId: input.collegeId,
        departmentId: input.departmentId,
        departmentLevelId: input.departmentLevelId,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        profilePhotoUrl: input.profilePhotoUrl,
        ...(otpHash
          ? {
              otpCodes: {
                create: {
                  purpose: "EMAIL_VERIFY",
                  codeHash: otpHash,
                  expiresAt: new Date(Date.now() + 10 * 60 * 1000)
                }
              }
            }
          : {}),
        notificationPrefs: { create: {} }
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("email")
    ) {
      throw new Error("Email already exists. Sign in instead or reset your password.");
    }
    throw error;
  }

  if (otp) {
    await enqueueEmailOtp(user.email, otp, "Email Verification");
  }

  return {
    userId: user.id,
    email: user.email,
    requiresEmailVerification: requireEmailOtp
  };
}

export async function verifyEmailOtp(email: string, otpCode: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new Error("User not found");
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "EMAIL_VERIFY",
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp || otp.expiresAt < new Date()) {
    throw new Error("OTP expired or missing");
  }

  const isValid = await verifyOtpCode(otpCode, otp.codeHash);
  if (!isValid) {
    throw new Error("Invalid OTP");
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        status: user.role === "COURSE_REP" ? "PENDING" : "ACTIVE"
      }
    })
  ]);

  return { verified: true };
}

export async function loginUser(input: any, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new Error("Account locked");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= 5) {
      const unlockCode = generateOtpCode();
      await prisma.otpCode.create({
        data: {
          userId: user.id,
          purpose: "ACCOUNT_UNLOCK",
          codeHash: await hashOtpCode(unlockCode),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });
      await enqueueEmailOtp(user.email, unlockCode, "Account Unlock");
      if (env.EXPOSE_TEST_OTPS) {
        throw new Error(`ACCOUNT_LOCKED_WITH_OTP:${unlockCode}`);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockUntil: attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null
      }
    });
    throw new Error("Invalid credentials");
  }

  if (!user.emailVerifiedAt || user.status !== "ACTIVE") {
    throw new Error("Account is not active");
  }

  if (user.twoFactorEnabled) {
    if (!input.totpCode) {
      throw new Error("2FA code required");
    }
    if (!user.twoFactorSecretEncrypted) {
      throw new Error("2FA is not configured");
    }
    const secret = decryptField(user.twoFactorSecretEncrypted);
    if (!verify2faCode(secret, input.totpCode)) {
      throw new Error("Invalid 2FA code");
    }
  }

  const existingDeviceSession = await prisma.session.findFirst({
    where: { userId: user.id, deviceId: input.deviceId, revokedAt: null }
  });

  const sessionId = randomUUID();
  const payload = { sub: user.id, role: user.role, sid: sessionId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = hashToken(refreshToken);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockUntil: null } }),
    prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        deviceId: input.deviceId,
        os: input.os,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }),
    ...(input.pushToken && input.platform
      ? [
          prisma.deviceToken.upsert({
            where: { token: input.pushToken },
            update: { isActive: true, userId: user.id, platform: input.platform },
            create: { token: input.pushToken, platform: input.platform, userId: user.id }
          })
        ]
      : [])
  ]);

  if (!existingDeviceSession) {
    await sendSecurityAlertEmail(
      user.email,
      "New device login detected",
      `A new device login was detected on your Campus Lab account. Device: ${input.deviceId}, OS: ${input.os}, IP: ${ipAddress ?? "unknown"}.`
    );
  }

  return { accessToken, refreshToken, userId: user.id };
}

export async function refreshSession(token: string) {
  const payload = verifyRefreshToken(token);
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hashToken(token) } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new Error("Invalid refresh session");
  }

  const newSessionId = randomUUID();
  const newPayload = { sub: payload.sub, role: payload.role, sid: newSessionId };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);
  const refreshTokenHash = hashToken(refreshToken);

  await prisma.$transaction([
    prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
    prisma.session.create({
      data: {
        id: newSessionId,
        userId: payload.sub,
        refreshTokenHash,
        deviceId: session.deviceId,
        os: session.os,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
  ]);

  return { accessToken, refreshToken };
}

export async function getRegistrationCatalog() {
  const existingSchools = await prisma.school.count();

  if (existingSchools === 0) {
    await prisma.$transaction(async (tx) => {
      for (const schoolItem of privateUniversityCatalog) {
        const school = await tx.school.create({ data: { name: schoolItem.name } });

        for (const collegeItem of schoolItem.colleges) {
          const college = await tx.college.create({
            data: {
              schoolId: school.id,
              name: collegeItem.name
            }
          });

          for (const departmentName of collegeItem.departments) {
            const department = await tx.department.create({
              data: {
                collegeId: college.id,
                name: departmentName
              }
            });

            for (const level of [100, 200, 300, 400, 500]) {
              await tx.departmentLevel.create({
                data: {
                  departmentId: department.id,
                  level
                }
              });
            }
          }
        }
      }
    });
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      colleges: {
        orderBy: { name: "asc" },
        include: {
          departments: {
            orderBy: { name: "asc" },
            include: {
              levels: {
                orderBy: { level: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return { schools };
}

export async function logoutSession(userId: string, sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return;
  }

  const otp = generateOtpCode();
  const hash = await hashOtpCode(otp);
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      purpose: "PASSWORD_RESET",
      codeHash: hash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  await enqueueEmailOtp(user.email, otp, "Password Reset");
  return env.EXPOSE_TEST_OTPS ? { otp } : undefined;
}

export async function resetPassword(input: any) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new Error("User not found");
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "PASSWORD_RESET",
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp || otp.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  const isValid = await verifyOtpCode(input.otpCode, otp.codeHash);
  if (!isValid) {
    throw new Error("Invalid OTP");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(input.newPassword, 12) }
    }),
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
  ]);
}

export async function unlockAccount(input: { email: string; otpCode: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new Error("User not found");
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "ACCOUNT_UNLOCK",
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp || otp.expiresAt < new Date()) {
    throw new Error("Unlock OTP expired");
  }

  const valid = await verifyOtpCode(input.otpCode, otp.codeHash);
  if (!valid) {
    throw new Error("Invalid unlock OTP");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockUntil: null, status: "ACTIVE" }
    }),
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
  ]);
}

export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) {
    throw new Error("User not found");
  }

  const { secret, otpauthUrl } = generate2faSecret(user.email);
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecretEncrypted: encryptField(secret), twoFactorEnabled: false }
  });
  return { otpauthUrl };
}

export async function verifyTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecretEncrypted) {
    throw new Error("2FA secret missing");
  }

  const secret = decryptField(user.twoFactorSecretEncrypted);
  const valid = verify2faCode(secret, code);
  if (!valid) {
    throw new Error("Invalid 2FA code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true }
  });

  return { enabled: true };
}

export async function disableTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecretEncrypted || !user.twoFactorEnabled) {
    throw new Error("2FA not enabled");
  }

  const secret = decryptField(user.twoFactorSecretEncrypted);
  const valid = verify2faCode(secret, code);
  if (!valid) {
    throw new Error("Invalid 2FA code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null }
  });
}
