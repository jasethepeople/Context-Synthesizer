import { Router, type IRouter } from "express";
import { GetGraphNodeParams, ListGraphNodesQueryParams } from "@workspace/api-zod";
import { graph } from "../lib/graph";

const router: IRouter = Router();

router.get("/graph", async (_req, res): Promise<void> => {
  const nodes = [...graph.nodes.values()].map((n) => graph.nodeToApi(n));
  const edges = [...graph.edges.values()].map((e) => graph.edgeToApi(e));
  res.json({ nodes, edges, stats: graph.getGraphStats(), snapshotAt: new Date().toISOString() });
});

router.get("/graph/stats", async (_req, res): Promise<void> => {
  res.json(graph.getGraphStats());
});

router.get("/graph/nodes", async (req, res): Promise<void> => {
  const parsed = ListGraphNodesQueryParams.safeParse(req.query);
  const type = parsed.success ? (parsed.data.type ?? "all") : "all";
  const limit = parsed.success ? (parsed.data.limit ?? 100) : 100;

  let nodes = [...graph.nodes.values()];
  if (type !== "all") {
    nodes = nodes.filter((n) => n.type === type);
  }
  const sliced = nodes.slice(0, limit).map((n) => graph.nodeToApi(n));
  res.json({ nodes: sliced, total: nodes.length });
});

router.get("/graph/nodes/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGraphNodeParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const node = graph.nodes.get(params.data.id);
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  const inboundEdges = [...graph.edges.values()]
    .filter((e) => e.targetId === node.id)
    .map((e) => graph.edgeToApi(e));
  const outboundEdges = [...graph.edges.values()]
    .filter((e) => e.sourceId === node.id)
    .map((e) => graph.edgeToApi(e));

  const relatedEvents = graph.events
    .filter((e) => e.linkedNodeIds.includes(node.id))
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      source: e.source,
      eventType: e.eventType,
      actor: e.actor,
      summary: e.summary,
      linkedNodeIds: e.linkedNodeIds,
      timestamp: e.timestamp,
      deduplicated: e.deduplicated,
      deduplicationGroupId: e.deduplicationGroupId ?? null,
    }));

  const semanticNeighbors = graph
    .semanticNeighbors(node.id, 5)
    .map((r) => ({ node: graph.nodeToApi(r.node), similarityScore: r.similarityScore }));

  res.json({ node: graph.nodeToApi(node), inboundEdges, outboundEdges, relatedEvents, semanticNeighbors });
});

router.post("/graph/reset", async (_req, res): Promise<void> => {
  const result = graph.reset();
  res.json({ success: true, ...result });
});

export default router;
