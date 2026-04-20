import { Router } from "express";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { prisma } from "../../common/lib/prisma.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { generateJwt as generateAuthJwt, TokenType, validateJwt as validateAuthJwt } from "../../common/lib/auth.js";
import { generate2faSecret, verify2faCode } from "../../common/utils/twofa.js";
import { env } from "../../common/config/env.js";
import { decryptField, encryptField } from "../../common/utils/crypto.js";
import { signAccessToken } from "../../common/utils/jwt.js";
import { UserRole } from "@prisma/client";

export const adminAuthRouter = Router();

/**
 * POST /admin/auth/login
 * Admin login with email + password
 * Returns sessionToken if 2FA is required
 */
adminAuthRouter.post("/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const body = schema.parse(req.body);

    if (env.ADMIN_OFFLINE_LOGIN) {
      const emailMatch = body.email.toLowerCase() === env.ADMIN_OFFLINE_EMAIL.toLowerCase();
      const passwordMatch = body.password === env.ADMIN_OFFLINE_PASSWORD;

      if (emailMatch && passwordMatch) {
        const existingShowcaseAdmin = await prisma.user.findUnique({
          where: { email: env.ADMIN_OFFLINE_EMAIL },
          select: { id: true, email: true, fullName: true, role: true, status: true },
        });

        if (existingShowcaseAdmin && existingShowcaseAdmin.role === UserRole.ADMIN && existingShowcaseAdmin.status === "ACTIVE") {
          const token = signAccessToken({
            sub: existingShowcaseAdmin.id,
            role: UserRole.ADMIN,
            sid: randomUUID(),
          });

          return res.json({
            message: "Authentication successful (offline mode)",
            requiresOtp: false,
            token,
            admin: {
              id: existingShowcaseAdmin.id,
              email: existingShowcaseAdmin.email,
              name: existingShowcaseAdmin.fullName,
              role: UserRole.ADMIN,
            },
          });
        }

        const token = signAccessToken({
          sub: "offline-admin",
          role: UserRole.ADMIN,
          sid: randomUUID(),
        });

        return res.json({
          message: "Authentication successful (offline mode)",
          requiresOtp: false,
          token,
          admin: {
            id: "offline-admin",
            email: env.ADMIN_OFFLINE_EMAIL,
            name: "Offline Showcase Admin",
            role: UserRole.ADMIN,
          },
        });
      }
    }

    const admin = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.status === "LOCKED") {
      return res.status(403).json({
        message: "Admin account is locked. Contact security team.",
      });
    }

    const passwordMatch = await bcrypt.compare(body.password, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isTwoFactorConfigured = Boolean(admin.twoFactorEnabled && admin.twoFactorSecretEncrypted);

    if (env.ADMIN_SHOWCASE_LOGIN || !isTwoFactorConfigured) {
      const token = signAccessToken({
        sub: admin.id,
        role: admin.role,
        sid: randomUUID(),
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ADMIN_LOGIN_SUCCESS",
          resource: admin.id,
          ipAddress: req.ip || "unknown",
          metadata: { mode: env.ADMIN_SHOWCASE_LOGIN ? "showcase" : "password-only" },
        },
      });

      return res.json({
        message: "Authentication successful",
        requiresOtp: false,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.fullName,
          role: admin.role,
        },
      });
    }

    // Only require OTP when it is actually configured on the account.
    const requiresOtp = Boolean(admin.twoFactorEnabled && admin.twoFactorSecretEncrypted);
    if (!requiresOtp) {
      const token = signAccessToken({
        sub: admin.id,
        role: admin.role,
        sid: randomUUID(),
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ADMIN_LOGIN_SUCCESS",
          resource: admin.id,
          ipAddress: req.ip || "unknown",
          metadata: { mode: "password-only" },
        },
      });

      return res.json({
        message: "Authentication successful",
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.fullName,
          role: admin.role,
        },
        requiresOtp: false,
        token,
      });
    }

    const sessionToken = generateAuthJwt(
      { userId: admin.id, email: admin.email },
      TokenType.ADMIN_SESSION,
      "15m" // Session valid for 15 minutes to enter OTP
    );

    // Log login attempt
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "ADMIN_LOGIN_ATTEMPT",
        resource: admin.id,
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Password verified. Please enter OTP.",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.fullName,
        role: admin.role,
      },
      requiresOtp,
      sessionToken,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }

    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/auth/verify-otp
 * Verify TOTP code from admin's authenticator app
 * Returns JWT token on success
 */
