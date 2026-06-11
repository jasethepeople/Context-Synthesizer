import { randomUUID } from "crypto";
import { graph } from "./graph";
import { generateDelta } from "./delta";
import { logger } from "./logger";

export interface FocusSession {
  id: string;
  userId: string;
  status: "active" | "idle" | "ended";
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  graphSnapshotAtStart: number | null;
  eventsAccumulatedDuring: number | null;
  contextDriftScore: number | null;
  focusLabel: string | null;
  activeCodePaths: string[];
  activeTaskIds: string[];
  eventsAtStart: number;
}

export interface StoredDelta {
  id: string;
  sessionId: string | null;
  generatedAt: string;
  compressionLevel: number;
  contextDriftScore: number;
  windowMinutes: number;
  tier1: unknown;
  tier2: unknown;
  tier3: unknown;
  totalEventsAnalyzed: number;
  topEntities: unknown[];
}

let currentSession: FocusSession = {
  id: randomUUID(),
  userId: "default-user",
  status: "idle",
  startedAt: null,
  endedAt: null,
  durationMinutes: null,
  graphSnapshotAtStart: null,
  eventsAccumulatedDuring: null,
  contextDriftScore: null,
  focusLabel: null,
  activeCodePaths: [],
  activeTaskIds: [],
  eventsAtStart: 0,
};

const deltaHistory: StoredDelta[] = [];

export function getCurrentSession(): FocusSession {
  return { ...currentSession };
}

export function startSession(
  userId: string,
  focusLabel?: string,
  activeCodePaths?: string[],
  activeTaskIds?: string[]
): FocusSession {
  currentSession = {
    id: randomUUID(),
    userId,
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMinutes: null,
    graphSnapshotAtStart: graph.nodes.size,
    eventsAccumulatedDuring: null,
    contextDriftScore: null,
    focusLabel: focusLabel ?? null,
    activeCodePaths: activeCodePaths ?? [],
    activeTaskIds: activeTaskIds ?? [],
    eventsAtStart: graph.events.length,
  };
  graph.setBaseline();
  logger.info({ sessionId: currentSession.id, userId, focusLabel }, "Focus session started");
  return { ...currentSession };
}

export async function endSession(compressionLevel = 0.7): Promise<{ session: FocusSession; delta: StoredDelta }> {
  const now = new Date();
  const startedAt = currentSession.startedAt ? new Date(currentSession.startedAt) : now;
  const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60_000);
  const eventsAccumulatedDuring = graph.events.length - currentSession.eventsAtStart;
  const contextDriftScore = graph.getContextDriftScore();

  currentSession = {
    ...currentSession,
    status: "ended",
    endedAt: now.toISOString(),
    durationMinutes,
    eventsAccumulatedDuring: Math.max(0, eventsAccumulatedDuring),
    contextDriftScore,
  };

  const windowMinutes = durationMinutes > 0 ? durationMinutes : 60;
  const { tier1, tier2, tier3, topEntities } = await generateDelta(windowMinutes, compressionLevel, {
    focusLabel: currentSession.focusLabel ?? undefined,
    activeCodePaths: currentSession.activeCodePaths,
    activeTaskIds: currentSession.activeTaskIds,
    durationMinutes,
  });

  const delta: StoredDelta = {
    id: randomUUID(),
    sessionId: currentSession.id,
    generatedAt: now.toISOString(),
    compressionLevel,
    contextDriftScore,
    windowMinutes,
    tier1,
    tier2,
    tier3,
    totalEventsAnalyzed: graph.getEventsInWindow(windowMinutes).length,
    topEntities: Array.isArray(topEntities) ? topEntities : [],
  };

  deltaHistory.unshift(delta);
  if (deltaHistory.length > 50) deltaHistory.splice(50);

  logger.info({ sessionId: currentSession.id, durationMinutes, contextDriftScore }, "Focus session ended");
  return { session: { ...currentSession }, delta };
}

export async function getOrGenerateDelta(
  compressionLevel = 0.7,
  windowMinutes = 240,
  sessionId?: string
): Promise<StoredDelta> {
  if (sessionId) {
    const existing = deltaHistory.find((d) => d.sessionId === sessionId);
    if (existing) return existing;
  }

  const { tier1, tier2, tier3, topEntities } = await generateDelta(windowMinutes, compressionLevel);

  const delta: StoredDelta = {
    id: randomUUID(),
    sessionId: currentSession.status === "active" ? currentSession.id : null,
    generatedAt: new Date().toISOString(),
    compressionLevel,
    contextDriftScore: graph.getContextDriftScore(),
    windowMinutes,
    tier1,
    tier2,
    tier3,
    totalEventsAnalyzed: graph.getEventsInWindow(windowMinutes).length,
    topEntities: Array.isArray(topEntities) ? topEntities : [],
  };

  deltaHistory.unshift(delta);
  if (deltaHistory.length > 50) deltaHistory.splice(50);

  return delta;
}

export function getDeltaHistory(limit = 10): StoredDelta[] {
  return deltaHistory.slice(0, limit);
}
