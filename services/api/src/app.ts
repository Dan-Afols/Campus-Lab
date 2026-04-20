import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./common/config/env.js";
import { apiRateLimiter } from "./common/middleware/rateLimit.js";
import { ngrokBypassMiddleware } from "./common/middleware/ngrok-bypass.middleware.js";
import { registerRoutes } from "./routes.js";

export const app = express();

app.use(ngrokBypassMiddleware);
app.use(helmet());
const explicitOrigins = new Set([
  env.APP_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174"
]);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (explicitOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.(app|dev)$/i.test(origin)) {
        callback(null, true);
        return;
      }

      if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)) {
        callback(null, true);
        return;
      }

      if (/^https:\/\/[a-z0-9-]+\.duckdns\.org$/i.test(origin)) {
        callback(null, true);
        return;
      }

      if (/^http:\/\/\d{1,3}(\.\d{1,3}){3}:\d+$/i.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(apiRateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "campus-lab-api", at: new Date().toISOString() });
});

registerRoutes(app);
