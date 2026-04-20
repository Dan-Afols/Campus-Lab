import { Router } from "express";
import { authRateLimiter } from "../../common/middleware/rateLimit.js";
import { validateBody } from "../../common/middleware/validate.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { loginSchema, otpVerifySchema, registerSchema, requestResetSchema, resetPasswordSchema, twoFaVerifySchema, unlockAccountSchema } from "./schemas.js";
import {
  disableTwoFactor,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
  setupTwoFactor,
  unlockAccount,
  verifyEmailOtp,
  verifyTwoFactor
} from "./service.js";
import { getRegistrationCatalog } from "./service.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validateBody(registerSchema), async (req, res) => {
  try {
    const data = await registerUser(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.get("/catalog", async (_req, res) => {
  try {
    const catalog = await getRegistrationCatalog();
    return res.json(catalog);
  } catch (error) {
    console.error("Registration catalog error:", error);
    return res.status(500).json({ message: "Failed to load registration catalog" });
  }
});

authRouter.post("/verify-email", authRateLimiter, validateBody(otpVerifySchema), async (req, res) => {
  try {
    const data = await verifyEmailOtp(req.body.email, req.body.otpCode);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.post("/login", authRateLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const data = await loginUser(req.body, req.ip, req.get("user-agent"));
    return res.json(data);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.body.refreshToken as string;
  if (!token) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    const data = await refreshSession(token);
    return res.json(data);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }
});

authRouter.post("/logout", authMiddleware, async (req, res) => {
  await logoutSession(req.user!.id, req.user!.sessionId);
  return res.status(204).send();
});

authRouter.post("/forgot-password", validateBody(requestResetSchema), async (req, res) => {
  const debug = await requestPasswordReset(req.body.email);
  if (debug) {
    return res.json(debug);
  }
  return res.status(204).send();
});

authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
  try {
    await resetPassword(req.body);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.post("/unlock-account", validateBody(unlockAccountSchema), async (req, res) => {
  try {
    await unlockAccount(req.body);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.post("/2fa/setup", authMiddleware, async (req, res) => {
  try {
    const data = await setupTwoFactor(req.user!.id);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.post("/2fa/verify", authMiddleware, validateBody(twoFaVerifySchema), async (req, res) => {
  try {
    const data = await verifyTwoFactor(req.user!.id, req.body.code);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

authRouter.post("/2fa/disable", authMiddleware, validateBody(twoFaVerifySchema), async (req, res) => {
  try {
    await disableTwoFactor(req.user!.id, req.body.code);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});
