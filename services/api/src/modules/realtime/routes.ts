import { Router } from "express";
import { prisma } from "../../common/lib/prisma.js";
import { addRealtimeClient } from "../../common/lib/realtime.js";
import { verifyAccessToken } from "../../common/utils/jwt.js";

export const realtimeRouter = Router();

realtimeRouter.get("/stream", async (req, res) => {
  const token = String(req.query.token ?? "").trim();
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const removeClient = addRealtimeClient(res);
    res.write(`data: ${JSON.stringify({ channel: "news", action: "updated", at: new Date().toISOString(), bootstrap: true })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(`: keepalive ${Date.now()}\n\n`);
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      removeClient();
    });

    return undefined;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});
