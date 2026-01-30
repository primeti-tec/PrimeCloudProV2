# Performance Optimizer Agent Playbook (PrimeCloudProV2)

## Mission & Success Criteria

### Mission
Improve end-to-end performance (latency, throughput, resource usage, UI responsiveness) by:
- **Measuring first**, then optimizing the **highest-impact bottlenecks**.
- Delivering changes that are **safe**, **observable**, and **regression-resistant**.

### Success criteria (use as acceptance checks)
- Server: reduced p95/p99 latency for slow endpoints and reduced CPU/memory spikes under realistic load.
- Client: improved Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and reduced bundle size / unnecessary re-renders.
- No functional regressions: tests (existing + added) pass; monitoring/metrics show improvement.

---

## Scope: What to Focus On in This Codebase

### Highest-leverage areas (based on repository structure)
1. **Server service layer (business logic + external calls)**
   - `server/services/*.ts`
   - Especially:
     - `server/services/minio.service.ts` — object storage operations; likely I/O heavy, list operations, metrics aggregation, lifecycle/quota queries.
     - `server/services/sftpgo.service.ts` — remote API interactions; availability checks; user provisioning flows.
     - `server/services/billing.service.ts` — usage summaries/invoice data aggregation (often computational + I/O).
     - `server/services/audit.service.ts` — write-heavy logging/recording; risk of synchronous overhead.
     - `server/services/notification.service.ts` — fan-out/dispatch patterns; can introduce latency if synchronous.

2. **Client pages & data fetching**
   - `client/src/pages/*` — page-level rendering, data fetching, and UI composition.
   - `client/src/lib/queryClient.ts` (`apiRequest`) — centralized fetch behavior; caching, retries, request dedupe, serialization.
   - `client/src/lib/utils.ts` (`cn`) — typically minor, but can affect render perf if misused in hot paths.

3. **Cross-cutting utilities**
   - `server/lib/*` and `client/src/lib/*` — shared validation/formatting; usually not dominant, but can matter if run at high volume.

4. **E2E / smoke tests**
   - `testsprite_tests/*` — validate changes don’t break flows; extend with perf-oriented checks where feasible.

---

## Key Files & Their Purposes (Optimization Hotspots)

### Server
- `server/services/minio.service.ts`
  - Defines `MinioService`, config types (`MinioConfig`, `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`)
  - Common perf risks: repeated list calls, per-object stats loops, missing pagination, sequential awaits, lack of caching for immutable-ish data.

- `server/services/sftpgo.service.ts`
  - `SftpGoService`, config & user/filesystem models; includes `checkSftpGoAvailability`, `generateSecurePassword`
  - Perf risks: network calls not batched, retries/backoff missing, unbounded concurrency, slow availability checks on critical paths.

- `server/services/billing.service.ts`
  - `BillingService` with `PricingConfig`, `UsageSummary`, `InvoiceData`
  - Perf risks: aggregations over large datasets, repeated reads, expensive computations not memoized, sequential API calls.

- `server/services/audit.service.ts`
  - `AuditService`, `AuditDetails`, `AuditLogPayload`
  - Perf risks: synchronous logging on request path; large payload serialization; unindexed queries (if DB-backed elsewhere).

- `server/services/notification.service.ts`
  - `NotificationService`, `NotificationType`, `NotificationPayload`
  - Perf risks: synchronous fan-out, per-recipient blocking calls, lack of queueing/batching.

- `server/services/domain-service.ts`
  - Domain verification flows; token generation and checks
  - Perf risks: repeated DNS/network verification, lack of caching, blocking verification in request path.

### Client
- `client/src/lib/queryClient.ts`
  - `apiRequest` centralized request path
  - Perf risks: no caching/dedup, large JSON parsing on main thread, excessive retries, missing aborts.

- `client/src/pages/*`
  - Data fetching patterns, component render patterns
  - Perf risks: waterfall requests, large component trees, missing memoization, expensive derived computations in render.

