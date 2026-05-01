import { Router } from "express";
import multer from "multer";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { prisma } from "../../common/lib/prisma.js";
import { env } from "../../common/config/env.js";
import { uploadToCloudinary } from "../../common/lib/cloudinary.js";
import { enqueueMaterialSummary, enqueueScrapeFallback } from "../../common/lib/queue.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { ensureBufferIsClean } from "../../common/utils/virusScan.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "video/mp4",
      "audio/mpeg",
      "audio/wav"
    ];
    const allowedExt = [".pdf", ".doc", ".docx", ".mp4", ".mp3", ".wav"];
    const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
    cb(null, allowedMime.includes(file.mimetype) && allowedExt.includes(extension));
  }
});

export const materialsRouter = Router();

materialsRouter.use(authMiddleware);

materialsRouter.get("/mine", async (req, res) => {
  const materials = await prisma.material.findMany({
    where: {
      departmentId: req.user!.departmentId,
      departmentLevelId: req.user!.departmentLevelId,
      OR: [
        { approvedByAdmin: true },
        { uploadedById: req.user!.id }
      ]
    },
    include: { course: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json(materials);
});

materialsRouter.post(
  "/upload",
  requireRole(UserRole.COURSE_REP, UserRole.ADMIN),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const { title, description, type } = req.body;
    const rawCourseId = typeof req.body.courseId === "string" ? req.body.courseId.trim() : "";
    const rawCourseCode = typeof req.body.courseCode === "string" ? req.body.courseCode.trim().toUpperCase() : "";
    const fileType = String(type);
    const resourceType = fileType === "MP4" ? "video" : "raw";

    if (!title || !type || (!rawCourseId && !rawCourseCode)) {
      return res.status(400).json({ error: "title, type, and either courseId or courseCode are required" });
    }

    let course = await prisma.course.findFirst({
      where: {
        departmentId: req.user!.departmentId,
        OR: [
          { id: rawCourseId || undefined },
          { code: rawCourseCode || undefined },
        ],
      },
      select: { id: true },
    });

    if (!course) {
      // Fallback: allow lookup by course code within user's college or school to accommodate code-only uploads
      if (rawCourseCode) {
        const byCollege = await prisma.course.findFirst({
          where: {
            code: rawCourseCode,
            department: { collegeId: req.user!.collegeId }
          },
          select: { id: true }
        });
        if (byCollege) {
          course = byCollege as any;
        }
      }
    }

    if (!course && rawCourseCode) {
      const bySchool = await prisma.course.findFirst({
        where: {
          code: rawCourseCode,
          department: { college: { schoolId: req.user!.schoolId } }
        },
        select: { id: true }
      });
      if (bySchool) {
        course = bySchool as any;
      }
    }

    if (!course) {
      return res.status(404).json({ error: "course not found for your department or institution" });
    }

    await ensureBufferIsClean(req.file.buffer);

    const uploaded = await uploadToCloudinary(req.file.buffer, "campus-lab/materials", resourceType);

    const created = await prisma.material.create({
      data: {
        title,
        description,
        courseId: course.id,
        type,
        departmentId: req.user!.departmentId,
        departmentLevelId: req.user!.departmentLevelId,
        uploadedById: req.user!.id,
        fileUrl: uploaded.secure_url,
        approvedByAdmin: req.user!.role === "ADMIN"
      }
    });

    if (["PDF", "DOC", "DOCX"].includes(fileType)) {
      await enqueueMaterialSummary(created.id, req.file.buffer.toString("utf8"));
    }

    emitRealtimeEvent({
      channel: "materials",
      action: "created",
      entityId: created.id
    });

    return res.status(201).json(created);
  }
);

materialsRouter.post("/web-scrape-fallback", async (req, res) => {
  const { courseName, departmentName } = req.body as { courseName: string; departmentName: string };
  await enqueueScrapeFallback(courseName, departmentName ?? "", req.user!.departmentId, req.user!.departmentLevelId);
  return res.json({ queued: true, message: "Fallback scrape queued for worker processing" });
});

materialsRouter.post("/:id/bookmark", async (req, res) => {
  await prisma.bookmarkedMaterial.upsert({
    where: { materialId_userId: { materialId: req.params.id, userId: req.user!.id } },
    update: {},
    create: { materialId: req.params.id, userId: req.user!.id }
  });
  return res.status(204).send();
});

materialsRouter.post("/:id/rate", async (req, res) => {
  const rating = Number(req.body.rating);
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be 1-5" });
  }

  await prisma.materialRating.upsert({
    where: { materialId_userId: { materialId: req.params.id, userId: req.user!.id } },
    update: { rating },
    create: { materialId: req.params.id, userId: req.user!.id, rating }
  });
  return res.status(204).send();
});
