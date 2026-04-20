import { Express } from "express";
import { aiRouter } from "./modules/ai/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { financeRouter } from "./modules/finance/routes.js";
import { healthRouter } from "./modules/health/routes.js";
import { hostelRouter } from "./modules/hostel/routes.js";
import { materialsRouter } from "./modules/materials/routes.js";
import { newsRouter } from "./modules/news/routes.js";
import { notificationsRouter } from "./modules/notifications/routes.js";
import { timetableRouter } from "./modules/timetable/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import configRouter from "./modules/config/routes.js";
import { pastQuestionsRouter } from "./modules/pastQuestions/routes.js";
import { realtimeRouter } from "./modules/realtime/routes.js";

export function registerRoutes(app: Express) {
  app.use(configRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/news", newsRouter);
  app.use("/api/v1/timetable", timetableRouter);
  app.use("/api/v1/materials", materialsRouter);
  app.use("/api/v1/hostel", hostelRouter);
  app.use("/api/v1/finance", financeRouter);
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/past-questions", pastQuestionsRouter);
  app.use("/api/v1/realtime", realtimeRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/admin", adminRouter);
}
