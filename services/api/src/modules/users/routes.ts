import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";
import { uploadToCloudinary } from "../../common/lib/cloudinary.js";

export const usersRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

usersRouter.use(authMiddleware);

usersRouter.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      school: true,
      college: true,
      department: true,
      departmentLevel: true,
      notificationPrefs: true
    }
  });

  return res.json(user);
});

usersRouter.patch("/me", upload.single("profilePhoto"), async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const profilePhotoUrl = req.file ? (await uploadToCloudinary(req.file.buffer, "campus-lab/profile-photos", "image")).secure_url : undefined;

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      fullName: typeof req.body.fullName === "string" && req.body.fullName.trim() ? req.body.fullName.trim() : existing.fullName,
      phoneNumber: typeof req.body.phoneNumber === "string" && req.body.phoneNumber.trim() ? req.body.phoneNumber.trim() : existing.phoneNumber,
      emergencyContactName: typeof req.body.emergencyContactName === "string" && req.body.emergencyContactName.trim() ? req.body.emergencyContactName.trim() : existing.emergencyContactName,
      emergencyContactPhone: typeof req.body.emergencyContactPhone === "string" && req.body.emergencyContactPhone.trim() ? req.body.emergencyContactPhone.trim() : existing.emergencyContactPhone,
      profilePhotoUrl: profilePhotoUrl ?? (typeof req.body.profilePhotoUrl === "string" && req.body.profilePhotoUrl.trim() ? req.body.profilePhotoUrl.trim() : existing.profilePhotoUrl)
    },
    include: {
      school: true,
      college: true,
      department: true,
      departmentLevel: true,
      notificationPrefs: true
    }
  });

  return res.json(updated);
});

usersRouter.get("/sessions", async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user!.id, revokedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return res.json(sessions);
});

usersRouter.delete("/sessions/:id", async (req, res) => {
  await prisma.session.updateMany({
    where: { id: req.params.id, userId: req.user!.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  return res.status(204).send();
});

usersRouter.patch("/privacy/coursemate-locator", async (req, res) => {
  const enabled = Boolean(req.body.enabled);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { allowCoursemateLocator: enabled }
  });
  return res.status(204).send();
});

usersRouter.patch("/notifications/preferences", async (req, res) => {
  await prisma.notificationPreference.upsert({
    where: { userId: req.user!.id },
    update: req.body,
    create: { userId: req.user!.id, ...req.body }
  });
  return res.status(204).send();
});

usersRouter.patch("/health-goals", async (req, res) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      waterGoalCups: Number(req.body.waterGoalCups ?? 8),
      stepGoal: Number(req.body.stepGoal ?? 8000),
      bodyWeightKg: req.body.bodyWeightKg != null ? Number(req.body.bodyWeightKg) : undefined
    }
  });
  return res.status(204).send();
});
