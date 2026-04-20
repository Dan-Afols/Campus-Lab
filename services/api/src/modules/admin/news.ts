import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/lib/prisma.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { Prisma, UserRole, NewsCategory } from "@prisma/client";

export const adminNewsRouter = Router();

adminNewsRouter.use(authMiddleware, requireRole(UserRole.ADMIN));

/**
 * POST /admin/news/posts
 * Create news post
 */
adminNewsRouter.post("/posts", async (req, res) => {
  try {
    const categorySchema = z.union([
      z.nativeEnum(NewsCategory),
      z.enum(["GENERAL", "MAINTENANCE", "EMERGENCY"]),
    ]);
    const schema = z.object({
      title: z.string().min(5),
      content: z.string().min(20),
      category: categorySchema,
      schoolId: z.string().min(1),
      targetAudience: z.array(z.string().min(1)).default([]),
      scheduledPublish: z.string().optional(),
      imageUrl: z.string().url().optional(),
    });

    const body = schema.parse(req.body);
    const categoryMap: Record<string, NewsCategory> = {
      GENERAL: NewsCategory.ADMINISTRATION,
      MAINTENANCE: NewsCategory.ADMINISTRATION,
      EMERGENCY: NewsCategory.URGENT_ALERTS,
      ACADEMIC: NewsCategory.ACADEMIC,
      EVENTS: NewsCategory.EVENTS,
      URGENT_ALERTS: NewsCategory.URGENT_ALERTS,
      SPORTS: NewsCategory.SPORTS,
      ADMINISTRATION: NewsCategory.ADMINISTRATION,
    };
    const resolvedCategory = categoryMap[String(body.category)] ?? NewsCategory.ADMINISTRATION;
    const parsedSchedule = body.scheduledPublish ? new Date(body.scheduledPublish) : null;
    const scheduledAt = parsedSchedule && !isNaN(parsedSchedule.getTime()) ? parsedSchedule : null;
    const targetSchool = await prisma.school.findUnique({
      where: { id: body.schoolId },
      select: { id: true, name: true }
    });

    if (!targetSchool) {
      return res.status(404).json({ message: "Selected university not found" });
    }

    const post = await prisma.$transaction([
      prisma.newsPost.create({
        data: {
          title: body.title,
          body: body.content,
          category: resolvedCategory,
          createdById: req.user!.id,
          schoolId: targetSchool.id,
          createdAt: scheduledAt ?? new Date(),
          imageUrl: body.imageUrl,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "NEWS_POST_CREATED",
          resource: body.title,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    // Create targets for audience
    if (body.targetAudience.length > 0) {
      await prisma.newsTarget.createMany({
        data: body.targetAudience.map((targetId) => ({
            newsPostId: post[0].id,
            collegeId: targetId,
        })),
      });
    }

    const audienceUsers = await prisma.user.findMany({
      where: { schoolId: targetSchool.id, status: "ACTIVE" },
      select: { id: true }
    });

    if (audienceUsers.length > 0) {
      await prisma.notification.createMany({
        data: audienceUsers.map((user) => ({
          userId: user.id,
          type: "NEWS",
          title: body.title,
          body: body.content.slice(0, 180),
          payload: { newsPostId: post[0].id, schoolId: targetSchool.id, schoolName: targetSchool.name }
        }))
      });
    }

    emitRealtimeEvent({ channel: "news", action: "created", entityId: post[0].id });
    return res.status(201).json(post[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create news post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/news/posts
 * List all news posts with pagination
 */
adminNewsRouter.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const category = req.query.category as NewsCategory | undefined;

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const [posts, total, schools] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, fullName: true, email: true },
          },
          targets: {
            select: { collegeId: true, departmentId: true, departmentLevelId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsPost.count({ where }),
      prisma.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    ]);

    return res.json({
      data: posts,
      schools,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch news posts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/news/posts/:id
 * Get single news post details
 */
adminNewsRouter.get("/posts/:id", async (req, res) => {
  try {
    const post = await prisma.newsPost.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
            select: { id: true, fullName: true, email: true },
        },
        targets: {
          include: {
              college: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
              departmentLevel: { select: { id: true, level: true } },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);
  } catch (error) {
    console.error("Fetch news post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/news/posts/:id
 * Update news post
 */
adminNewsRouter.patch("/posts/:id", async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(5).optional(),
      content: z.string().min(20).optional(),
      category: z.nativeEnum(NewsCategory).optional(),
      imageUrl: z.string().url().optional(),
    });

    const body = schema.parse(req.body);

    const post = await prisma.$transaction([
      prisma.newsPost.update({
        where: { id: req.params.id },
        data: {
          title: body.title,
          body: body.content,
          category: body.category,
          imageUrl: body.imageUrl,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "NEWS_POST_UPDATED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    emitRealtimeEvent({ channel: "news", action: "updated", entityId: post[0].id });
    return res.json(post[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error("Update news post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /admin/news/posts/:id
 * Delete news post
 */
adminNewsRouter.delete("/posts/:id", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.newsTarget.deleteMany({
        where: { newsPostId: req.params.id },
      }),
      prisma.newsPost.delete({
        where: { id: req.params.id },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "NEWS_POST_DELETED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    emitRealtimeEvent({ channel: "news", action: "deleted", entityId: req.params.id });
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error("Delete news post error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/news/posts/:id/send-notification
 * Send push notification for news post
 */
adminNewsRouter.post("/posts/:id/send-notification", async (req, res) => {
  try {
    const schema = z.object({
      message: z.string().min(10),
    });

    const body = schema.parse(req.body);

    const post = await prisma.newsPost.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // TODO: Queue notification sending job
    // await notificationQueue.add({
    //   postId: req.params.id,
    //   message: body.message,
    //   type: "NEWS"
    // });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "NEWS_NOTIFICATION_SENT",
        resource: req.params.id,
        metadata: { message: body.message },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Notification queued for delivery",
      postId: req.params.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Send notification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/news/notification-logs
 * Get notification delivery logs
 */
adminNewsRouter.get("/notification-logs", async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: "NEWS_NOTIFICATION_SENT",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json(logs);
  } catch (error) {
    console.error("Fetch notification logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
