import { Router, type IRouter } from "express";
import {
  IngestGithubEventBody,
  IngestSlackEventBody,
  IngestLinearEventBody,
  SimulateEventsBody,
} from "@workspace/api-zod";
import {
  ingestGithubEvent,
  ingestSlackEvent,
  ingestLinearEvent,
  simulateScenario,
} from "../lib/ingestion";

const router: IRouter = Router();

router.post("/webhooks/github", async (req, res): Promise<void> => {
  const parsed = IngestGithubEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = ingestGithubEvent(parsed.data as Record<string, unknown>);
  res.status(202).json({ accepted: true, ...result });
});

router.post("/webhooks/slack", async (req, res): Promise<void> => {
  const parsed = IngestSlackEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = ingestSlackEvent(parsed.data as Record<string, unknown>);
  res.status(202).json({ accepted: true, ...result });
});

router.post("/webhooks/linear", async (req, res): Promise<void> => {
  const parsed = IngestLinearEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = ingestLinearEvent(parsed.data as Record<string, unknown>);
  res.status(202).json({ accepted: true, ...result });
});

router.post("/webhooks/simulate", async (req, res): Promise<void> => {
  const parsed = SimulateEventsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { scenario, eventCount = 20, spreadMinutes = 60 } = parsed.data;
  const eventsQueued = simulateScenario(
    scenario as "auth_refactor" | "api_breaking_change" | "sprint_standup" | "hotfix_deploy" | "all",
    eventCount
  );
  res.status(202).json({
    eventsQueued,
    scenario,
    estimatedCompletionMs: eventsQueued * 200 + spreadMinutes * 10,
  });
});

export default router;
