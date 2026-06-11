import { randomUUID } from "crypto";
import OpenAI from "openai";
import { graph } from "./graph";
import { logger } from "./logger";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DeltaOutputSchema = {
  name: "context_delta",
  strict: true,
  schema: {
    type: "object",
    properties: {
      tier1: {
        type: "object",
        properties: {
          label: { type: "string" },
          urgencyScore: { type: "number" },
          hasBlockers: { type: "boolean" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                sourceEventIds: { type: "array", items: { type: "string" } },
                affectedNodes: { type: "array", items: { type: "string" } },
                sourceUrls: { type: "array", items: { type: "string" } },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                tier: { type: "number", enum: [1] },
              },
              required: ["id", "content", "sourceEventIds", "affectedNodes", "sourceUrls", "severity", "tier"],
              additionalProperties: false,
            },
          },
        },
        required: ["label", "urgencyScore", "hasBlockers", "items"],
        additionalProperties: false,
      },
      tier2: {
        type: "object",
        properties: {
          label: { type: "string" },
          impactScore: { type: "number" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                sourceEventIds: { type: "array", items: { type: "string" } },
                affectedNodes: { type: "array", items: { type: "string" } },
                sourceUrls: { type: "array", items: { type: "string" } },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                tier: { type: "number", enum: [2] },
              },
              required: ["id", "content", "sourceEventIds", "affectedNodes", "sourceUrls", "severity", "tier"],
              additionalProperties: false,
            },
          },
        },
        required: ["label", "impactScore", "items"],
        additionalProperties: false,
      },
      tier3: {
        type: "object",
        properties: {
          label: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                sourceEventIds: { type: "array", items: { type: "string" } },
                affectedNodes: { type: "array", items: { type: "string" } },
                sourceUrls: { type: "array", items: { type: "string" } },
                severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                tier: { type: "number", enum: [3] },
              },
              required: ["id", "content", "sourceEventIds", "affectedNodes", "sourceUrls", "severity", "tier"],
              additionalProperties: false,
            },
          },
          semanticMap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                actors: { type: "array", items: { type: "string" } },
                eventCount: { type: "number" },
                summary: { type: "string" },
              },
              required: ["topic", "actors", "eventCount", "summary"],
              additionalProperties: false,
            },
          },
        },
        required: ["label", "items", "semanticMap"],
        additionalProperties: false,
      },
      topEntities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
            label: { type: "string" },
            type: { type: "string" },
            mentionCount: { type: "number" },
          },
          required: ["nodeId", "label", "type", "mentionCount"],
          additionalProperties: false,
        },
      },
    },
    required: ["tier1", "tier2", "tier3", "topEntities"],
    additionalProperties: false,
  },
} as const;

function compressionInstruction(c: number): string {
  if (c >= 0.9) return "Output is HYPER-TECHNICAL: use raw technical identifiers, API diffs, exact PR numbers, branch names, commit hashes, decision rationale verbatim. No prose. Dense bulleted lists. Every item should be the equivalent of a terse engineering note.";
  if (c >= 0.7) return "Output is TECHNICAL: use technical terminology, exact identifiers, concise bullet points. Minimal prose. Focused on engineering facts.";
  if (c >= 0.4) return "Output is BALANCED: mix of technical context and plain explanation. Bullet points with brief clarifying sentences.";
  if (c >= 0.2) return "Output is ACCESSIBLE: clear language, minimal jargon. Each point should be understandable to a non-specialist with engineering context.";
  return "Output is EXECUTIVE PROSE: flowing narrative paragraphs. No bullet points for tier items. Explain impact in business and human terms. Scannable in 30 seconds.";
}

interface SessionContext {
  focusLabel?: string;
  activeCodePaths?: string[];
  activeTaskIds?: string[];
  durationMinutes?: number;
}

