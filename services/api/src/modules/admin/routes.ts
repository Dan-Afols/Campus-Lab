import { Router } from "express";
import { adminAuthRouter } from "./auth.js";
import { adminUsersRouter } from "./users.js";
import { adminAcademicRouter } from "./academic.js";
import { adminHostelRouter } from "./hostel.js";
import { adminNewsRouter } from "./news.js";
import { adminConfigRouter } from "./config.js";

export const adminRouter = Router();

// Mount all admin sub-routers
adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/academic", adminAcademicRouter);
adminRouter.use("/hostel", adminHostelRouter);
adminRouter.use("/news", adminNewsRouter);
adminRouter.use("/config", adminConfigRouter);
