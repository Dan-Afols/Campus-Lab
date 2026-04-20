import { Router } from "express";
import { NewsCategory, UserRole } from "@prisma/client";
import { authMiddleware } from "../../common/middleware/auth.js";
import { enforceAcademicScope } from "../../common/middleware/hierarchy.js";
import { requireRole } from "../../common/middleware/roles.js";
import { prisma } from "../../common/lib/prisma.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { sendPushToTokens } from "../notifications/fcm.service.js";

export const newsRouter = Router();

newsRouter.use(authMiddleware);

newsRouter.post("/", requireRole(UserRole.ADMIN), async (req, res) => {
  const body = req.body as {
    title: string;
    body: string;
    category: NewsCategory;
    imageUrl?: string;
    isPinned?: boolean;
    isUrgent?: boolean;
    isGlobal?: boolean;
    targets?: Array<{ collegeId?: string; departmentId?: string; departmentLevelId?: string }>;
  };

  const created = await prisma.newsPost.create({
    data: {
      title: body.title,
      body: body.body,
      category: body.category,
      imageUrl: body.imageUrl,
      isPinned: body.isPinned ?? false,
      isUrgent: body.isUrgent ?? false,
      isGlobal: body.isGlobal ?? false,
      schoolId: req.user!.schoolId,
      createdById: req.user!.id,
      targets: body.targets?.length ? { create: body.targets } : undefined
    }
  });

  const targetOr = body.targets?.flatMap((t) => {
    const clauses: Array<Record<string, string>> = [];
    if (t.collegeId) {
      clauses.push({ collegeId: t.collegeId });
    }
    if (t.departmentId) {
      clauses.push({ departmentId: t.departmentId });
    }
    if (t.departmentLevelId) {
      clauses.push({ departmentLevelId: t.departmentLevelId });
    }
    return clauses;
  }) ?? [];

  const targetUsers = await prisma.user.findMany({
    where: {
      schoolId: req.user!.schoolId,
      ...(body.isGlobal ? {} : { OR: targetOr.length > 0 ? targetOr : [{ id: "__none__" }] })
    },
    include: { deviceTokens: { where: { isActive: true } } }
  });

  const tokens = targetUsers.flatMap((u) => u.deviceTokens.map((t) => t.token));
  await sendPushToTokens(tokens, body.title, body.body, {
    category: body.category,
    urgent: String(body.isUrgent ?? false),
    newsPostId: created.id
  }, Boolean(body.isUrgent));

  emitRealtimeEvent({ channel: "news", action: "created", entityId: created.id });

  return res.status(201).json(created);
});

newsRouter.get("/", enforceAcademicScope, async (req, res) => {
  const posts = await prisma.newsPost.findMany({
    where: {
      schoolId: req.user!.schoolId,
      OR: [
        { isGlobal: true },
        {
          targets: {
            some: {
              OR: [
                { collegeId: req.user!.collegeId },
                { departmentId: req.user!.departmentId },
                { departmentLevelId: req.user!.departmentLevelId }
              ]
            }
          }
        }
      ]
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50
  });
  return res.json(posts);
});

newsRouter.post("/:id/bookmark", async (req, res) => {
  await prisma.bookmarkedNews.upsert({
    where: { newsPostId_userId: { newsPostId: req.params.id, userId: req.user!.id } },
    update: {},
    create: { newsPostId: req.params.id, userId: req.user!.id }
  });
  return res.status(204).send();
});