### Tests
- `testsprite_tests/*`
  - Python-based automation; can be used to detect regressions and add coarse timing assertions for critical flows.

---

## Operating Principles (House Rules for Performance Work)

1. **Measure before changing**
   - Produce a baseline: which endpoint/page is slow, at what percentile, and why (CPU vs I/O vs lock contention vs render).

2. **Optimize the critical path**
   - Prioritize improvements that reduce user-facing latency: request handling, external calls, serialization, and UI render/paint.

3. **Prefer algorithmic wins over micro-optimizations**
   - Reduce number of remote calls, reduce data volume, parallelize safely, cache appropriately.

4. **Keep changes localized**
   - Start in service classes (`MinioService`, `SftpGoService`, etc.) and `apiRequest` before broad refactors.

5. **Make improvements observable**
   - Add timing logs/metrics around high-latency operations (and remove/guard them once stable if needed).

---

## Workflow 1: Server-Side Bottleneck Investigation & Fix

### Step 1 — Identify the slow operation
Common suspects in this repo:
- Storage operations (MinIO): list/stat loops, usage metrics.
- SFTPGo operations: network availability checks, user provisioning workflows.
- Billing: usage aggregation.

**Checklist**
- What is slow: specific endpoint/service method?
- How often is it called (frequency)?
- Is it I/O bound (remote calls) or CPU bound (computation/serialization)?
- Is it on the request path, startup, or background?

### Step 2 — Instrument minimal timing around service calls
Add lightweight instrumentation at service boundaries:
- Around external calls (MinIO/SFTPGo/DNS) and around aggregation loops.

**Pattern**
- Use high-resolution timing (`process.hrtime.bigint()` in Node) and log structured events with method name + duration.
- Add correlation identifiers if available (request ID).

### Step 3 — Fix patterns commonly found in service classes

#### A) Replace sequential awaits with controlled concurrency
**When**
- You see loops like `for (...) { await client.call(...) }`.

**Action**
- Use `Promise.all` for small sets or a concurrency limiter for large sets.

**Guardrails**
- Never unleash unbounded concurrency against MinIO/SFTPGo; cap concurrency (e.g., 5–20) depending on environment.

#### B) Reduce round trips via batching and pagination
**When**
- Listing objects/buckets without pagination, or fetching per-object stats.

**Action**
- Paginate results; short-circuit once you have enough data.
- If you need totals, prefer server-side aggregations if MinIO API supports it; otherwise stream and aggregate without retaining everything in memory.

#### C) Cache stable configuration and “rarely changing” lookups
**Where**
- `getMinioConfig` and SFTPGo config retrieval (`getSftpGoConfig`)
- Domain verification results (short TTL)

**Action**
- Add in-memory caching with TTL and explicit invalidation hooks (if config can change).
- Ensure caching is **per-process** (acceptable for stateless services) and does not leak secrets into logs.

#### D) Avoid blocking work on request path
**Targets**
- Audit logging (`AuditService`)
- Notifications (`NotificationService`)
- Domain ownership verification

**Action**
- Move non-critical work to background/async dispatch (e.g., fire-and-forget with bounded queue).
- If you must await, ensure it’s not serializing a big payload or doing synchronous file/network work.

#### E) Reduce payload sizes and serialization costs
**Action**
- Don’t return large object listings if only summary needed.
- Prefer streaming for large datasets.
- Avoid deep cloning and repeated JSON stringify/parse of big objects.

### Step 4 — Validate with targeted tests and a micro-benchmark
- Add/extend a test that covers the optimized path.
- Run a quick benchmark script (even a simple Node script calling the method in a loop with mocked clients).

**Regression checks**
- Correctness (same output)
- Error handling (timeouts, partial failures)
- Resource usage (memory stable; no descriptor leaks)

---

