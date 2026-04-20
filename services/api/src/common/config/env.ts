import dotenv from "dotenv";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../../.env"),
  path.resolve(__dirname, "../../../.env")
];

const apiEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (apiEnvPath) {
  dotenv.config({ path: apiEnvPath, override: true });
}

const envBoolean = (defaultValue: boolean) =>
  z
    .preprocess((value) => {
      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
          return true;
        }
        if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
          return false;
        }
      }

      return value;
    }, z.boolean())
    .default(defaultValue);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:8081"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  AI_SERVER_BASE_URL: z.string().url().default("http://localhost:8001/api"),
  AES_SECRET_32: z.string().length(32),
  MAX_UPLOAD_MB: z.coerce.number().default(50),
  QUEUE_PREFIX: z.string().default("campuslab"),
  CLAMAV_ENABLED: envBoolean(true),
  CLAMAV_HOST: z.string().default("localhost"),
  CLAMAV_PORT: z.coerce.number().default(3310),
  SCRAPE_MAX_LINKS: z.coerce.number().default(8),
  EXPOSE_TEST_OTPS: envBoolean(false),
  EMAIL_OTP_REQUIRED: envBoolean(true),
  INTERNAL_SECRET: z.string().default(""),
  ADMIN_SHOWCASE_LOGIN: envBoolean(false),
  ADMIN_OFFLINE_LOGIN: envBoolean(false),
  ADMIN_OFFLINE_EMAIL: z.string().email().default("showcase@campuslab.app"),
  ADMIN_OFFLINE_PASSWORD: z.string().min(8).default("Showcase@123!")
});

export const env = envSchema.parse(process.env);
