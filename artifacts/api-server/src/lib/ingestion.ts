import { randomUUID } from "crypto";
import { graph, type RawEvent } from "./graph";
import { logger } from "./logger";
import { sseManager } from "./sse";

function broadcastEvent(event: RawEvent) {
  sseManager.broadcast(event);
}

export function ingestGithubEvent(payload: Record<string, unknown>): {
  eventId: string;
  deduplicated: boolean;
  graphNodesCreated: number;
  graphEdgesCreated: number;
} {
  const actor = String(payload.actor ?? "unknown");
  const repo = String(payload.repository ?? "unknown-repo");
  const eventType = String(payload.eventType ?? "push");
  const summary = payload.title
    ? `${eventType} in ${repo}: ${payload.title}`
    : `${eventType} by ${actor} on ${repo}`;

  const { isDuplicate, groupId } = graph.dedup.check("github", eventType, actor, summary);

  const event: RawEvent = {
    id: randomUUID(),
    source: "github",
    eventType,
    actor,
    summary,
    linkedNodeIds: [],
    timestamp: new Date().toISOString(),
    deduplicated: isDuplicate,
    deduplicationGroupId: isDuplicate ? groupId : null,
    raw: payload,
  };

  if (isDuplicate) {
    graph.recordEvent(event);
    broadcastEvent(event);
    return { eventId: event.id, deduplicated: true, graphNodesCreated: 0, graphEdgesCreated: 0 };
  }

  let nodesCreated = 0;
  let edgesCreated = 0;

  const { node: actorNode, created: ac } = graph.upsertNode("Person", actor, { platform: "github" });
  if (ac) nodesCreated++;

  const { node: repoNode, created: rc } = graph.upsertNode("CodeModule", repo, { platform: "github" });
  if (rc) nodesCreated++;

  const edge = graph.addEdge(actorNode.id, repoNode.id, "modified", event.id);
  edgesCreated++;

  event.linkedNodeIds = [actorNode.id, repoNode.id];

  if (payload.title && typeof payload.title === "string" && payload.title.includes("AUTH")) {
    const { node: authMod, created: amc } = graph.upsertNode("CodeModule", "auth-middleware", { risk: "high" });
    if (amc) nodesCreated++;
    graph.addEdge(repoNode.id, authMod.id, "depends_on", event.id);
    edgesCreated++;
    event.linkedNodeIds.push(authMod.id);
  }

  if (payload.ref && typeof payload.ref === "string") {
    const { node: branchNode, created: bc } = graph.upsertNode("CodeModule", `branch:${payload.ref}`, { repo });
    if (bc) nodesCreated++;
    graph.addEdge(actorNode.id, branchNode.id, "modified", event.id);
    edgesCreated++;
    event.linkedNodeIds.push(branchNode.id);
  }

  graph.recordEvent(event);
  broadcastEvent(event);
  logger.debug({ eventId: event.id, nodesCreated, edgesCreated }, "GitHub event ingested");
  return { eventId: event.id, deduplicated: false, graphNodesCreated: nodesCreated, graphEdgesCreated: edgesCreated };
}

export function ingestSlackEvent(payload: Record<string, unknown>): {
  eventId: string;
  deduplicated: boolean;
  graphNodesCreated: number;
  graphEdgesCreated: number;
} {
  const user = String(payload.user ?? "unknown");
  const channel = String(payload.channel ?? "#general");
  const text = String(payload.text ?? "");
  const eventType = String(payload.eventType ?? "message");
  const summary = `[${channel}] ${user}: ${text.slice(0, 120)}`;

  const { isDuplicate, groupId } = graph.dedup.check("slack", eventType, user, text);

  const event: RawEvent = {
    id: randomUUID(),
    source: "slack",
    eventType,
    actor: user,
    summary,
    linkedNodeIds: [],
    timestamp: new Date().toISOString(),
    deduplicated: isDuplicate,
    deduplicationGroupId: isDuplicate ? groupId : null,
    raw: payload,
  };

  if (isDuplicate) {
    graph.recordEvent(event);
    broadcastEvent(event);
    return { eventId: event.id, deduplicated: true, graphNodesCreated: 0, graphEdgesCreated: 0 };
  }

  let nodesCreated = 0;
  let edgesCreated = 0;

  const { node: personNode, created: pc } = graph.upsertNode("Person", user, { platform: "slack" });
  if (pc) nodesCreated++;

  const { node: commNode, created: cc } = graph.upsertNode("Communication", `${channel}:${event.id.slice(0, 8)}`, {
    channel,
    text: text.slice(0, 500),
    threadTs: payload.threadTs ?? null,
  });
  if (cc) nodesCreated++;

  graph.addEdge(personNode.id, commNode.id, "authored", event.id);
  edgesCreated++;

  const linkedEntities = (payload.linkedEntities as string[] | undefined) ?? [];
  for (const entity of linkedEntities) {
    const { node: entityNode, created: ec } = graph.upsertNode("Task", entity, { linkedFrom: "slack" });
    if (ec) nodesCreated++;
    graph.addEdge(commNode.id, entityNode.id, "referenced", event.id);
    edgesCreated++;
    event.linkedNodeIds.push(entityNode.id);
  }

  event.linkedNodeIds.push(personNode.id, commNode.id);

  const upperText = text.toUpperCase();
  if (upperText.includes("DECISION") || upperText.includes("DECIDED") || upperText.includes("AGREED")) {
    commNode.properties = { ...commNode.properties, isDecision: true };
  }

  graph.recordEvent(event);
  broadcastEvent(event);
  logger.debug({ eventId: event.id, nodesCreated, edgesCreated }, "Slack event ingested");
  return { eventId: event.id, deduplicated: false, graphNodesCreated: nodesCreated, graphEdgesCreated: edgesCreated };
}

