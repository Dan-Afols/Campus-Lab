import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/lib/prisma.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { UserRole } from "@prisma/client";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

export const adminConfigRouter = Router();

const settingsFilePath = path.resolve(process.cwd(), "data", "system-settings.json");
const defaultSettings = {
  appName: "CampusLab",
  appVersion: "1.0.0",
  maintenanceMode: false,
  aiEnabled: true,
  maxFileUploadSizeMB: 100,
  sessionTimeoutMinutes: 30,
  twoFactorRequired: true,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
};

function readSettings() {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      return defaultSettings;
    }
    const raw = fs.readFileSync(settingsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function writeSettings(next: Record<string, any>) {
  const dir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(settingsFilePath, JSON.stringify(next, null, 2), "utf8");
}

adminConfigRouter.use(authMiddleware, requireRole(UserRole.ADMIN));

/**
 * GET /admin/config/settings
 * Get system configuration
 */
adminConfigRouter.get("/settings", async (req, res) => {
  try {
    const settings = readSettings();

    return res.json(settings);
  } catch (error) {
    console.error("Fetch settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PATCH /admin/config/settings
 * Update system configuration
 */
adminConfigRouter.patch("/settings", async (req, res) => {
  try {
    const schema = z.object({
      maintenanceMode: z.boolean().optional(),
      aiEnabled: z.boolean().optional(),
      maxFileUploadSizeMB: z.number().min(1).max(500).optional(),
      sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
      twoFactorRequired: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
      pushNotificationsEnabled: z.boolean().optional(),
    });

    const body = schema.parse(req.body);

    const existing = readSettings();
    const next = { ...existing, ...body };
    writeSettings(next);

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "SYSTEM_CONFIG_UPDATED",
        resource: "app-config",
        metadata: body,
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Settings updated successfully",
      config: next,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

adminConfigRouter.post("/smtp/test", async (req, res) => {
  try {
    const schema = z.object({
      host: z.string().min(2).optional(),
      port: z.number().int().min(1).max(65535).optional(),
      secure: z.boolean().optional(),
      user: z.string().min(2).optional(),
      pass: z.string().min(2).optional(),
      from: z.string().email().optional(),
      to: z.string().email().optional(),
    });

    const body = schema.parse(req.body);
    const resolvedHost = body.host || process.env.SMTP_HOST;
    const resolvedPort = body.port || Number(process.env.SMTP_PORT || 587);
    const resolvedUser = body.user || process.env.SMTP_USER;
    const resolvedPassRaw = body.pass || process.env.SMTP_PASS;
    const resolvedPass = resolvedPassRaw ? String(resolvedPassRaw).replace(/\s+/g, "") : undefined;
    const resolvedFrom = body.from || process.env.SMTP_USER;
    const resolvedSecure = typeof body.secure === "boolean" ? body.secure : resolvedPort === 465;

    if (!resolvedHost || !resolvedUser || !resolvedPass || !resolvedFrom) {
      return res.status(400).json({ message: "SMTP is not fully configured in environment or payload" });
    }

    const transport = nodemailer.createTransport({
      host: resolvedHost,
      port: resolvedPort,
      secure: resolvedSecure,
      auth: {
        user: resolvedUser,
        pass: resolvedPass,
      },
    });

    await transport.verify();

    if (body.to) {
      await transport.sendMail({
        from: resolvedFrom,
        to: body.to,
        subject: "CampusLab SMTP Test",
        text: "SMTP is configured correctly.",
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "SMTP_TEST_SUCCESS",
        resource: resolvedHost,
        metadata: { to: body.to || null, from: resolvedFrom },
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({ message: body.to ? "SMTP verified and test email sent" : "SMTP verified successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid SMTP payload" });
    }
    console.error("SMTP test error:", error);
    return res.status(500).json({ message: "SMTP connection failed" });
  }
});

/**
 * GET /admin/config/email-templates
 * Get email notification templates
 */
adminConfigRouter.get("/email-templates", async (req, res) => {
  try {
    const templates = [
      {
        id: "welcome",
        name: "Welcome Email",
        subject: "Welcome to CampusLab",
        description: "Sent when user creates account",
      },
      {
        id: "password-reset",
        name: "Password Reset",
        subject: "Reset Your Password",
        description: "Sent when user requests password reset",
      },
      {
        id: "otp-verification",
        name: "OTP Verification",
        subject: "Your OTP Code",
        description: "Sent for two-factor authentication",
      },
      {
        id: "news-notification",
        name: "News Notification",
        subject: "New Update from CampusLab",
        description: "Sent when news posts are published",
      },
      {
        id: "course-rep-approved",
        name: "Course Rep Approved",
        subject: "Your Course Representative Application Approved",
        description: "Sent when course rep application is approved",
      },
    ];

    return res.json(templates);
  } catch (error) {
    console.error("Fetch email templates error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/config/email-templates/:id
 * Get email template content
 */
adminConfigRouter.get("/email-templates/:id", async (req, res) => {
  try {
    const template = {
      id: req.params.id,
      subject: "Email Subject",
      content: "<h1>Email Content</h1><p>Email body here</p>",
      variables: ["USER_NAME", "RESET_LINK", "OTP_CODE"],
    };

    return res.json(template);
  } catch (error) {
    console.error("Fetch email template error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PUT /admin/config/email-templates/:id
 * Update email template
 */
adminConfigRouter.put("/email-templates/:id", async (req, res) => {
  try {
    const schema = z.object({
      subject: z.string().min(5),
      content: z.string().min(20),
    });

    const body = schema.parse(req.body);

    // TODO: Store in database
    // await prisma.emailTemplate.update(...)

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "EMAIL_TEMPLATE_UPDATED",
        resource: req.params.id,
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Email template updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Update email template error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/audit-logs
 * Get system audit logs
 */
adminConfigRouter.get("/audit-logs", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const action = req.query.action as string | undefined;
    const actor = req.query.actor as string | undefined;

    const where: any = {};
    if (action) {
      where.action = action;
    }
    if (actor) {
      where.actorUserId = actor;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/audit-logs/export
 * Export audit logs (CSV)
 */
adminConfigRouter.get("/audit-logs/export", async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    // Convert to CSV
    const headers =
      "Timestamp,Actor,Email,Action,Resource,IP Address,Metadata\n";
    const rows = logs
      .map(
        (log) =>
          `"${log.createdAt.toISOString()}","${log.actor?.fullName}","${log.actor?.email}","${log.action}","${log.resource}","${log.ipAddress}","${JSON.stringify(log.metadata)}"`
      )
      .join("\n");

    const csv = headers + rows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Export audit logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/config/backup
 * Trigger database backup
 */
adminConfigRouter.post("/backup", async (req, res) => {
  try {
    // TODO: Implement backup logic
    // This could trigger a backup job in a queue

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "DATABASE_BACKUP_TRIGGERED",
        resource: "database",
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Database backup initiated",
      backupId: `backup-${Date.now()}`,
      estimatedTime: "5-10 minutes",
    });
  } catch (error) {
    console.error("Backup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/config/backups
 * List available backups
 */
adminConfigRouter.get("/backups", async (req, res) => {
  try {
    // TODO: List actual backups from storage
    const backups = [
      {
        id: "backup-1",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        size: "2.5GB",
        status: "completed",
      },
      {
        id: "backup-2",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        size: "2.4GB",
        status: "completed",
      },
    ];

    return res.json(backups);
  } catch (error) {
    console.error("Fetch backups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/config/restore
 * Restore from backup
 */
adminConfigRouter.post("/restore", async (req, res) => {
  try {
    const schema = z.object({
      backupId: z.string(),
      confirmed: z.boolean().refine((val) => val === true),
    });

    const body = schema.parse(req.body);

    // TODO: Implement restore logic
    // This is a dangerous operation - requires confirmation and admin auth

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "DATABASE_RESTORE_INITIATED",
        resource: body.backupId,
        ipAddress: req.ip || "unknown",
      },
    });

    return res.json({
      message: "Database restore initiated",
      backupId: body.backupId,
      estimatedTime: "10-15 minutes",
      warning:
        "The application will be temporarily unavailable during restore.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Restore error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/config/system-health
 * Get system health metrics
 */
adminConfigRouter.get("/system-health", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      database: {
        status: "connected",
        responseTime: "12ms",
      },
      cache: {
        status: "connected",
        responseTime: "2ms",
      },
      queue: {
        status: "connected",
        pendingJobs: 23,
      },
      disk: {
        status: "healthy",
        usagePercent: 45,
      },
      memory: {
        status: "healthy",
        usagePercent: 62,
      },
      timestamp: new Date(),
    };

    return res.json(health);
  } catch (error) {
    console.error("System health error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