## Workflow 2: MinIO Performance Playbook (`server/services/minio.service.ts`)

### Common bottleneck patterns to hunt
- Repeated client initialization instead of reuse (`initializeMinioClient` usage)
- Object stats computed by calling `statObject` for every object
- Listing all objects to compute totals without streaming/pagination
- Recomputing `UsageMetrics` frequently without caching

### Optimization steps
1. **Ensure MinIO client is reused**
   - If the service creates clients repeatedly, refactor to create once and reuse per `MinioService` instance.

2. **Prefer streaming aggregation**
   - When computing `UsageMetrics`/`ObjectStats`, stream results and aggregate incrementally.
   - Avoid storing full object lists in memory.

3. **Introduce TTL caching for expensive metrics**
   - Cache usage metrics for a short period (e.g., 30–120s) if eventual consistency is acceptable for UI.
   - Make TTL configurable (env/config).

4. **Add pagination controls**
   - If list calls can be bounded (prefix, max keys), surface parameters in service methods.
   - On UI, request “pages” rather than “everything”.

5. **Concurrency limiting**
   - If per-object calls are unavoidable, use a pool limit and measure throughput vs. error rates.

### Safety checklist
- Handle partial failures: timeouts from MinIO should not crash entire aggregation unless required.
- Ensure lifecycle/quota rules operations remain consistent (don’t cache writes).
- Avoid leaking credentials in logs.

---

## Workflow 3: SFTPGo Performance Playbook (`server/services/sftpgo.service.ts`)

### Common bottleneck patterns
- Availability checks on critical paths (e.g., every request)
- Multiple network calls during provisioning done sequentially
- No timeouts; requests hang

### Optimization steps
1. **Cache availability checks**
   - Cache result of `checkSftpGoAvailability` for short TTL (e.g., 5–30s).
   - Use stale-while-revalidate: serve cached status, refresh in background.

2. **Add timeouts + retry/backoff**
   - Ensure each external call has a timeout.
   - Use small bounded retries with exponential backoff for transient failures.

3. **Parallelize independent provisioning calls**
   - If creating user + folders + permissions are independent, parallelize with concurrency caps.

4. **Avoid heavy crypto in hot paths**
   - `generateSecurePassword` is fine, but ensure it isn’t called repeatedly unnecessarily (e.g., on reads).

---

## Workflow 4: Billing/Audit/Notification Performance

### Billing (`server/services/billing.service.ts`)
- Cache pricing config (`PricingConfig`) if static.
- If `UsageSummary` aggregates from multiple sources, parallelize independent fetches.
- Avoid recalculating invoices repeatedly for the same period; cache by (customer, period) with invalidation on new usage.

### Audit (`server/services/audit.service.ts`)
- Ensure audit writes are asynchronous and batched if high volume.
- Keep payload small; store references/IDs rather than full objects where possible.
- If audit calls are on every request, treat it as part of the critical path and measure.

### Notification (`server/services/notification.service.ts`)
- Batch notifications if multiple events trigger per action.
- Prefer queueing/outbox pattern if notifications go to external providers.
- Add deduplication for repeated same-event notifications in short windows.

---

## Workflow 5: Client Performance (Pages + `apiRequest`)

### Step 1 — Diagnose page slowness
- Identify heavy pages under `client/src/pages`.
- Determine if the issue is:
  - network waterfall
  - over-fetching
  - large payload
  - excessive re-rendering

### Step 2 — Optimize `apiRequest` (`client/src/lib/queryClient.ts`)
Targets:
- **Request dedupe**: avoid multiple identical in-flight calls.
- **Caching**: leverage query library behavior (if present) or implement lightweight memoization where appropriate.
- **Abort controllers**: cancel in-flight requests on navigation to prevent wasted work.
- **JSON parsing**: avoid parsing huge payloads repeatedly; ensure the server can send only needed fields.

