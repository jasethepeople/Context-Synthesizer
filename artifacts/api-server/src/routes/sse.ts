import { Router, type IRouter } from "express";
import { sseManager } from "../lib/sse";

const router: IRouter = Router();

router.get("/sse/events", (req, res): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(": connected\n\n");

  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15_000);

  sseManager.addClient(res);

  req.on("close", () => {
    clearInterval(keepAlive);
  });
});

export default router;