export async function generateDelta(
  windowMinutes: number,
  compressionLevel: number,
  sessionCtx?: SessionContext
): Promise<{
  tier1: unknown;
  tier2: unknown;
  tier3: unknown;
  topEntities: unknown[];
}> {
  const events = graph.getEventsInWindow(windowMinutes);

  if (events.length === 0) {
    return buildEmptyDelta();
  }

  const eventDigest = events.slice(0, 60).map((e) => ({
    id: e.id,
    source: e.source,
    type: e.eventType,
    actor: e.actor,
    summary: e.summary,
    ts: e.timestamp,
    deduplicated: e.deduplicated,
    linkedNodes: e.linkedNodeIds.slice(0, 3),
    urls: e.raw.url ? [String(e.raw.url)] : [],
  }));

  const nodeDigest = [...graph.nodes.values()].slice(0, 40).map((n) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    eventCount: n.eventCount,
  }));

  const systemPrompt = `You are the ADWS Context Delta Engine. Your role is to synthesize raw organizational activity events into a structured, tiered context delta for a software engineer returning from a deep-work focus block.

${compressionInstruction(compressionLevel)}

Session context: ${sessionCtx?.focusLabel ? `User was working on: "${sessionCtx.focusLabel}"` : "No focus label provided."}
${sessionCtx?.activeCodePaths?.length ? `Active code paths: ${sessionCtx.activeCodePaths.join(", ")}` : ""}
${sessionCtx?.activeTaskIds?.length ? `Active task IDs: ${sessionCtx.activeTaskIds.join(", ")}` : ""}

THREE-TIER CLASSIFICATION:
- Tier 1 ACTIONABLE BLOCKERS: Changes that DIRECTLY invalidate the user's current work — PR merge conflicts, API breaking changes on active code paths, PR review requests addressed to user, task state changes on user's active tasks, security/hotfix deploys touching user's modules. Urgency score 0.0–1.0.
- Tier 2 ALIGNMENT SHIFTS: Architecture decisions, API contract changes, timeline changes, team consensus decisions, design pivots that affect the user's domain but don't block current code. Impact score 0.0–1.0.
- Tier 3 PASSIVE LANDSCAPE: General org velocity — who did what, sprint progress, routine merges, non-critical updates. Group into semantic clusters by topic.

RULES:
- Each item gets a unique ID (use the provided event IDs where possible).
- sourceEventIds must list actual event IDs from the input.
- affectedNodes must list actual node IDs from the input.
- sourceUrls must be actual URLs from event data (empty array if none).
- severity: critical (production incidents, data loss), high (breaking changes, blockers), medium (alignment shifts), low (general updates), info (passive).
- Do not fabricate event IDs, node IDs, or URLs not present in the input.
- topEntities: rank the top 5 most-mentioned/most-connected entities from the events.`;

  const userPrompt = `Events in the last ${windowMinutes} minutes (${events.length} total, showing up to 60):
${JSON.stringify(eventDigest, null, 2)}

Known graph nodes (up to 40):
${JSON.stringify(nodeDigest, null, 2)}

Generate the context delta JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: DeltaOutputSchema,
      },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty LLM response");
    const parsed = JSON.parse(raw) as {
      tier1: unknown;
      tier2: unknown;
      tier3: unknown;
      topEntities: unknown[];
    };
    return parsed;
  } catch (err) {
    logger.error({ err }, "Delta LLM call failed — using fallback heuristic delta");
    return buildHeuristicDelta(events);
  }
}

function buildEmptyDelta() {
  return {
    tier1: { label: "Actionable Blockers", urgencyScore: 0, hasBlockers: false, items: [] },
    tier2: { label: "Alignment Shifts", impactScore: 0, items: [] },
    tier3: { label: "Passive Landscape", items: [], semanticMap: [] },
    topEntities: [],
  };
}

function buildHeuristicDelta(events: Array<{ id: string; source: string; summary: string; actor: string; linkedNodeIds: string[]; raw: Record<string, unknown> }>) {
  const t1Items = events
    .filter((e) => {
      const s = e.summary.toLowerCase();
      return s.includes("hotfix") || s.includes("breaking") || s.includes("p0") || s.includes("incident") || s.includes("auth");
    })
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      content: e.summary,
      sourceEventIds: [e.id],
      affectedNodes: e.linkedNodeIds.slice(0, 2),
      sourceUrls: e.raw.url ? [String(e.raw.url)] : [],
      severity: "high" as const,
      tier: 1 as const,
    }));

  const t2Items = events
    .filter((e) => {
      const s = e.summary.toLowerCase();
      return s.includes("decision") || s.includes("decided") || s.includes("api") || s.includes("migrate");
    })
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      content: e.summary,
      sourceEventIds: [e.id],
      affectedNodes: e.linkedNodeIds.slice(0, 2),
      sourceUrls: [],
      severity: "medium" as const,
      tier: 2 as const,
    }));

  const t3Items = events
    .filter((e) => !t1Items.find((i) => i.id === e.id) && !t2Items.find((i) => i.id === e.id))
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      content: e.summary,
      sourceEventIds: [e.id],
      affectedNodes: e.linkedNodeIds.slice(0, 1),
      sourceUrls: [],
      severity: "info" as const,
      tier: 3 as const,
    }));

  const actors = [...new Set(events.map((e) => e.actor))];
  const semanticMap = [
    { topic: "Recent Activity", actors: actors.slice(0, 4), eventCount: events.length, summary: `${events.length} events from ${actors.length} contributors across GitHub, Slack, and Linear.` },
  ];

  const entityCounts = new Map<string, number>();
  for (const e of events) {
    for (const nid of e.linkedNodeIds) {
      entityCounts.set(nid, (entityCounts.get(nid) ?? 0) + 1);
    }
  }
  const topEntities = [...entityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nodeId, mentionCount]) => {
      const node = graph.nodes.get(nodeId);
      return { nodeId, label: node?.label ?? nodeId, type: node?.type ?? "unknown", mentionCount };
    });

  return {
    tier1: { label: "Actionable Blockers", urgencyScore: t1Items.length > 0 ? 0.7 : 0, hasBlockers: t1Items.length > 0, items: t1Items },
    tier2: { label: "Alignment Shifts", impactScore: t2Items.length > 0 ? 0.5 : 0, items: t2Items },
    tier3: { label: "Passive Landscape", items: t3Items, semanticMap },
    topEntities,
  };
}

export async function runReverseQuery(
  queryText: string,
  windowMinutes: number,
  compressionLevel: number
): Promise<{
  answer: string;
  confidence: number;
  relevantEventIds: string[];
  relevantNodeIds: string[];
  semanticSimilarityScores: Array<{ eventId: string; score: number }>;
  sourceLinks: string[];
  processingMs: number;
}> {
  const start = Date.now();
  const events = graph.getEventsInWindow(windowMinutes);
  const semanticResults = graph.semanticSearch(queryText, 10);

  const relevantNodeIds = semanticResults.map((r) => r.node.id);
  const semanticSimilarityScores: Array<{ eventId: string; score: number }> = [];

  const eventDigest = events.slice(0, 50).map((e) => {
    const nodeOverlap = e.linkedNodeIds.filter((nid) => relevantNodeIds.includes(nid)).length;
    const score = nodeOverlap * 0.3;
    semanticSimilarityScores.push({ eventId: e.id, score: Math.round(score * 100) / 100 });
    return {
      id: e.id,
      source: e.source,
      summary: e.summary,
      actor: e.actor,
      ts: e.timestamp,
      url: e.raw.url ?? null,
      relevanceScore: score,
    };
  });

  eventDigest.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topEvents = eventDigest.slice(0, 20);

  const systemPrompt = `You are the ADWS Reverse Query Engine. A software engineer is asking a targeted question about what happened during their offline/focus window. Answer it precisely using only the provided event data. Do not fabricate information not present in the events.

