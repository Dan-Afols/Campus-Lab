import type { Request, Response, NextFunction } from "express";

export function ngrokBypassMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
}