adminAuthRouter.post("/verify-otp", async (req, res) => {
  try {
    const schema = z.object({
      sessionToken: z.string(),
      otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
    });

    const body = schema.parse(req.body);

    let sessionPayload: any;
    try {
      sessionPayload = await validateAuthJwt(body.sessionToken, TokenType.ADMIN_SESSION);
    } catch {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    const admin = await prisma.user.findUnique({
      where: { id: sessionPayload.userId },
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (!admin.twoFactorEnabled || !admin.twoFactorSecretEncrypted) {
      return res.status(400).json({ message: "Two-factor authentication is not configured for this admin account" });
    }

    const valid = verify2faCode(decryptField(admin.twoFactorSecretEncrypted), body.otp);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "ADMIN_OTP_FAILED",
          resource: admin.id,
          ipAddress: req.ip || "unknown",
        },
      });

      return res.status(401).json({ message: "Invalid OTP" });
    }

    const token = signAccessToken({
      sub: admin.id,
      role: admin.role,
      sid: randomUUID(),
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "ADMIN_LOGIN_SUCCESS",
        resource: admin.id,
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Authentication successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }

    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/auth/setup-2fa
 * Admin sets up 2FA (generates QR code)
 */
adminAuthRouter.post(
  "/setup-2fa",
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      // Fetch admin with email
      const admin = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const { secret, otpauthUrl } = generate2faSecret(admin.email);

      const qrCode = await QRCode.toDataURL(otpauthUrl);

      // Note: We don't persist tempTwoFactorSecret due to Express session limitations.
      // For production, use Redis to store temporary secrets with a 15-minute TTL.
      // For now, client must verify immediately after scanning QR code.

      return res.json({
        message: "Scan QR code with authenticator app",
        qrCode,
        backupCode: secret, // Secret is already base32 encoded by otplib
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /admin/auth/confirm-2fa
 * Admin confirms 2FA setup with OTP code
 */
adminAuthRouter.post(
  "/confirm-2fa",
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const schema = z.object({
        otp: z.string().regex(/^\d{6}$/),
      });

      const body = schema.parse(req.body);
      // Note: Temporary secret would come from Redis or similar persistent store
      // For now, this endpoint should be called immediately after setup-2fa
      // In production, use Redis to store temporary secrets with TTL
      const tempSecret = undefined; // TODO: Implement with Redis

      if (!tempSecret) {
        return res.status(400).json({
          message: "2FA setup not initiated. Call /setup-2fa first",
        });
      }

      // Verify OTP with temp secret (verify2faCode expects base32 secret)
      const valid = verify2faCode(tempSecret, body.otp);

      if (!valid) {
        return res.status(401).json({ message: "Invalid OTP code" });
      }

      // TODO: Save 2FA to database using proper 2FA table/model
      // Note: adminTwoFactor model needs to be added to Prisma schema
      // For now, this is a placeholder for the 2FA setup flow

      // Clear session
      // Temporary secret cleanup would happen in Redis
      // TODO: Delete from Redis

      // Log 2FA setup
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "ADMIN_2FA_ENABLED",
          resource: req.user!.id,
          ipAddress: req.ip || "unknown",
        },
      });

      return res.json({ message: "Two-factor authentication enabled successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      console.error("2FA confirm error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /admin/auth/logout
 * Admin logout
 */
adminAuthRouter.post(
  "/logout",
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "ADMIN_LOGOUT",
          resource: req.user!.id,
          ipAddress: req.ip || "unknown",
        },
      });

      return res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /admin/auth/sessions
 * Get all active admin sessions
 */
adminAuthRouter.get(
  "/sessions",
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const sessions = await prisma.auditLog.findMany({
        where: {
          actorUserId: req.user!.id,
          action: "ADMIN_LOGIN_SUCCESS",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return res.json(sessions);
    } catch (error) {
      console.error("Sessions fetch error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Placeholder function removed - use generateAuthJwt from auth.js library