### Step 3 — Page-level best practices
- Fetch in parallel when possible (avoid waterfalls).
- Avoid deriving expensive computed data inside render; memoize.
- Split large components; lazy-load non-critical sections.
- Keep lists virtualized if rendering many rows/items.

### Step 4 — Validate improvements
- Compare before/after:
  - bundle size (if tooling exists)
  - render count (React dev tools if applicable)
  - network request count and payload sizes

---

## Performance Checklist (Quick Triage)

### Server
- [ ] Any loop with `await` inside? Convert to parallel with limits.
- [ ] Any repeated remote call for stable data? Add TTL cache.
- [ ] Any large responses? Add pagination/filters.
- [ ] Any blocking audit/notification work? Offload/batch.
- [ ] Timeouts set for all external calls?
- [ ] Logs: structured and not too verbose in hot paths.

### Client
- [ ] Repeated identical API calls? Deduplicate/cache.
- [ ] Waterfall requests? Parallelize.
- [ ] Over-fetching? Request fewer fields / add server endpoints for summaries.
- [ ] Large lists? Virtualize.
- [ ] Heavy computations in render? Memoize.

---

## Codebase Conventions to Follow (Derived from Structure/Exports)

- Business logic is centralized in **service classes** under `server/services`. Prefer adding optimization hooks there (caching, concurrency control, retries).
- Shared helpers exist in `server/lib` and `client/src/lib`. If adding caching, concurrency utilities, or timing helpers, place them in the appropriate `lib` folder and reuse across services.
- Types/interfaces are defined near the services (e.g., `MinioConfig`, `UsageMetrics`): keep new performance-related types close to the domain service that uses them.

---

## Recommended Additions (Low-Risk Improvements)

1. **A small shared “performance utils” module**
   - Server: `server/lib/perf.ts` with:
     - `timeAsync(label, fn)` helper
     - `withTimeout(promise, ms)`
     - `createTtlCache<K,V>(ttlMs)`
     - optional `limitConcurrency(n)` helper

2. **Service-level caching and concurrency knobs**
   - Configurable via env variables (TTL durations, concurrency limits).
   - Defaults conservative.

3. **Perf regression guardrails**
   - Add a basic performance smoke test for the most critical service methods (even coarse thresholds).
   - Track counts of external calls in tests via mocks.

---

## Deliverable Template (What This Agent Should Produce per Task)

For each optimization PR/change set:
1. **Baseline measurement**
   - Endpoint/method affected
   - Before: p50/p95 (or runtime in ms), payload sizes, number of external calls

2. **Root cause**
   - e.g., “N+1 MinIO `statObject` calls”, “sequential SFTPGo provisioning”, “request waterfall in page X”

3. **Change summary**
   - What changed in which files (explicit paths)

4. **After measurement**
   - Same metrics, same scenario

5. **Risk assessment**
   - Caching staleness risk, concurrency risk, failure mode changes

6. **Test coverage**
   - Which tests added/updated, and how to run them

---

## Primary Target Map (Start Here)

1. `server/services/minio.service.ts` — reduce I/O and memory; add caching + streaming aggregation + concurrency limits.
2. `server/services/sftpgo.service.ts` — cache availability; parallelize provisioning; add timeouts.
3. `client/src/lib/queryClient.ts` — dedupe/caching/abort and payload reduction patterns.
4. `client/src/pages/*` — remove waterfalls; memoize; lazy-load.
5. `server/services/audit.service.ts` + `server/services/notification.service.ts` — move off critical path; batch.

---

## “Do Not Do” List (Common Perf Anti-Patterns)

- Don’t add caching without TTL/invalidation strategy.
- Don’t increase concurrency without caps and measurement (risk: rate limits, memory spikes).
- Don’t log large payloads or per-item logs in tight loops.
- Don’t fetch entire bucket/object lists for UI summaries; add summary endpoints or paginated queries instead.
- Don’t optimize blindly—always attach before/after numbers.
