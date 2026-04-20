import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { UserRole } from "@prisma/client";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const token = auth.slice(7);
    const payload = verifyAccessToken(token);

    if (env.ADMIN_OFFLINE_LOGIN && payload.sub === "offline-admin" && payload.role === UserRole.ADMIN) {
      req.user = {
        id: "offline-admin",
        role: UserRole.ADMIN,
        sessionId: payload.sid,
        schoolId: "offline-school",
        collegeId: "offline-college",
        departmentId: "offline-department",
        departmentLevelId: "offline-level",
        gender: "MALE",
      };
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        schoolId: true,
        collegeId: true,
        departmentId: true,
        departmentLevelId: true,
        gender: true,
        status: true
      }
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    req.user = {
      ...user,
      sessionId: payload.sid
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