${compressionInstruction(compressionLevel)}

Your answer must:
1. Directly answer the question (yes/no if applicable, then detail)
2. Cite specific events, people, and decisions from the data
3. Include relevant links from event metadata when available
4. State confidence (0.0–1.0) based on how much evidence supports the answer
5. If no relevant events found, say so clearly

Respond as JSON: { "answer": "...", "confidence": 0.0-1.0, "relevantEventIds": ["..."], "sourceLinks": ["..."] }`;

  const userPrompt = `Query: "${queryText}"
Window: last ${windowMinutes} minutes

Top events by relevance:
${JSON.stringify(topEvents, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      answer?: string;
      confidence?: number;
      relevantEventIds?: string[];
      sourceLinks?: string[];
    };

    return {
      answer: parsed.answer ?? "No answer generated.",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      relevantEventIds: parsed.relevantEventIds ?? [],
      relevantNodeIds,
      semanticSimilarityScores,
      sourceLinks: parsed.sourceLinks ?? [],
      processingMs: Date.now() - start,
    };
  } catch (err) {
    logger.error({ err }, "Reverse query LLM call failed");
    const fallbackEvents = topEvents.slice(0, 3);
    return {
      answer: fallbackEvents.length > 0
        ? `Based on ${events.length} events in the last ${windowMinutes} minutes, the most relevant activity was: ${fallbackEvents.map((e) => e.summary).join("; ")}. LLM analysis unavailable.`
        : `No events found in the last ${windowMinutes} minutes matching your query.`,
      confidence: 0.3,
      relevantEventIds: fallbackEvents.map((e) => e.id),
      relevantNodeIds,
      semanticSimilarityScores,
      sourceLinks: [],
      processingMs: Date.now() - start,
    };
  }
}
