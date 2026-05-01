import { Router } from "express";
import fs from "fs";
import path from "path";
import { env } from "../../common/config/env.js";
import { prisma } from "../../common/lib/prisma.js";
import { redis } from "../../common/lib/redis.js";

const router = Router();
const CONFIG_FILE = path.join(process.cwd(), "ngrok-config.json");
const SETTINGS_FILE = path.join(process.cwd(), "data", "system-settings.json");

const defaultSettings = {
  appName: "CampusLab",
  appVersion: "1.0.0",
  maintenanceMode: false,
  aiEnabled: true,
  hostelEnabled: true,
  maxFileUploadSizeMB: 100,
  sessionTimeoutMinutes: 30,
  twoFactorRequired: true,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
};

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return defaultSettings;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

type NgrokConfig = {
  ngrokUrl: string;
  updatedAt: string;
};

function readNgrokConfig(): NgrokConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as NgrokConfig;
  } catch {
    return null;
  }
}

function fallbackApiUrl() {
  return `http://localhost:${env.PORT}`;
}

function buildAiHealthUrl() {
  const base = env.AI_SERVER_BASE_URL.endsWith("/") ? env.AI_SERVER_BASE_URL : `${env.AI_SERVER_BASE_URL}/`;
  return new URL("ai/health", base).toString();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
    })
  ]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }) as Promise<T>;
}

async function checkDatabaseConnection() {
  try {
    await withTimeout(prisma.$queryRawUnsafe("SELECT 1"), 1000);
    return "connected";
  } catch {
    return "disconnected";
  }
}

async function checkRedisConnection() {
  try {
    await withTimeout(redis.ping(), 1000);
    return "connected";
  } catch {
    return "disconnected";
  }
}

async function checkAiConnection() {
  try {
    const response = await withTimeout(fetch(buildAiHealthUrl()), 2000);
    return response.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}

router.get("/api/v1/health", async (_req, res) => {
  const [database, redisStatus, aiServer] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
    checkAiConnection()
  ]);

  return res.json({
    status: database === "connected" && redisStatus === "connected" && aiServer === "online" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: "1.0.0",
    database,
    redis: redisStatus,
    aiServer,
    uptime: Math.floor(process.uptime())
  });
});

router.get("/api/config", (_req, res) => {
  const config = readNgrokConfig();

  res.setHeader("Cache-Control", "public, max-age=30");

  return res.json({
    apiUrl: config?.ngrokUrl ?? fallbackApiUrl(),
    updatedAt: config?.updatedAt ?? new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

/**
 * PUBLIC ENDPOINT: GET /api/v1/config/features
 * Get public feature flags (no authentication required)
 */
router.get("/api/v1/config/features", (_req, res) => {
  const settings = readSettings();
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.json({
    hostelEnabled: settings.hostelEnabled ?? true,
    aiEnabled: settings.aiEnabled ?? true,
    maintenanceMode: settings.maintenanceMode ?? false,
  });
});

router.post("/internal/update-ngrok-url", (req, res) => {
  const internalSecret = req.headers["x-internal-secret"];
  if (!env.INTERNAL_SECRET || internalSecret !== env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  const updatedAt = typeof req.body?.updatedAt === "string" ? req.body.updatedAt : new Date().toISOString();

  if (!url || !url.startsWith("https://")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const config: NgrokConfig = { ngrokUrl: url.replace(/\/$/, ""), updatedAt };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

  return res.json({ success: true, ...config });
});

router.get("/api/config/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendConfig = () => {
    const config = readNgrokConfig();
    const payload = JSON.stringify({
      apiUrl: config?.ngrokUrl ?? fallbackApiUrl(),
      updatedAt: config?.updatedAt ?? new Date().toISOString()
    });
    res.write(`data: ${payload}\n\n`);
  };

  sendConfig();
  const interval = setInterval(sendConfig, 10000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;