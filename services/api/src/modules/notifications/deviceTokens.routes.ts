import { Router } from "express";
import { prisma } from "../../common/lib/prisma.js";
import { validateBody } from "../../common/middleware/validate.js";
import { z } from "zod";

const registerSchema = z.object({
  token: z.string().min(20),
  platform: z.enum(["android", "ios", "web"])
});

export const deviceTokensRouter = Router();

deviceTokensRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  await prisma.deviceToken.upsert({
    where: { token: req.body.token },
    update: { isActive: true, userId: req.user!.id, platform: req.body.platform },
    create: { token: req.body.token, platform: req.body.platform, userId: req.user!.id }
  });

  return res.status(204).send();
});

deviceTokensRouter.post("/revoke", validateBody(z.object({ token: z.string().min(20) })), async (req, res) => {
  await prisma.deviceToken.updateMany({
    where: { token: req.body.token, userId: req.user!.id },
    data: { isActive: false }
  });
  return res.status(204).send();
});
