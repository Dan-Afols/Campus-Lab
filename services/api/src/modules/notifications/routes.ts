import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";
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
