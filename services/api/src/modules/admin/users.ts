import { Router } from "express";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { prisma } from "../../common/lib/prisma.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { Gender, UserRole, UserStatus } from "@prisma/client";
import { decryptField } from "../../common/utils/crypto.js";

export const adminUsersRouter = Router();

adminUsersRouter.use(authMiddleware, requireRole(UserRole.ADMIN));

function safeDecryptMatric(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decryptField(value);
  } catch {
    return null;
  }
}

/**
 * GET /admin/users/students
 * List all students with pagination, search, and filters
 */
adminUsersRouter.get("/students", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || "";
    const status = (req.query.status as UserStatus) || null;

    const where: any = {
      role: UserRole.STUDENT,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          matricNumberEncrypted: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              name: true,
              college: { select: { name: true, school: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const normalizedStudents = students.map((student) => ({
      ...student,
      matricNumber: safeDecryptMatric(student.matricNumberEncrypted),
      matricNumberEncrypted: undefined,
    }));

    return res.json({
      data: normalizedStudents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch students error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/users/students/:id
 * Get single student details
 */
adminUsersRouter.get("/students/:id", async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.params.id, role: UserRole.STUDENT },
      include: {
        department: {
          include: {
            college: { include: { school: true } },
          },
        },
          bookings: {
            include: { bed: { include: { room: { include: { hostel: true } } } } },
          },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json({
      ...student,
      matricNumber: safeDecryptMatric(student.matricNumberEncrypted),
      matricNumberEncrypted: undefined,
      dobEncrypted: undefined,
      passwordHash: undefined,
      refreshTokenHash: undefined,
      twoFactorSecretEncrypted: undefined,
    });
  } catch (error) {
    console.error("Fetch student error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/users/students/:id
 * Update student profile (name, email, etc.)
 */
adminUsersRouter.patch("/students/:id", async (req, res) => {
  try {
    const schema = z.object({
      fullName: z.string().optional(),
      email: z.string().email().optional(),
      status: z.enum([UserStatus.ACTIVE, UserStatus.LOCKED, UserStatus.REJECTED]).optional(),
    });

    const body = schema.parse(req.body);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: body,
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "STUDENT_PROFILE_UPDATED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.json({ message: "Student updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update student error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/students/:id/suspend
 * Suspend student account
 */
adminUsersRouter.post("/students/:id/suspend", async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().min(10, "Reason must be at least 10 characters"),
    });

    const body = schema.parse(req.body);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: { status: UserStatus.LOCKED },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "STUDENT_SUSPENDED",
          resource: req.params.id,
          metadata: body.reason,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Suspend student error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/students/:id/unsuspend
 * Unsuspend student account
 */
adminUsersRouter.post("/students/:id/unsuspend", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockUntil: null },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "STUDENT_UNSUSPENDED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("Unsuspend student error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/students/:id/reset-password
 * Send password reset link to student
 */
adminUsersRouter.post("/students/:id/reset-password", async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // TODO: Send email with reset link

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "STUDENT_PASSWORD_RESET",
        resource: req.params.id,
        metadata: { resetTokenPreview: hashedToken.slice(0, 8) },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({ message: "Password reset link sent to student email" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /admin/users/students/:id
 * Delete student account (soft delete or hard delete with confirmation)
 */
adminUsersRouter.delete("/students/:id", async (req, res) => {
  try {
    const schema = z.object({
      confirmed: z.boolean().refine((val) => val === true, {
        message: "Must confirm deletion",
      }),
      reason: z.string().min(10),
    });

    const body = schema.parse(req.body);

    await prisma.$transaction([
      prisma.user.delete({
        where: { id: req.params.id },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "STUDENT_DELETED",
          resource: req.params.id,
          metadata: body.reason,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Delete student error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/users/course-reps
 * List all course representatives
 */
adminUsersRouter.get("/course-reps", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = (req.query.status as UserStatus) || null;

    const where: any = {
      role: UserRole.COURSE_REP,
    };

    if (status) {
      where.status = status;
    }

    const [reps, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {

        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      data: reps,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch course reps error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/course-reps/:id/approve
 * Approve pending course representative
 */
adminUsersRouter.post("/course-reps/:id/approve", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: { status: UserStatus.ACTIVE },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COURSE_REP_APPROVED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("Approve course rep error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/course-reps/:id/reject
 * Reject course representative application
 */
adminUsersRouter.post("/course-reps/:id/reject", async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().min(10),
    });

    const body = schema.parse(req.body);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: { status: UserStatus.REJECTED },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COURSE_REP_REJECTED",
          resource: req.params.id,
          metadata: body.reason,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Reject course rep error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/course-reps/:id/lock
 * Lock active course representative account
 */
adminUsersRouter.post("/course-reps/:id/lock", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: req.params.id, role: UserRole.COURSE_REP },
        data: { status: UserStatus.LOCKED },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COURSE_REP_LOCKED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("Lock course rep error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/course-reps/:id/activate
 * Re-activate locked or rejected course representative
 */
adminUsersRouter.post("/course-reps/:id/activate", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: req.params.id, role: UserRole.COURSE_REP },
        data: { status: UserStatus.ACTIVE },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "COURSE_REP_ACTIVATED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("Activate course rep error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/users/admins
 * List all admin accounts
 */
adminUsersRouter.get("/admins", async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(admins);
  } catch (error) {
    console.error("Fetch admins error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/users/admins
 * Create new admin account
 */
adminUsersRouter.post("/admins", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      fullName: z.string().min(2),
      password: z.string().min(12, "Admin password must be at least 12 characters"),
      schoolId: z.string().uuid().optional(),
      collegeId: z.string().uuid().optional(),
      departmentId: z.string().uuid().optional(),
      departmentLevelId: z.string().uuid().optional(),
      phoneNumber: z.string().min(7).optional(),
      emergencyContactName: z.string().min(2).optional(),
      emergencyContactPhone: z.string().min(7).optional(),
    });

    const body = schema.parse(req.body);
    const actor = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        schoolId: true,
        collegeId: true,
        departmentId: true,
        departmentLevelId: true,
      },
    });

    if (!actor) {
      return res.status(404).json({ message: "Admin actor not found" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const newAdmin = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: body.email,
          fullName: body.fullName,
          passwordHash: hashedPassword,
          matricNumberEncrypted: `ADMIN-${Date.now()}`,
          phoneNumber: body.phoneNumber || "0000000000",
          dobEncrypted: "1970-01-01",
          gender: Gender.MALE,
          schoolId: body.schoolId || actor.schoolId,
          collegeId: body.collegeId || actor.collegeId,
          departmentId: body.departmentId || actor.departmentId,
          departmentLevelId: body.departmentLevelId || actor.departmentLevelId,
          emergencyContactName: body.emergencyContactName || "System",
          emergencyContactPhone: body.emergencyContactPhone || "0000000000",
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "ADMIN_CREATED",
          resource: body.email,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(201).json({
      message: "Admin account created. New admin must setup 2FA on first login.",
      admin: newAdmin[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create admin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /admin/users/admins/:id
 * Delete admin account
 */
adminUsersRouter.delete("/admins/:id", async (req, res) => {
  try {
    const schema = z.object({
      confirmed: z.boolean().refine((val) => val === true),
    });

    const body = schema.parse(req.body);

    // Prevent deleting yourself
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ message: "Cannot delete your own admin account" });
    }

    await prisma.$transaction([
      prisma.user.delete({
        where: { id: req.params.id },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "ADMIN_DELETED",
          resource: req.params.id,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Delete admin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
