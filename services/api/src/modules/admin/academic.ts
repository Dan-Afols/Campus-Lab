import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/lib/prisma.js";
import { emitRealtimeEvent } from "../../common/lib/realtime.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { UserRole } from "@prisma/client";

export const adminAcademicRouter = Router();

adminAcademicRouter.use(authMiddleware, requireRole(UserRole.ADMIN));

/**
 * GET /admin/academic/schools
 * List all schools
 */
adminAcademicRouter.get("/schools", async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: "asc" },
      include: {
        colleges: {
          orderBy: { name: "asc" },
          include: {
            departments: {
              orderBy: { name: "asc" },
              include: {
                levels: {
                  orderBy: { level: "asc" },
                },
              },
            },
          },
        },
      },
    });

    return res.json(schools);
  } catch (error) {
    console.error("Fetch schools error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/schools
 * Create new school
 */
adminAcademicRouter.post("/schools", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);

    const school = await prisma.$transaction([
      prisma.school.create({
        data: {
          name: body.name,
        } as any,
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "SCHOOL_CREATED",
          resource: body.name,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(201).json(school[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create school error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/academic/schools/:id
 * Rename an existing school
 */
adminAcademicRouter.patch("/schools/:id", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);
    const updated = await prisma.school.update({
      where: { id: req.params.id },
      data: { name: body.name.trim() },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "SCHOOL_UPDATED",
        resource: updated.name,
        metadata: { schoolId: updated.id },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update school error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /admin/academic/schools/:id
 * Delete a school and its dependent data (if DB cascades are configured)
 */
adminAcademicRouter.delete("/schools/:id", async (req, res) => {
  try {
    const schoolId = req.params.id;

    // Attempt to delete school; if FK constraints prevent full cascade,
    // let the error bubble so admin can inspect related records.
    const deleted = await prisma.school.delete({ where: { id: schoolId } });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "SCHOOL_DELETED",
        resource: deleted.name,
        metadata: { schoolId: deleted.id },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({ message: "School deleted", school: deleted });
  } catch (error) {
    console.error("Delete school error:", error);
    return res.status(500).json({ message: "Failed to delete school; check related records" });
  }
});

/**
 * POST /admin/academic/structure
 * Create a new school with nested colleges and departments
 */
adminAcademicRouter.post("/structure", async (req, res) => {
  try {
    const schema = z.object({
      schoolName: z.string().min(2),
      colleges: z.array(
        z.object({
          name: z.string().min(2),
          departments: z.array(z.string().min(2)).min(1),
        })
      ).min(1),
    });

    const body = schema.parse(req.body);

    const normalizedSchoolName = body.schoolName.trim();

    const created = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: normalizedSchoolName,
        },
      });

      for (const collegeInput of body.colleges) {
        const college = await tx.college.create({
          data: {
            schoolId: school.id,
            name: collegeInput.name.trim(),
          },
        });

        const uniqueDepartments = Array.from(
          new Set(
            collegeInput.departments
              .map((name) => name.trim())
              .filter((name) => name.length > 0)
          )
        );

        for (const departmentName of uniqueDepartments) {
          const department = await tx.department.create({
            data: {
              collegeId: college.id,
              name: departmentName,
            },
          });

          await tx.departmentLevel.createMany({
            data: [100, 200, 300, 400, 500].map((level) => ({
              departmentId: department.id,
              level,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "ACADEMIC_STRUCTURE_CREATED",
          resource: normalizedSchoolName,
          metadata: { colleges: body.colleges.length },
          ipAddress: req.ip || "unknown",
        },
      });

      return school;
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create academic structure error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/colleges
 * Create new college under school
 */
adminAcademicRouter.post("/colleges", async (req, res) => {
  try {
    const schema = z.object({
      schoolId: z.string().min(1),
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);

    const college = await prisma.$transaction([
      prisma.college.create({
        data: {
          schoolId: body.schoolId,
          name: body.name,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COLLEGE_CREATED",
          resource: body.name,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(201).json(college[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create college error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/academic/colleges/:id
 * Rename an existing college
 */
adminAcademicRouter.patch("/colleges/:id", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);
    const updated = await prisma.college.update({
      where: { id: req.params.id },
      data: { name: body.name.trim() },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "COLLEGE_UPDATED",
        resource: updated.name,
        metadata: { collegeId: updated.id },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update college error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/departments
 * Create new department under college
 */
adminAcademicRouter.post("/departments", async (req, res) => {
  try {
    const schema = z.object({
      collegeId: z.string().min(1),
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);

    const department = await prisma.$transaction(async (tx) => {
      const createdDepartment = await tx.department.create({
        data: {
          collegeId: body.collegeId,
          name: body.name,
        },
      });

      await tx.departmentLevel.createMany({
        data: [100, 200, 300, 400, 500].map((level) => ({
          departmentId: createdDepartment.id,
          level,
        })),
      });

      await tx.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "DEPARTMENT_CREATED",
          resource: body.name,
          ipAddress: req.ip || "unknown",
        },
      });

      return tx.department.findUnique({
        where: { id: createdDepartment.id },
        include: {
          levels: {
            orderBy: { level: "asc" },
          },
        },
      });
    });

    return res.status(201).json(department);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create department error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/academic/departments/:id
 * Rename an existing department
 */
adminAcademicRouter.patch("/departments/:id", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
    });

    const body = schema.parse(req.body);
    const updated = await prisma.department.update({
      where: { id: req.params.id },
      data: { name: body.name.trim() },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "DEPARTMENT_UPDATED",
        resource: updated.name,
        metadata: { departmentId: updated.id },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update department error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/academic/courses
 * List all courses with pagination
 */
adminAcademicRouter.get("/courses", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const schoolId = req.query.schoolId as string | undefined;
    const collegeId = req.query.collegeId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;

    const where: any = {
      department: {}
    };

    if (schoolId) {
      where.department.college = { schoolId };
    }

    if (collegeId) {
      where.department.collegeId = collegeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (Object.keys(where.department).length === 0) {
      delete where.department;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              college: {
                select: { id: true, name: true, school: { select: { id: true, name: true } } },
              },
              levels: {
                select: { id: true, level: true },
                orderBy: { level: "asc" },
              },
            },
          },
          materials: {
            select: { id: true },
          },
        },
        orderBy: [{ code: "asc" }],
      }),
      prisma.course.count({ where }),
    ]);

    const normalized = courses.map((course: any) => ({
      ...course,
      name: course.title,
      creditHours: 3,
      level: course.department?.levels?.[0]?.level ?? 100,
    }));

    return res.json({
      data: normalized,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch courses error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/courses
 * Create new course
 */
adminAcademicRouter.post("/courses", async (req, res) => {
  try {
    const schema = z.object({
      departmentId: z.string().min(1),
      code: z.string().min(2).max(20),
      name: z.string().min(2),
      creditHours: z.number().min(0).max(6).optional(),
      level: z.number().min(100).max(900).optional(),
    });

    const body = schema.parse(req.body);

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: body.departmentId }
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const course = await prisma.$transaction([
      prisma.course.create({
        data: {
          departmentId: body.departmentId,
          code: body.code,
          title: body.name,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COURSE_CREATED",
          resource: body.code,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    emitRealtimeEvent({ channel: "courses", action: "created", entityId: course[0].id });
    return res.status(201).json(course[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return res.status(409).json({ message: "A course with this code already exists in this department" });
    }
    console.error("Create course error:", error);
    return res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
});

/**
 * GET /admin/academic/materials
 * List materials pending approval
 */
adminAcademicRouter.get("/materials", async (req, res) => {
  try {
    const status = (req.query.status as "pending" | "approved" | "rejected") || "pending";

    const where: any = {};
    if (status === "pending") {
      where.approvedByAdmin = false;
    } else if (status === "approved") {
      where.approvedByAdmin = true;
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
        department: {
          select: { id: true, name: true }
        },
        uploadedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json(materials.map((m: any) => ({
      ...m,
      course: { ...m.course, name: m.course?.title },
      uploadedBy: { ...m.uploadedBy, name: m.uploadedBy?.fullName },
    })));
  } catch (error) {
    console.error("Fetch materials error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/materials/:id/approve
 * Approve course material
 */
adminAcademicRouter.post("/materials/:id/approve", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.material.update({
        where: { id: req.params.id },
        data: { approvedByAdmin: true },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "MATERIAL_APPROVED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    emitRealtimeEvent({ channel: "materials", action: "updated", entityId: req.params.id });
    return res.status(204).send();
  } catch (error) {
    console.error("Approve material error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/materials/:id/reject
 * Reject course material
 */
adminAcademicRouter.post("/materials/:id/reject", async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().min(10),
    });

    const body = schema.parse(req.body);

    await prisma.$transaction([
      prisma.material.delete({
        where: { id: req.params.id },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "MATERIAL_REJECTED",
          resource: req.params.id,
          metadata: { reason: body.reason },
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    emitRealtimeEvent({ channel: "materials", action: "deleted", entityId: req.params.id });
    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Reject material error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/academic/past-questions
 * List past questions
 */
adminAcademicRouter.get("/past-questions", async (req, res) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const courseCode = req.query.courseCode as string | undefined;

    const where: any = {};
    if (courseId) {
      const selectedCourse = await prisma.course.findUnique({ where: { id: courseId }, select: { code: true } });
      if (selectedCourse?.code) {
        where.courseCode = selectedCourse.code;
      }
    } else if (courseCode) {
      where.courseCode = courseCode;
    }

    const questions = await prisma.pastQuestion.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true },
        },
        uploadedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json(
      questions.map((q: any) => ({
        ...q,
        semester: "Rain",
        course: { code: q.courseCode },
        uploadedBy: { ...q.uploadedBy, name: q.uploadedBy?.fullName },
      }))
    );
  } catch (error) {
    console.error("Fetch past questions error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/academic/timetable
 * Create/update timetable entry
 */
adminAcademicRouter.post("/timetable", async (req, res) => {
  try {
    const schema = z.object({
      courseId: z.string().min(1),
      collegeId: z.string().min(1).optional(),
      departmentId: z.string().min(1).optional(),
      departmentLevelId: z.string().min(1).optional(),
      venue: z.string().min(2),
      dayOfWeek: z.number().min(1).max(7).optional(),
      day: z.string().optional(),
      startsAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endsAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      lecturer: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      include: {
        department: {
          include: {
            college: true,
            levels: { orderBy: { level: "asc" }, take: 1 },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
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
    const resolvedCollegeId = body.collegeId ?? course.department.collegeId;
    const resolvedDepartmentId = body.departmentId ?? course.departmentId;
    const resolvedLevelId = body.departmentLevelId ?? course.department.levels[0]?.id;

    if (!resolvedLevelId) {
      return res.status(400).json({ message: "Department level is required for timetable entry" });
    }

    const timetable = await prisma.$transaction([
      prisma.timetable.create({
        data: {
          courseId: body.courseId,
          collegeId: resolvedCollegeId,
          departmentId: resolvedDepartmentId,
          departmentLevelId: resolvedLevelId,
          venue: body.venue,
          dayOfWeek: resolvedDay,
          startsAt: resolvedStartsAt,
          endsAt: resolvedEndsAt,
          lecturer: body.lecturer || "TBA",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "TIMETABLE_CREATED",
          resource: body.courseId,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(201).json(timetable[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create timetable error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/academic/timetable
 * Get timetable for a course
 */
adminAcademicRouter.get("/timetable", async (req, res) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;

    const where: any = {};

    if (courseId) {
      where.courseId = courseId;
    } else if (departmentId) {
      where.course = {
        departmentId,
      };
    }

    const timetable = await prisma.timetable.findMany({
      where,
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
      },
        orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }],
    });

    return res.json(
      timetable.map((entry: any) => ({
        ...entry,
        day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][Math.max(0, Math.min(6, entry.dayOfWeek - 1))],
        startTime: entry.startsAt,
        endTime: entry.endsAt,
      }))
    );
  } catch (error) {
    console.error("Fetch timetable error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminAcademicRouter.delete("/timetable/:id", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.timetable.delete({ where: { id: req.params.id } }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "TIMETABLE_DELETED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);
    return res.status(204).send();
  } catch (error) {
    console.error("Delete timetable error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
