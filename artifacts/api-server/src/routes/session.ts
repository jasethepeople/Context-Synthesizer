import { Router, type IRouter } from "express";
import { StartSessionBody } from "@workspace/api-zod";
import {
  getCurrentSession,
  startSession,
  endSession,
} from "../lib/session";

const router: IRouter = Router();

router.get("/session", async (_req, res): Promise<void> => {
  res.json(getCurrentSession());
});

router.post("/session/start", async (req, res): Promise<void> => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, focusLabel, activeCodePaths, activeTaskIds } = parsed.data;
  const session = startSession(userId, focusLabel, activeCodePaths, activeTaskIds);
  res.status(201).json(session);
});

router.post("/session/end", async (_req, res): Promise<void> => {
  const result = await endSession(0.7);
  res.json(result);
});

export default router;
