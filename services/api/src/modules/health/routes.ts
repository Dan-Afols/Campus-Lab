import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";

export const healthRouter = Router();

healthRouter.use(authMiddleware);

healthRouter.post("/hydration", async (req, res) => {
  const created = await prisma.hydrationLog.create({
    data: {
      userId: req.user!.id,
      cups: Number(req.body.cups),
      loggedAt: new Date(req.body.loggedAt ?? Date.now())
    }
  });
  return res.status(201).json(created);
});

healthRouter.post("/sleep", async (req, res) => {
  const created = await prisma.sleepLog.create({
    data: {
      userId: req.user!.id,
      sleptAt: new Date(req.body.sleptAt),
      wokeAt: new Date(req.body.wokeAt),
      qualityRating: Number(req.body.qualityRating ?? 3)
    }
  });
  return res.status(201).json(created);
});

healthRouter.post("/steps", async (req, res) => {
  const steps = Number(req.body.steps);
  const weight = Number(req.body.weightKg ?? 70);
  const distanceKm = steps * 0.0008;
  const calories = steps * 0.04 * (weight / 70);

  const created = await prisma.stepLog.create({
    data: {
      userId: req.user!.id,
      steps,
      distanceKm,
      calories,
      loggedAt: new Date(req.body.loggedAt ?? Date.now())
    }
  });

  return res.status(201).json(created);
});

healthRouter.get("/summary", async (req, res) => {
  const [hydration, steps, sleep] = await Promise.all([
    prisma.hydrationLog.findMany({ where: { userId: req.user!.id }, orderBy: { loggedAt: "desc" }, take: 7 }),
    prisma.stepLog.findMany({ where: { userId: req.user!.id }, orderBy: { loggedAt: "desc" }, take: 7 }),
    prisma.sleepLog.findMany({ where: { userId: req.user!.id }, orderBy: { sleptAt: "desc" }, take: 7 })
  ]);

  return res.json({ hydration, steps, sleep });
});