export function ingestLinearEvent(payload: Record<string, unknown>): {
  eventId: string;
  deduplicated: boolean;
  graphNodesCreated: number;
  graphEdgesCreated: number;
} {
  const identifier = String(payload.identifier ?? "unknown");
  const action = String(payload.action ?? "update");
  const type = String(payload.type ?? "Issue");
  const title = payload.title ? String(payload.title) : identifier;
  const summary = `${type} ${identifier} ${action}: ${title}`;

  const { isDuplicate, groupId } = graph.dedup.check("linear", `${type}:${action}`, identifier, title);

  const event: RawEvent = {
    id: randomUUID(),
    source: "linear",
    eventType: `${type.toLowerCase()}_${action}`,
    actor: String(payload.assignee ?? "system"),
    summary,
    linkedNodeIds: [],
    timestamp: new Date().toISOString(),
    deduplicated: isDuplicate,
    deduplicationGroupId: isDuplicate ? groupId : null,
    raw: payload,
  };

  if (isDuplicate) {
    graph.recordEvent(event);
    broadcastEvent(event);
    return { eventId: event.id, deduplicated: true, graphNodesCreated: 0, graphEdgesCreated: 0 };
  }

  let nodesCreated = 0;
  let edgesCreated = 0;

  const { node: taskNode, created: tc } = graph.upsertNode("Task", identifier, {
    title,
    state: payload.state ?? "unknown",
    type,
    platform: "linear",
  });
  if (tc) nodesCreated++;

  if (payload.project) {
    const { node: projNode, created: prc } = graph.upsertNode("Project", String(payload.project), { platform: "linear" });
    if (prc) nodesCreated++;
    graph.addEdge(taskNode.id, projNode.id, "depends_on", event.id);
    edgesCreated++;
    event.linkedNodeIds.push(projNode.id);
  }

  if (payload.assignee) {
    const { node: personNode, created: perc } = graph.upsertNode("Person", String(payload.assignee), { platform: "linear" });
    if (perc) nodesCreated++;
    graph.addEdge(personNode.id, taskNode.id, "assigned", event.id);
    edgesCreated++;
    event.linkedNodeIds.push(personNode.id);
  }

  event.linkedNodeIds.push(taskNode.id);

  graph.recordEvent(event);
  broadcastEvent(event);
  logger.debug({ eventId: event.id, nodesCreated, edgesCreated }, "Linear event ingested");
  return { eventId: event.id, deduplicated: false, graphNodesCreated: nodesCreated, graphEdgesCreated: edgesCreated };
}

type Scenario = "auth_refactor" | "api_breaking_change" | "sprint_standup" | "hotfix_deploy" | "all";

