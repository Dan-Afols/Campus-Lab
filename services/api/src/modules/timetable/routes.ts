import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { prisma } from "../../common/lib/prisma.js";
import { z } from "zod";

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

timetableRouter.post("/course-rep", requireRole(UserRole.COURSE_REP, UserRole.ADMIN), async (req, res) => {
  try {
    const schema = z.object({
      courseCode: z.string().min(2),
      venue: z.string().min(2),
      dayOfWeek: z.number().int().min(1).max(7).optional(),
      day: z.string().optional(),
      startsAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endsAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      lecturer: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const normalizedCourseCode = body.courseCode.trim().toUpperCase();
    const course = await prisma.course.findFirst({
      where: {
        departmentId: req.user!.departmentId,
        code: normalizedCourseCode,
      },
      select: { id: true, code: true, title: true },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found in your department" });
    }

    const dayMap: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    const resolvedDay = body.dayOfWeek ?? (body.day ? dayMap[String(body.day).toUpperCase()] : undefined) ?? 1;
    const resolvedStartsAt = body.startsAt ?? body.startTime ?? "09:00";
    const resolvedEndsAt = body.endsAt ?? body.endTime ?? "10:00";

    const created = await prisma.timetable.create({
      data: {
        courseId: course.id,
        collegeId: req.user!.collegeId,
        departmentId: req.user!.departmentId,
        departmentLevelId: req.user!.departmentLevelId,
        venue: body.venue,
        dayOfWeek: resolvedDay,
        startsAt: resolvedStartsAt,
        endsAt: resolvedEndsAt,
        lecturer: body.lecturer || "TBA",
      },
      include: {
        course: { select: { code: true, title: true } },
      },
    });

    const recipients = await prisma.user.findMany({
      where: {
        departmentId: req.user!.departmentId,
        departmentLevelId: req.user!.departmentLevelId,
        id: { not: req.user!.id },
      },
      select: { id: true },
    });

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type: "TIMETABLE",
          title: `Timetable update: ${course.code}`,
          body: `${course.title} now holds on day ${resolvedDay} at ${resolvedStartsAt}-${resolvedEndsAt} in ${body.venue}.`,
          payload: {
            timetableId: created.id,
            courseCode: course.code,
          },
        })),
      });
    }

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Course rep timetable upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
