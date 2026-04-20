import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "../../common/middleware/auth.js";
import { env } from "../../common/config/env.js";
import { redis } from "../../common/lib/redis.js";

export const aiRouter = Router();

aiRouter.use(authMiddleware);

aiRouter.use(async (req, res, next) => {
  const key = `ai:quota:${req.user!.id}:${new Date().getUTCHours()}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60 * 60);
  }
  if (current > 20) {
    return res.status(429).json({ error: "AI quota exceeded (20 requests/hour)" });
  }
  return next();
});

aiRouter.post("/math", async (req, res) => {
  try {
    const response = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/math`, { prompt: req.body.prompt });
    return res.json(response.data);
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.response?.data || error?.message || "AI service unavailable";
    return res.status(502).json({ error: "AI provider request failed", detail: message });
  }
});

aiRouter.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/chat`, { prompt: req.body.prompt });
    return res.json(response.data);
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.response?.data || error?.message || "AI service unavailable";
    return res.status(502).json({ error: "AI provider request failed", detail: message });
  }
});

aiRouter.post("/summarize", async (req, res) => {
  try {
    const response = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/summarize`, { text: req.body.text });
    return res.json(response.data);
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.response?.data || error?.message || "AI service unavailable";
    return res.status(502).json({ error: "AI provider request failed", detail: message });
  }
});
