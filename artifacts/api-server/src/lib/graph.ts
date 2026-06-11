import { randomUUID } from "crypto";
import { logger } from "./logger";

export type NodeType = "Person" | "CodeModule" | "Project" | "Task" | "Communication";
export type EdgeRelationship =
  | "authored"
  | "modified"
  | "referenced"
  | "assigned"
  | "blocked_by"
  | "depends_on"
  | "discussed_in"
  | "triggered"
  | "resolved";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  embedding: number[];
  eventCount: number;
  lastUpdated: string;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: EdgeRelationship;
  weight: number;
  eventId: string;
  createdAt: string;
}

export interface RawEvent {
  id: string;
  source: "github" | "slack" | "linear";
  eventType: string;
  actor: string;
  summary: string;
  linkedNodeIds: string[];
  timestamp: string;
  deduplicated: boolean;
  deduplicationGroupId: string | null;
  raw: Record<string, unknown>;
}

const EMBEDDING_DIM = 64;

function hashText(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const idx = (code * 31 + i) % EMBEDDING_DIM;
    vec[idx] += Math.sin(code * 0.1 + i) * 0.5 + 0.5;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb) || 1);
}

function l2norm(vec: number[]): number {
  return Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
}

class DeduplicationWindow {
  private window = new Map<string, { id: string; groupId: string; ts: number }>();
  private readonly windowMs: number;

  constructor(windowMs = 60_000) {
    this.windowMs = windowMs;
  }

  private fingerprint(source: string, type: string, actor: string, summary: string): string {
    const normalized = `${source}:${type}:${actor}:${summary.toLowerCase().replace(/\s+/g, " ").slice(0, 120)}`;
    let h = 5381;
    for (let i = 0; i < normalized.length; i++) {
      h = ((h << 5) + h) ^ normalized.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(16);
  }

  check(source: string, type: string, actor: string, summary: string): { isDuplicate: boolean; groupId: string } {
    const now = Date.now();
    for (const [fp, entry] of this.window.entries()) {
      if (now - entry.ts > this.windowMs) this.window.delete(fp);
    }
    const fp = this.fingerprint(source, type, actor, summary);
    const existing = this.window.get(fp);
    if (existing) {
      return { isDuplicate: true, groupId: existing.groupId };
    }
    const groupId = randomUUID();
    this.window.set(fp, { id: randomUUID(), groupId, ts: now });
    return { isDuplicate: false, groupId };
  }
}

interface PipelineStats {
  totalEventsIngested: number;
  deduplicatedCount: number;
  entitiesResolved: number;
  eventsPerSource: { github: number; slack: number; linear: number };
  processingRatePerMin: number;
  pipelineStatus: "idle" | "processing" | "backpressure";
  lastEventAt: string | null;
}

export class EpistemicGraph {
  readonly nodes = new Map<string, GraphNode>();
  readonly edges = new Map<string, GraphEdge>();
  readonly events: RawEvent[] = [];
  readonly dedup = new DeduplicationWindow(90_000);

  private stats: PipelineStats = {
    totalEventsIngested: 0,
    deduplicatedCount: 0,
    entitiesResolved: 0,
    eventsPerSource: { github: 0, slack: 0, linear: 0 },
    processingRatePerMin: 0,
    pipelineStatus: "idle",
    lastEventAt: null,
  };

  private recentTimestamps: number[] = [];
  private baselineNodeCount = 0;

  getStats(): PipelineStats {
    const now = Date.now();
    this.recentTimestamps = this.recentTimestamps.filter((t) => now - t < 60_000);
    this.stats.processingRatePerMin = this.recentTimestamps.length;
    const q = this.recentTimestamps.length;
    this.stats.pipelineStatus = q > 20 ? "backpressure" : q > 0 ? "processing" : "idle";
    return { ...this.stats };
  }

  setBaseline() {
    this.baselineNodeCount = this.nodes.size;
  }

  getContextDriftScore(): number {
    if (this.baselineNodeCount === 0 && this.nodes.size === 0) return 0;
    const newNodes = this.nodes.size - this.baselineNodeCount;
    const totalEdges = this.edges.size;
    const drift = Math.min(1, (newNodes * 0.05 + totalEdges * 0.002));
    return Math.round(drift * 100) / 100;
  }

