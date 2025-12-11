SUPABASE_MULTIUSER_REALTIME — Multi-user sync, change-tracking, and realtime notifications

## Overview

This document describes how to add safe, secure multi-user realtime features to the Map app using Supabase.

The goal: support multiple users working at the same time, keep authoritative change history for important entities, and publish realtime updates and presence so clients can stay in sync.

## High-level summary of approach

- Auth + RLS for secure per-user/organization access.
- Transactional DB triggers that populate an immutable event/audit table on INSERT/UPDATE/DELETE.
- Realtime Postgres changes (CDC) + Broadcast + Presence for subscriptions, ephemeral updates and presence tracking.
- Edge Functions / Background workers for external notification delivery and heavier processing.
- Optimistic concurrency control for conflict detection; optional locks only where necessary.

## Phase 1 (first implementation)

1. Add audit/event table and transactional triggers on important tables (markers, events, admin changes) to record before/after snapshots along with actor/trace metadata.
2. Add created_by/updated_by/row_version/updated_at columns to those tables, and backfill data safely.
3. Add tests to validate triggers, auditing, and schema changes.
4. Configure Realtime subscriptions for the event/audit tables (read-only subscriptions to start).

## Key components and design notes

- Event table schema (recommended):
  - id uuid PRIMARY KEY
  - entity_type text
  - entity_id uuid
  - operation text (INSERT/UPDATE/DELETE)
  - actor_id uuid (user id)
  - timestamp timestamptz
  - before jsonb
  - after jsonb
  - metadata jsonb (source, trace_id)

- Triggers must write event rows in the same transaction so event storage is ACID-consistent.
- Use row_version (integer) on frequently-updated rows to detect conflicts for optimistic concurrency.
- Keep sensitive fields out of broadcast payloads or redact them in triggers/Edge Functions.

## Realtime & subscription patterns

- Subscribe clients to topics scoped by organization and resource to avoid over-broadcasting.
- Use Postgres Changes subscriptions for authoritative updates and Broadcast channels for ephemeral data like cursors or typing states.
- Use Presence channels for tracking online users / editing participants.

## Security & RLS

- Use Supabase Auth JWT claims in RLS policies to restrict row visibility and control channel subscriptions.
- Keep `anon` keys limited in scope and do not grant server-only operations to client tokens.

## Operational & scaling guidance

- Monitor WAL sizes and replication slots when using CDC or replication.
- Implement notification throttling and batching to protect Realtime workloads and reduce costs.
- Add metrics for Realtime latency, event rates, and channel count.

## Testing and rollout

- Stage phase 1 on a dev Supabase project, run backfills, add tests and observability.
- Roll out triggers and event table in safe steps (create table -> triggers -> backfill -> publish client updates).

## Next steps (per your request)

1. Repo audit — check what migrations, database triggers, and supabase client code currently exist.
2. Produce a concrete, low-risk Phase 1 change plan (migrations & tests) based on the repo state.
3. After you review & approve, implement Phase 1 in small steps with tests and CI verification.

## Notes

This document is intentionally technology-agnostic to allow small, incremental changes to the codebase and DB. It avoids concrete SQL statements or app code until we agree on the exact schema & tests for the project.

---

File created by GitHub Copilot (assistance) during planning stage — please review and request edits before any implementation changes are made to production systems.
