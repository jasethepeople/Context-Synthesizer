import { Router, type IRouter } from "express";
import { ListRecentEventsQueryParams } from "@workspace/api-zod";
import { graph } from "../lib/graph";

const router: IRouter = Router();

router.get("/ingestion/stats", async (_req, res): Promise<void> => {
  res.json(graph.getStats());
});

router.get("/ingestion/events", async (req, res): Promise<void> => {
  const parsed = ListRecentEventsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const source = parsed.success ? (parsed.data.source ?? "all") : "all";

  let events = graph.events;
  if (source !== "all") {
    events = events.filter((e) => e.source === source);
  }
  const sliced = events.slice(0, limit);

  res.json({
    events: sliced.map((e) => ({
      id: e.id,
      source: e.source,
      eventType: e.eventType,
      actor: e.actor,
      summary: e.summary,
      linkedNodeIds: e.linkedNodeIds,
      timestamp: e.timestamp,
      deduplicated: e.deduplicated,
      deduplicationGroupId: e.deduplicationGroupId ?? null,
    })),
    total: events.length,
  });
});

export default router;
