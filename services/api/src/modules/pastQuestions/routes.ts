import { Router } from "express";
import multer from "multer";
import axios from "axios";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { prisma } from "../../common/lib/prisma.js";
import { uploadToCloudinary } from "../../common/lib/cloudinary.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { env } from "../../common/config/env.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const pastQuestionsRouter = Router();

pastQuestionsRouter.use(authMiddleware);

pastQuestionsRouter.get("/mine", async (req, res) => {
  const items = await prisma.pastQuestion.findMany({
    where: { departmentId: req.user!.departmentId },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }]
  });
  return res.json(items);
});

pastQuestionsRouter.post(
  "/upload",
  requireRole(UserRole.COURSE_REP, UserRole.ADMIN),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer, "campus-lab/past-questions", "raw");
    const created = await prisma.pastQuestion.create({
      data: {
        departmentId: req.user!.departmentId,
        courseCode: req.body.courseCode,
        year: Number(req.body.year),
        fileUrl: uploaded.secure_url,
        uploadedById: req.user!.id
      }
    });

    emitRealtimeEvent({
      channel: "past-questions",
      action: "created",
      entityId: created.id
    });

    return res.status(201).json(created);
  }
);

pastQuestionsRouter.post("/practice", async (req, res) => {
  const prompt = `Generate ${Number(req.body.count ?? 5)} practice questions from past exam patterns for course ${req.body.courseCode}.`;
  const result = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/chat`, { prompt });
  return res.json({ generated: result.data.answer });
});
