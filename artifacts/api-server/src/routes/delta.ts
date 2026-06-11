import { Router, type IRouter } from "express";
import {
  GetContextDeltaQueryParams,
  GetDeltaHistoryQueryParams,
  ReverseQueryBody,
} from "@workspace/api-zod";
import { getOrGenerateDelta, getDeltaHistory } from "../lib/session";
import { runReverseQuery } from "../lib/delta";

const router: IRouter = Router();

router.get("/delta", async (req, res): Promise<void> => {
  const parsed = GetContextDeltaQueryParams.safeParse(req.query);
  const compression = parsed.success ? (parsed.data.compression ?? 0.7) : 0.7;
  const sessionId = parsed.success ? parsed.data.sessionId : undefined;
  const delta = await getOrGenerateDelta(compression, 240, sessionId);
  res.json(delta);
});

router.post("/delta/query", async (req, res): Promise<void> => {
  const parsed = ReverseQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { query, windowMinutes = 240, compressionLevel = 0.8 } = parsed.data;
  const result = await runReverseQuery(query, windowMinutes, compressionLevel);
  res.json({ query, ...result });
});

router.get("/delta/history", async (req, res): Promise<void> => {
  const parsed = GetDeltaHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const deltas = getDeltaHistory(limit);
  res.json({ deltas, total: deltas.length });
});

export default router;
