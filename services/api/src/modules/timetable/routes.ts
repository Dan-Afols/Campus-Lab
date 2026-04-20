import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { prisma } from "../../common/lib/prisma.js";

export const timetableRouter = Router();

timetableRouter.use(authMiddleware);

timetableRouter.get("/mine", async (req, res) => {
  const entries = await prisma.timetable.findMany({
    where: {
      collegeId: req.user!.collegeId,
      departmentId: req.user!.departmentId,
      departmentLevelId: req.user!.departmentLevelId
    },
    include: { course: true },
    orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }]
  });

  return res.json(entries);
});

timetableRouter.post("/", requireRole(UserRole.ADMIN), async (req, res) => {
  const created = await prisma.timetable.create({ data: req.body });
  return res.status(201).json(created);
});

timetableRouter.patch("/:id", requireRole(UserRole.ADMIN), async (req, res) => {
  const updated = await prisma.timetable.update({ where: { id: String(req.params.id) }, data: req.body });
  return res.json(updated);
});
