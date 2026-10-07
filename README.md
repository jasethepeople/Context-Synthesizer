# Context-Synthesizer

A dashboard prototype for synthesizing developer context: it ingests GitHub, Slack, and Linear webhook events, then builds "context deltas" for deep-work focus sessions and renders an epistemic event graph. Built as a Replit export.

## Features

- **Mission control** — live ingestion stats, recent events, and current focus session (auto-refreshing).
- **Context delta** — per-session summary of incoming events with an adjustable compression slider; regenerates when a focus session ends.
- **Epistemic graph** — graph snapshot and drift metrics over ingested events.
- **Reverse query** — natural-language query against the stored event window.
- **Ingestion lab** — simulate bursts of cross-platform events for demos (`simulateEvents` is explicitly marked demo-only in the API spec).
- **Webhooks** — ingest endpoints for GitHub, Slack, and Linear events.
- **Focus sessions** — start/end deep-work focus blocks tied to a user.

## Tech stack

- Monorepo: pnpm workspaces, TypeScript 5.9, Node.js 24.
- API server: Express 5, PostgreSQL + Drizzle ORM, Zod validation (`zod/v4`), Orval codegen from `lib/api-spec/openapi.yaml` (React Query hooks + Zod schemas regenerated, not hand-edited).
- Dashboard (`artifacts/adws`): React, Vite, Wouter, TanStack Query, shadcn/ui, dark theme forced on.
- API contracts: `lib/api-spec/openapi.yaml` is the source of truth; clients generated into `lib/api-client-react` and `lib/api-zod`.
- Database schema: `lib/db/src/schema/`.

## Getting started

Per `replit.md` (run commands; product/architecture sections of that doc are unfilled template text):

```bash
pnpm install
pnpm --filter @workspace/api-server run dev     # API server (port 5000)
pnpm run typecheck                               # full typecheck
pnpm run build                                   # typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen   # regenerate API clients from the OpenAPI spec
pnpm --filter @workspace/db run push            # push DB schema (dev only)
```

Required env: `DATABASE_URL` (Postgres connection string).

## Project structure

```
├── artifacts/
│   ├── adws/            # main dashboard (pages: mission-control, delta, graph,
│   │                    # query, ingest)
│   ├── adws-video/      # second dashboard artifact
│   ├── api-server/      # Express API (routes: ingestion, session, delta, graph,
│   │                    # webhooks, sse, health)
│   └── mockup-sandbox/  # UI mockup sandbox
├── lib/
│   ├── api-spec/        # openapi.yaml — the API source of truth
│   ├── api-client-react/# Orval-generated React Query hooks
│   ├── api-zod/         # Orval-generated Zod schemas
│   └── db/              # Drizzle schema + config
├── scripts/             # helper scripts
├── .replit              # Replit pnpm-workspace config
└── replit.md            # run commands; product/architecture sections are template stubs
```

## Status

**Demo/prototype.** The core loop works against real webhook endpoints, but the product description in `replit.md` is unwritten template text and event simulation is explicitly demo-only. Exported from https://replit.com/@realjasontclark/Context-Synthesizer.