const SCENARIO_TEMPLATES: Record<string, Array<() => void>> = {
  auth_refactor: [
    () => ingestGithubEvent({ eventType: "pull_request", repository: "backend/api", actor: "alice", title: "refactor: AUTH middleware — switch to JWT RS256", ref: "feat/auth-rs256", url: "https://github.com/org/backend/pull/421" }),
    () => ingestSlackEvent({ eventType: "message", channel: "#backend-team", user: "alice", text: "PR #421 up for review — breaking change to auth middleware interface. Signing key rotation required.", linkedEntities: ["AUTH-88"] }),
    () => ingestLinearEvent({ action: "update", type: "Issue", identifier: "AUTH-88", title: "Migrate auth to RS256", state: "In Progress", assignee: "alice", project: "Security Sprint Q2" }),
    () => ingestSlackEvent({ eventType: "thread_reply", channel: "#backend-team", user: "bob", text: "This will break the mobile token refresh flow — we need to update the SDK client too.", threadTs: "1718000000.000100", linkedEntities: ["AUTH-88", "MOB-12"] }),
    () => ingestGithubEvent({ eventType: "review", repository: "backend/api", actor: "bob", title: "Changes requested on PR #421 — token refresh path unhandled", url: "https://github.com/org/backend/pull/421#review-999" }),
    () => ingestLinearEvent({ action: "create", type: "Issue", identifier: "MOB-12", title: "Update mobile SDK for RS256 token refresh", state: "Todo", assignee: "carol", project: "Security Sprint Q2" }),
    () => ingestSlackEvent({ eventType: "mention", channel: "#arch-decisions", user: "dave", text: "DECISION: Proceeding with RS256. Old HS256 tokens invalidated after 2025-06-14 00:00 UTC. @alice @bob please coordinate.", linkedEntities: ["AUTH-88"] }),
  ],
  api_breaking_change: [
    () => ingestGithubEvent({ eventType: "push", repository: "backend/api", actor: "bob", title: "chore: remove deprecated /v1/users endpoint", ref: "main", url: "https://github.com/org/backend/commit/deadbeef" }),
    () => ingestLinearEvent({ action: "update", type: "Issue", identifier: "API-203", title: "Remove /v1/users — migrate consumers to /v2/users", state: "Done", assignee: "bob", project: "API Modernization" }),
    () => ingestSlackEvent({ eventType: "message", channel: "#api-consumers", user: "bob", text: "HEADS UP: /v1/users is now removed in main. If your service still calls it, you'll get 410 Gone. /v2/users is the replacement.", linkedEntities: ["API-203"] }),
    () => ingestSlackEvent({ eventType: "thread_reply", channel: "#api-consumers", user: "carol", text: "The data-pipeline service still hits /v1/users — I'll file a ticket.", threadTs: "1718001000.000200" }),
    () => ingestLinearEvent({ action: "create", type: "Issue", identifier: "DATA-77", title: "Migrate data-pipeline off /v1/users", state: "Todo", assignee: "carol", project: "API Modernization" }),
    () => ingestGithubEvent({ eventType: "issue", repository: "data/pipeline", actor: "carol", title: "Update user fetch to /v2/users — urgent", url: "https://github.com/org/data/issues/99" }),
  ],
  sprint_standup: [
    () => ingestSlackEvent({ eventType: "message", channel: "#standup", user: "alice", text: "Working on AUTH-88 today, PR is up, waiting for review. Blocked on bob's feedback." }),
    () => ingestSlackEvent({ eventType: "message", channel: "#standup", user: "bob", text: "Reviewing auth PR, also finishing up API-203 cleanup. Will review alice's PR this morning." }),
    () => ingestSlackEvent({ eventType: "message", channel: "#standup", user: "carol", text: "Starting DATA-77 migration. Should unblock the pipeline by EOD." }),
    () => ingestLinearEvent({ action: "update", type: "Issue", identifier: "INFRA-14", title: "Upgrade Postgres to 16.2", state: "In Review", assignee: "dave", project: "Infrastructure Q2" }),
    () => ingestSlackEvent({ eventType: "message", channel: "#standup", user: "dave", text: "INFRA-14 postgres upgrade tested in staging, promoting to prod tomorrow pending team +1." }),
  ],
  hotfix_deploy: [
    () => ingestGithubEvent({ eventType: "push", repository: "backend/api", actor: "dave", title: "hotfix: fix null dereference in session handler", ref: "hotfix/session-null", url: "https://github.com/org/backend/commit/hotfix001" }),
    () => ingestSlackEvent({ eventType: "mention", channel: "#incidents", user: "dave", text: "P0 hotfix deployed to prod — null dereference in session.getUser() was causing 500s on /api/me. Monitor error rates. @alice @oncall", linkedEntities: ["INC-007"] }),
    () => ingestLinearEvent({ action: "create", type: "Issue", identifier: "INC-007", title: "P0: 500 errors on /api/me due to session null dereference", state: "Done", assignee: "dave", project: "Incidents" }),
    () => ingestGithubEvent({ eventType: "pull_request", repository: "backend/api", actor: "dave", title: "hotfix: add null guard to session.getUser() — cherry-pick to stable", ref: "hotfix/session-null", url: "https://github.com/org/backend/pull/422" }),
    () => ingestSlackEvent({ eventType: "thread_reply", channel: "#incidents", user: "alice", text: "Error rate back to baseline. Good catch dave.", threadTs: "1718002000.000300" }),
  ],
};

export function simulateScenario(scenario: Scenario, count: number): number {
  const templates: Array<() => void> = scenario === "all"
    ? Object.values(SCENARIO_TEMPLATES).flat()
    : (SCENARIO_TEMPLATES[scenario] ?? []);

  if (templates.length === 0) return 0;

  const toRun = templates.slice(0, Math.min(count, templates.length));
  let queued = 0;

  for (let i = 0; i < toRun.length; i++) {
    const fn = toRun[i];
    setTimeout(() => {
      try { fn(); } catch (err) { logger.error({ err }, "Simulation event failed"); }
    }, i * 200);
    queued++;
  }

  return queued;
}
