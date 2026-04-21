import { Router } from "express";
import { NotificationType, UserRole } from "@prisma/client";
import { z } from "zod";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";
import { requireRole } from "../../common/middleware/roles.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { deviceTokensRouter } from "./deviceTokens.routes.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);
notificationsRouter.use("/devices", deviceTokensRouter);

notificationsRouter.get("/", async (req, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return res.json(items);
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { readAt: new Date() }
  });
  return res.status(204).send();
});

notificationsRouter.post("/broadcast", requireRole(UserRole.COURSE_REP, UserRole.ADMIN), async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      body: z.string().min(3),
      type: z.nativeEnum(NotificationType).optional(),
    });

    const payload = schema.parse(req.body);
    const users = await prisma.user.findMany({
      where: {
        departmentId: req.user!.departmentId,
        departmentLevelId: req.user!.departmentLevelId,
        id: { not: req.user!.id },
      },
      select: { id: true },
    });

    if (users.length === 0) {
      return res.status(200).json({ delivered: 0, message: "No users found in your level" });
    }

    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: payload.type ?? NotificationType.NEWS,
        title: payload.title,
        body: payload.body,
        payload: {
          sentBy: req.user!.id,
          senderRole: req.user!.role,
        },
      })),
    });

    emitRealtimeEvent({
      channel: "notifications",
      action: "created",
    });

    return res.status(201).json({ delivered: users.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Broadcast notification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