  upsertNode(type: NodeType, label: string, properties: Record<string, unknown> = {}): { node: GraphNode; created: boolean } {
    const key = `${type}:${label.toLowerCase()}`;
    const existing = [...this.nodes.values()].find(
      (n) => n.type === type && n.label.toLowerCase() === label.toLowerCase()
    );
    if (existing) {
      existing.properties = { ...existing.properties, ...properties };
      existing.lastUpdated = new Date().toISOString();
      existing.eventCount++;
      existing.embedding = hashText(`${type} ${label} ${JSON.stringify(existing.properties)}`);
      return { node: existing, created: false };
    }
    const node: GraphNode = {
      id: randomUUID(),
      type,
      label,
      properties,
      embedding: hashText(`${type} ${label} ${JSON.stringify(properties)}`),
      eventCount: 1,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.nodes.set(node.id, node);
    this.stats.entitiesResolved++;
    logger.debug({ nodeId: node.id, type, label }, "Graph node created");
    return { node, created: true };
  }

  addEdge(sourceId: string, targetId: string, relationship: EdgeRelationship, eventId: string, weight = 0.8): GraphEdge {
    const existing = [...this.edges.values()].find(
      (e) => e.sourceId === sourceId && e.targetId === targetId && e.relationship === relationship
    );
    if (existing) {
      existing.weight = Math.min(1, existing.weight + 0.1);
      return existing;
    }
    const edge: GraphEdge = {
      id: randomUUID(),
      sourceId,
      targetId,
      relationship,
      weight,
      eventId,
      createdAt: new Date().toISOString(),
    };
    this.edges.set(edge.id, edge);
    return edge;
  }

  recordEvent(event: RawEvent) {
    this.events.unshift(event);
    if (this.events.length > 1000) this.events.splice(1000);
    this.stats.totalEventsIngested++;
    this.stats.eventsPerSource[event.source]++;
    this.stats.lastEventAt = event.timestamp;
    this.recentTimestamps.push(Date.now());
    if (event.deduplicated) this.stats.deduplicatedCount++;
  }

  getEventsInWindow(windowMinutes: number): RawEvent[] {
    const cutoff = Date.now() - windowMinutes * 60_000;
    return this.events.filter((e) => new Date(e.timestamp).getTime() > cutoff);
  }

  semanticSearch(queryText: string, topK = 10): Array<{ node: GraphNode; score: number }> {
    const queryVec = hashText(queryText);
    return [...this.nodes.values()]
      .map((node) => ({ node, score: cosineSimilarity(queryVec, node.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  semanticNeighbors(nodeId: string, topK = 5): Array<{ node: GraphNode; similarityScore: number }> {
    const target = this.nodes.get(nodeId);
    if (!target) return [];
    return [...this.nodes.values()]
      .filter((n) => n.id !== nodeId)
      .map((n) => ({ node: n, similarityScore: cosineSimilarity(target.embedding, n.embedding) }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);
  }

  getGraphStats() {
    const byType = { Person: 0, CodeModule: 0, Project: 0, Task: 0, Communication: 0 };
    for (const n of this.nodes.values()) byType[n.type]++;

    const edgeCountByNode = new Map<string, number>();
    for (const e of this.edges.values()) {
      edgeCountByNode.set(e.sourceId, (edgeCountByNode.get(e.sourceId) ?? 0) + 1);
      edgeCountByNode.set(e.targetId, (edgeCountByNode.get(e.targetId) ?? 0) + 1);
    }
    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.size;
    const avgEdges = totalNodes > 0 ? totalEdges / totalNodes : 0;
    const maxPossibleEdges = totalNodes > 1 ? (totalNodes * (totalNodes - 1)) / 2 : 1;
    const density = totalEdges / maxPossibleEdges;

    const topInfluencers = [...this.nodes.values()]
      .map((n) => ({ nodeId: n.id, label: n.label, edgeCount: edgeCountByNode.get(n.id) ?? 0 }))
      .sort((a, b) => b.edgeCount - a.edgeCount)
      .slice(0, 5);

    return {
      totalNodes,
      totalEdges,
      nodesByType: byType,
      avgEdgesPerNode: Math.round(avgEdges * 100) / 100,
      densityScore: Math.round(density * 1000) / 1000,
      contextDriftScore: this.getContextDriftScore(),
      topInfluencers,
      lastMutatedAt: this.stats.lastEventAt,
    };
  }

  nodeToApi(node: GraphNode) {
    return {
      id: node.id,
      type: node.type,
      label: node.label,
      properties: node.properties,
      vectorMagnitude: Math.round(l2norm(node.embedding) * 1000) / 1000,
      eventCount: node.eventCount,
      lastUpdated: node.lastUpdated,
      createdAt: node.createdAt,
    };
  }

  edgeToApi(edge: GraphEdge) {
    return {
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      relationship: edge.relationship,
      weight: edge.weight,
      eventId: edge.eventId,
      createdAt: edge.createdAt,
    };
  }

  reset() {
    const ns = this.nodes.size;
    const es = this.edges.size;
    const ev = this.events.length;
    this.nodes.clear();
    this.edges.clear();
    this.events.splice(0);
    this.stats = {
      totalEventsIngested: 0,
      deduplicatedCount: 0,
      entitiesResolved: 0,
      eventsPerSource: { github: 0, slack: 0, linear: 0 },
      processingRatePerMin: 0,
      pipelineStatus: "idle",
      lastEventAt: null,
    };
    this.recentTimestamps = [];
    this.baselineNodeCount = 0;
    logger.info({ ns, es, ev }, "Graph reset");
    return { nodesCleared: ns, edgesCleared: es, eventsCleared: ev };
  }
}

export const graph = new EpistemicGraph();
