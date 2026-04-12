/**
 * Evaluation Calibration Test
 *
 * Tests whether the AI evaluation correctly discriminates between
 * different quality levels of answers (20, 40, 60, 80, 100 points).
 *
 * For each category, uses 2 questions × 5 quality levels = 10 evaluations.
 * Total: 5 categories × 10 = 50 evaluations + 10 rubric generations = 60 API calls.
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/eval-calibration.ts
 *   npx tsx apps/api/src/scripts/eval-calibration.ts --save
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { buildSystemPrompt, buildUserMessage } from "../services/prompt-factory.js";
import { generateRubric } from "../services/rubric-generator.js";
import * as questions from "../data/questions.js";
import type { Question } from "../data/questions.js";
import type { Answer } from "../data/store.js";

const SAVE = process.argv.includes("--save");
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
const API_KEY = process.env.OPENAI_API_KEY ?? "";

if (!API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set");
  process.exit(1);
}

// ── Types ──

interface LevelAnswer {
  expected: number; // 20, 40, 60, 80, 100
  answer: Record<string, unknown>;
}

interface CalibrationCase {
  questionId: string;
  category: string;
  levels: LevelAnswer[];
}

// ══════════════════════════════════════════════════════════════════
//  CALIBRATION ANSWERS — 5 quality levels per question
// ══════════════════════════════════════════════════════════════════

const CASES: CalibrationCase[] = [
  // ── CODE REVIEW: cr_security_001 (SQL Injection) ──
  {
    questionId: "cr_security_001",
    category: "code_review",
    levels: [
      {
        expected: 20,
        answer: {
          diff: "see question",
          summary: "The code looks fine. It queries the database and returns results. Maybe add some comments for readability.",
          findings: ["Code could use better variable names"],
        },
      },
      {
        expected: 40,
        answer: {
          diff: "see question",
          summary: "There might be a security issue here. The query uses string interpolation which isn't ideal. Should use prepared statements instead.",
          findings: ["String interpolation in SQL query is not best practice"],
        },
      },
      {
        expected: 60,
        answer: {
          diff: "see question",
          summary: "SQL injection vulnerability. The user input q is directly interpolated into the SQL string using template literals, allowing attackers to inject malicious SQL. The limit parameter is also untrusted. Should use parameterized queries with $1, $2 placeholders.",
          findings: [
            "SQL injection via q parameter — directly interpolated into ILIKE clause",
            "limit parameter is also interpolated and could be exploited",
            "Should use parameterized queries ($1, $2) instead of template literals",
          ],
        },
      },
      {
        expected: 80,
        answer: {
          diff: "see question",
          summary: "Critical security regression: two SQL injection vectors. The q parameter is interpolated directly into the ILIKE clause — an attacker can escape the string and inject SQL. The limit parameter is also interpolated without validation. The original code used parameterized queries ($1, $2) and Math.min(parseInt(limit) || 20, 100) which bounded the input — this change removes all protection. The price column was also added to SELECT, potentially changing the API contract.",
          findings: [
            "SQL injection via q parameter — string interpolation into ILIKE allows arbitrary SQL injection",
            "SQL injection via limit parameter — no validation, no parseInt, no cap",
            "Regression: original used parameterized queries ($1, $2) and parseInt/Math.min for limit",
            "API contract change: price column added to SELECT without discussion",
          ],
        },
      },
      {
        expected: 100,
        answer: {
          diff: "see question",
          summary: "Critical security regression. Two SQL injection vectors introduced: (1) The q parameter is interpolated directly into the ILIKE clause — an attacker can close the string and inject SQL, e.g., q=\"%'; DROP TABLE products; --\". (2) The limit parameter is also interpolated raw, allowing injection of arbitrary SQL clauses. The original code used parameterized placeholders ($1, $2) and bounded the limit with Math.min(parseInt(limit) || 20, 100), all of which are removed. Additionally, the price column was added to the SELECT, potentially exposing data that was intentionally hidden from the API response. Fix: restore parameterized queries, validate and cap limit server-side, and confirm whether price should be in the API response.",
          findings: [
            "SQL injection via q parameter — attacker payload: q=\"%'; DROP TABLE products; --\" or UNION-based exfiltration",
            "SQL injection via limit parameter — non-numeric input enables arbitrary SQL",
            "Removed parameterized queries ($1, $2) and parseInt/Math.min validation that bounded limit to 100",
            "Added price column to SELECT, changing API response shape and potentially leaking sensitive data",
            "ORDER BY price added without index consideration for a search endpoint",
          ],
        },
      },
    ],
  },

  // ── CODE REVIEW: cr_security_002 (Password Comparison) ──
  {
    questionId: "cr_security_002",
    category: "code_review",
    levels: [
      {
        expected: 20,
        answer: {
          diff: "see question",
          summary: "The code simplifies the authentication logic. Looks cleaner and more readable.",
          findings: ["Removed unnecessary bcrypt import"],
        },
      },
      {
        expected: 40,
        answer: {
          diff: "see question",
          summary: "bcrypt was removed which is concerning. Passwords should be hashed. Also the error messages are different which could be an issue.",
          findings: ["bcrypt removed", "Different error messages for different failures"],
        },
      },
      {
        expected: 60,
        answer: {
          diff: "see question",
          summary: "Serious issues: (1) Comparing plaintext password against a hash with === will never match — authentication is broken. (2) Different error messages enable user enumeration. bcrypt must be restored.",
          findings: [
            "Plaintext comparison against bcrypt hash will never match — breaks auth completely",
            "User enumeration via different error messages",
          ],
        },
      },
      {
        expected: 80,
        answer: {
          diff: "see question",
          summary: "Critical security regression: (1) password !== user.passwordHash compares plaintext against a bcrypt hash — this can never match, so NO user can log in. (2) Different error messages ('user_not_found' vs 'wrong_password') allow attackers to enumerate valid accounts. (3) Removing bcrypt implies passwords may be stored unhashed. Fix: restore bcrypt.compare() and use a single generic error message.",
          findings: [
            "Plaintext vs bcrypt hash comparison — authentication completely broken",
            "User enumeration via distinct error messages",
            "Removing bcrypt suggests passwords stored in plaintext — critical security violation",
          ],
        },
      },
      {
        expected: 100,
        answer: {
          diff: "see question",
          summary: "Multiple critical security regressions: (1) password !== user.passwordHash performs a plaintext-to-bcrypt-hash comparison which will NEVER succeed — all users are locked out. (2) The error messages 'user_not_found' and 'wrong_password' enable user enumeration — the original used a single 'invalid_credentials' for both cases. (3) The original code performed a constant-time dummy bcrypt.compare against a placeholder hash even for missing users, preventing timing-based enumeration. This is now gone. (4) === string comparison is vulnerable to timing attacks even if the comparison were correct. (5) Removing bcrypt entirely implies the system may be storing passwords unhashed, which is a catastrophic data protection violation. Fix: restore bcrypt with the original constant-time pattern, use a single generic error message, and verify passwords are stored hashed.",
          findings: [
            "Plaintext === bcrypt hash comparison — completely breaks authentication, no user can log in",
            "User enumeration via distinct error messages (user_not_found vs wrong_password)",
            "Removed constant-time placeholder comparison for missing users — enables timing-based enumeration",
            "=== string comparison is not constant-time — vulnerable to timing attacks",
            "Removing bcrypt implies plaintext password storage — critical compliance/security violation",
          ],
        },
      },
    ],
  },

  // ── SYSTEM DESIGN: sd_scalability_001 (URL Shortener) ──
  {
    questionId: "sd_scalability_001",
    category: "system_design",
    levels: [
      {
        expected: 20,
        answer: {
          overview: "Use a web server and database to store URLs.",
          components: "Server, Database",
          tradeoffs: "None really",
          scalingStrategy: "Add more servers if needed",
        },
      },
      {
        expected: 40,
        answer: {
          overview: "Use a hash function to generate short codes from URLs. Store the mapping in a database. Use a web server to handle redirects.",
          components: "Load balancer, web servers, PostgreSQL database, Redis cache",
          tradeoffs: "Cache adds complexity but improves read speed",
          scalingStrategy: "Horizontal scaling of web servers, read replicas for the database",
        },
      },
      {
        expected: 60,
        answer: {
          overview: "Use base62 encoding to generate 6-8 character short codes. Store original URL, short code, and metadata in a database. Redis cache in front for fast redirect lookups since reads dominate 10:1.",
          components: "Load balancer → App servers → Redis (cache) → PostgreSQL. Short code generation service. Analytics event queue.",
          tradeoffs: "Redis adds operational complexity but necessary for <50ms reads. Base62 has collision risk that needs handling.",
          scalingStrategy: "Stateless app servers behind LB, Redis cluster for cache, PostgreSQL read replicas. Analytics written async to avoid blocking redirects.",
        },
      },
      {
        expected: 80,
        answer: {
          overview: "Data model: short_code (PK, varchar 8), original_url, created_at, expires_at, user_id, click_count. Key generation: base62 encode of auto-increment ID — guarantees uniqueness without collision checks. For custom aliases, check uniqueness before insert. Read path: Redis cache (short_code → original_url) with TTL matching link expiry. Cache miss falls through to DB. Write path: insert to DB, async cache warm.",
          components: "DNS → CDN/LB → App servers (stateless) → Redis cluster (cache, <50ms reads) → PostgreSQL (primary + read replicas). Kafka for async analytics (click events with referrer, geo, timestamp). Analytics consumer writes to ClickHouse/Redshift.",
          tradeoffs: "Auto-increment base62 is simple but leaks creation order and total count. Alternative: pre-generated random key pool eliminates both but adds complexity. Redis cache handles 100K reads/sec but needs cluster mode for HA. Analytics async means counts are eventually consistent.",
          scalingStrategy: "10K writes/sec: PostgreSQL primary can handle this with proper indexing. 100K reads/sec: Redis cluster with ~5 nodes. Storage: 100M links × 2KB ≈ 200GB, fits on single DB. Shard by short_code prefix if growth exceeds single DB. TTL expiry: background job scans expired links, removes from cache and marks in DB.",
        },
      },
      {
        expected: 100,
        answer: {
          overview: "Full URL shortener architecture for 100M+ links:\n\n**Data Model:**\n- short_code (PK, varchar 8, indexed)\n- original_url (text, not null)\n- created_at, expires_at (timestamp)\n- user_id (FK, nullable for anonymous)\n- custom_alias (boolean)\n- click_count (integer, async-updated)\nIndex on expires_at for TTL cleanup.\n\n**Key Generation:**\nPre-generated key service: worker generates random base62 keys in batches (10K at a time), stores in a `key_pool` table marked as unused. On write, app claims a key atomically (UPDATE ... SET used=true WHERE used=false LIMIT 1 RETURNING key). This avoids collision entirely and eliminates hot-spot writes. For custom aliases: check uniqueness, reserve in same table.\n\n**Read Path (100K/sec, <50ms p99):**\nRequest → LB → App server → Redis GET short_code → if miss → DB SELECT → Redis SET with TTL → 301 redirect. Redis cluster with 5 nodes handles 100K reads. p99 <50ms since Redis latency is ~1ms, network overhead ~10ms.\n\n**Write Path (10K/sec):**\nRequest → LB → App → claim key from pool → INSERT to DB → async Redis warm. PostgreSQL handles 10K inserts/sec with WAL tuning. Key pool refill runs as background job when pool < 100K keys.",
          components: "DNS → CloudFront/CDN (cache 301 redirects for popular links) → ALB → App servers (auto-scaling group, stateless) → Redis cluster (5 nodes, cache layer) → PostgreSQL (primary + 2 read replicas, 200GB). Kafka cluster → Analytics consumer → ClickHouse (click events: short_code, timestamp, referrer, geo from IP, user_agent). Background workers: key pool refill, TTL expiry scanner, analytics aggregator.",
          tradeoffs: "1. Pre-generated keys vs hash-based: keys are simpler and collision-free, but require pool management. Hash (MD5 first 7 chars, base62) is stateless but needs retry on collision (~0.01% at 100M links).\n2. 301 (permanent) vs 302 (temporary) redirect: 301 lets browsers/CDN cache, reducing server load but making click analytics less accurate. Solution: 302 for analytics-required links, 301 for others.\n3. Redis vs local cache: Redis adds network hop but is shared across servers. Local cache (LRU) can front Redis for top 1% of links.\n4. Analytics sync vs async: sync blocks redirects (bad for p99), async loses ~0.1% of events on crash. Kafka with acks=1 is the right tradeoff.\n5. Storage: 200GB fits single PostgreSQL with room to grow. Shard by short_code hash when approaching 1B links. Read replicas handle read-heavy analytics queries without impacting redirect path.",
          scalingStrategy: "Phase 1 (0-10M links): single PostgreSQL, 3-node Redis, 2 app servers. Phase 2 (10M-100M): add read replicas, Redis cluster to 5 nodes, auto-scaling to 10 app servers. Phase 3 (100M+): shard DB by short_code prefix, add CDN caching for top 10% links. Availability: multi-AZ deployment, Redis sentinel for failover, PostgreSQL streaming replication with auto-failover via Patroni. Monitoring: p99 latency, cache hit ratio (target >95%), key pool size alerts.",
        },
      },
    ],
  },

  // ── SYSTEM DESIGN: sd_scalability_002 (Notification System) ──
  {
    questionId: "sd_scalability_002",
    category: "system_design",
    levels: [
      {
        expected: 20,
        answer: {
          overview: "Send notifications to users when something happens.",
          components: "Server that sends emails and push notifications",
          tradeoffs: "Emails might be slow",
          scalingStrategy: "Use a bigger server",
        },
      },
      {
        expected: 40,
        answer: {
          overview: "Event-driven: producers send notification events to a message queue. Workers consume from the queue and deliver via different channels (push, email, in-app). User preferences table controls which channels to use per user.",
          components: "API server → Message queue (RabbitMQ or Kafka) → Channel workers (push/email/in-app) → PostgreSQL for preferences → Firebase for push, SES for email",
          tradeoffs: "Queue adds latency but ensures delivery and decouples producers from consumers. Multiple channels add complexity but necessary for user experience.",
          scalingStrategy: "Horizontal scaling of workers per channel based on queue depth. Separate queues for critical vs non-critical notifications.",
        },
      },
      {
        expected: 60,
        answer: {
          overview: "Event-driven architecture: events published to Kafka, consumed by channel-specific workers. User preference service checks opt-in/opt-out before dispatching. Critical notifications use a separate high-priority queue with retry logic. Fan-out handled by writing notification records per recipient.",
          components: "Event ingestion API → Kafka → Fan-out service → Channel routers (push/in-app/email workers) → Delivery providers (FCM, WebSocket server, SES). Preference service with Redis cache. PostgreSQL for notification history.",
          tradeoffs: "Kafka provides durability for critical notifications but adds operational complexity. WebSocket connections require sticky sessions or a connection registry.",
          scalingStrategy: "Partition Kafka by user_id for ordered delivery. Scale workers per channel independently. WebSocket servers behind a connection registry (Redis) for in-app delivery.",
        },
      },
      {
        expected: 80,
        answer: {
          overview: "Event ingestion → Fan-out → Channel routing → Delivery. For normal events, push-based fan-out: write one notification per follower. For celebrity events (>10K followers), pull-based: store one event, fan-out at read time. Preference service checks user settings before each dispatch. Critical notifications (payment, security) go through a durable queue with at-least-once delivery and dead-letter retry. Social notifications are best-effort via a separate queue.",
          components: "Ingestion API → Kafka (partitioned by event_type: critical vs social) → Fan-out service → Preference check (Redis-cached) → Channel workers: Push (FCM/APNs), In-app (WebSocket via connection registry in Redis), Email (SES, batched for digests). Daily digest cron job aggregates unread in-app notifications into email summaries.",
          tradeoffs: "Hybrid fan-out trades read-time complexity for write efficiency on celebrity events. Pull model means celebrity followers see slightly delayed notifications. Kafka durability for critical path adds ~50ms latency vs in-memory queue. WebSocket connection management is the hardest operational piece — need health checks and reconnection logic.",
          scalingStrategy: "50K notifications/sec peak: Kafka handles this with 20 partitions. Push workers: 10 instances handling 5K/sec each. WebSocket servers: stateful, need connection registry. Email: batch via SES (100 emails/sec per sender, need multiple SES identities for peak). 500M notifications/day storage: partition notification table by date, archive after 30 days.",
        },
      },
      {
        expected: 100,
        answer: {
          overview: "**Architecture Overview:**\n\nThree-phase pipeline: Ingestion → Fan-out → Delivery.\n\n**1. Event Ingestion:**\nProducers publish events to a Kafka topic (notification-events), partitioned by event_source_id. Schema: {event_id, type, actor_id, target_ids[], payload, priority: critical|normal|low, created_at}. Critical events (payment, security) go to a separate high-priority topic with replication_factor=3 and acks=all.\n\n**2. Fan-out Strategy (hybrid push/pull):**\n- Normal users (<10K followers): push model — fan-out service writes one notification record per recipient into a per-user inbox (Cassandra, partitioned by user_id). O(followers) writes.\n- Celebrity users (>10K followers): pull model — store single event, each follower's inbox query merges their own notifications + celebrity feed at read time. Avoids millions of writes per celebrity post.\n- Threshold is configurable and tracked per user.\n\n**3. Channel Routing:**\nPreference service (Redis-cached, TTL 5min) checks per-user per-channel settings. Each notification routed to applicable channels: push, in-app, email. Channel workers are independent consumer groups on the delivery topic.\n\n**4. Delivery per channel:**\n- Push: FCM/APNs batched sends (500 tokens per batch call). Failed tokens trigger device registration cleanup.\n- In-app: WebSocket server cluster with connection registry in Redis (user_id → server_id mapping). If user offline, stored in inbox for pull on reconnect.\n- Email: SES for transactional, daily digest via cron that aggregates unread notifications with priority weighting. Digest skipped if all items already read.\n\n**5. Delivery Guarantees:**\n- Critical: Kafka consumer with manual offset commit. Failed delivery → exponential backoff retry (3 attempts) → dead-letter topic → alert. At-least-once semantics, idempotency key in notification record prevents duplicate display.\n- Normal/Low: auto-commit, best-effort. Failed push silently dropped after 1 retry. In-app stored in inbox regardless.",
          components: "Kafka (3 topics: critical, normal, fan-out-delivery) → Fan-out service (consumes events, writes to Cassandra inboxes or delivery topic) → Preference service (Redis cluster, PostgreSQL source of truth) → Channel workers (push: FCM/APNs, in-app: WebSocket cluster + Redis connection registry, email: SES + digest cron) → Cassandra (notification inbox, partitioned by user_id + created_at) → PostgreSQL (user preferences, notification templates) → Monitoring: notification latency p99, delivery success rate, dead-letter queue depth.",
          tradeoffs: "1. Push vs pull fan-out: push gives <2s delivery but costs O(followers) writes. Pull saves writes but adds read-time fan-out latency (~100-500ms). Hybrid with 10K threshold balances both.\n2. Cassandra vs PostgreSQL for inbox: Cassandra handles high write throughput and is partitioned by user_id naturally. But adds operational complexity vs PostgreSQL. At 500M notifications/day, PostgreSQL would need heavy partitioning.\n3. WebSocket vs polling for in-app: WebSocket gives true real-time (<2s) but requires connection state management. Polling at 5s intervals would be simpler but misses the latency target.\n4. Digest batching: daily cron is simple but users in different timezones need timezone-aware scheduling. Alternative: per-user digest timer after N hours of inactivity.\n5. At-least-once means possible duplicates — idempotency key (event_id + user_id) in the client prevents showing duplicates.",
          scalingStrategy: "50K notifications/sec peak: Kafka with 50 partitions handles this. Fan-out service: 20 instances (each processes 2.5K events/sec). Push workers: 15 instances batching FCM calls. WebSocket servers: 50 instances, each handling 200K connections = 10M total. Email: 5 SES senders at 100/sec each = 500/sec sustained. Cassandra: 6-node cluster, replication_factor=3, handles 500M writes/day. Connection registry: Redis cluster with 3 shards. Auto-scaling: scale fan-out and channel workers based on Kafka consumer lag metric.",
        },
      },
    ],
  },

  // ── DEBUGGING: debug_runtime_001 (TypeError in Dashboard) ──
  {
    questionId: "debug_runtime_001",
    category: "debugging",
    levels: [
      {
        expected: 20,
        answer: {
          rootCause: "There is a TypeError in the code. Something is undefined.",
          evidence: "The error says 'Cannot read properties of undefined'.",
          proposedFix: "Add try-catch around the code.",
        },
      },
      {
        expected: 40,
        answer: {
          rootCause: "The .map() function is called on something that is undefined. Probably orders or recommendations is null sometimes.",
          evidence: "The error occurs at the map call. It happens 2% of the time.",
          proposedFix: "Add null checks before calling .map().",
        },
      },
      {
        expected: 60,
        answer: {
          rootCause: "orders.items is sometimes undefined, which makes .map() crash. The API response from fetchRecentOrders occasionally doesn't include the items property.",
          evidence: "Error at the .map() line. The 2% failure rate suggests it's intermittent.",
          proposedFix: "Add optional chaining: orders?.items?.map(...) or default to empty array. Should also check recommendations.products the same way.",
        },
      },
      {
        expected: 80,
        answer: {
          rootCause: "The .map() crash occurs because orders.items or recommendations.products is undefined. The code assumes a fixed response shape from fetchRecentOrders and fetchRecommendations, but during peak hours (~2% of requests), one of these downstream services returns an unexpected shape — likely a timeout or error that gets parsed as an empty object {} instead of the expected { items: [...] } structure.",
          evidence: "Stack trace points to dashboard.js:15 (orders.items.map). The 2% failure rate during peak hours is characteristic of service degradation under load — the downstream order service likely times out and returns a partial/error response. Promise.all means if one service fails with a weird response shape, it still resolves (no rejection), but the data is wrong.",
          proposedFix: "1. Defensive defaults: const orderSummary = (orders?.items ?? []).map(...) and same for recommendations.products. 2. Replace Promise.all with Promise.allSettled so one failing service doesn't affect others. 3. Add response shape validation after each fetch — verify items/products is an array before using it. 4. Add monitoring: log when orders.items is undefined to track the upstream issue.",
        },
      },
      {
        expected: 100,
        answer: {
          rootCause: "The TypeError 'Cannot read properties of undefined (reading \"map\")' is thrown because orders.items and/or recommendations.products is undefined when .map() is called. The root cause is that the downstream services (fetchRecentOrders, fetchRecommendations) intermittently return responses missing the expected nested properties. Under peak load (~2% of requests), these services likely experience timeouts or partial failures, returning either empty objects {}, error wrappers { error: 'timeout' }, or null — none of which have the expected .items or .products arrays. The bug is in response handling, not in the .map callback itself — the crash happens before any iteration because the receiver is undefined.",
          evidence: "1. Stack trace: dashboard.js:15:38 points to orders.items.map — the first .map() call. 2. 2% during peak hours = service degradation pattern, not a deterministic code bug. 3. Promise.all resolves ALL three promises (profile, orders, recommendations), so even a degraded response gets destructured — there's no rejection to catch. 4. The code assumes all three services always return the exact expected shape, with no validation layer. 5. Notably, profile.name and profile.createdAt have the same problem — if fetchUserProfile returns {}, those would also be undefined (just less visible since they don't crash on .map).",
          proposedFix: "**Immediate fix:** Add defensive defaults before accessing nested properties:\n```\nconst orderSummary = (orders?.items ?? []).map(...);\nconst recList = (recommendations?.products ?? []).map(...);\n```\n\n**Better fix:** Replace Promise.all with Promise.allSettled and handle each result independently:\n```\nconst [profileResult, ordersResult, recsResult] = await Promise.allSettled([...]);\nconst profile = profileResult.status === 'fulfilled' ? profileResult.value : {};\n```\nThis way one failing service doesn't risk the entire dashboard.\n\n**Root fix:** Add response shape validation in each fetch function — normalize the output to always return { items: [] } or { products: [] }, even on error. This moves the defensive logic to the data layer where it belongs.\n\n**Regression test:** Test with fetchRecentOrders returning {}, null, { items: undefined }, and { items: [] } — verify the endpoint returns 200 with empty arrays instead of crashing.\n\n**Monitoring:** Log a warning when orders.items is undefined with the response body, to track how the upstream service is failing and fix the root cause there.",
        },
      },
    ],
  },

  // ── DEBUGGING: debug_logic_001 (Pagination Off-by-One) ──
  {
    questionId: "debug_logic_001",
    category: "debugging",
    levels: [
      {
        expected: 20,
        answer: {
          rootCause: "The pagination is broken. Pages show wrong data.",
          evidence: "Users report duplicate items and empty last page.",
          proposedFix: "Fix the pagination logic.",
        },
      },
      {
        expected: 40,
        answer: {
          rootCause: "The totalPages calculation uses Math.floor instead of Math.ceil, so the last page is missing.",
          evidence: "21 items / 20 per page = 1.05, floor gives 1 but should be 2.",
          proposedFix: "Change Math.floor to Math.ceil for totalPages.",
        },
      },
      {
        expected: 60,
        answer: {
          rootCause: "Math.floor(total / pageSize) gives the wrong page count — it should be Math.ceil. Also the query fetches too many rows which causes duplicates on the next page.",
          evidence: "21 items / 20 per page should be 2 pages but floor gives 1. Users see duplicate items across pages.",
          proposedFix: "Change to Math.ceil for totalPages. Limit the returned array to pageSize items.",
        },
      },
      {
        expected: 80,
        answer: {
          rootCause: "Three bugs: (1) products array not sliced to pageSize — LIMIT pageSize+1 fetches an extra row for hasNext detection, but all rows including the extra are returned, causing overlap with the next page. (2) Math.floor(total / pageSize) undercounts pages — should be Math.ceil. (3) sortBy and order are interpolated directly into SQL without validation, which is a SQL injection vulnerability and also explains the 'sorting resets between pages' symptom if the client sends unexpected values.",
          evidence: "Bug 1: if pageSize=20 and there are 21+ items, page 1 returns 21 items, page 2 starts at offset 20, so item 21 appears on both pages. Bug 2: 21/20 = 1.05, Math.floor = 1 total page, but there should be 2. Bug 3: sortBy is user-controlled and goes directly into SQL string — attacker could inject SQL.",
          proposedFix: "1. products.slice(0, pageSize) before returning. 2. Math.ceil(total / pageSize) for totalPages. 3. Validate sortBy against an allowlist of column names, and order against ['asc', 'desc'] only.",
        },
      },
      {
        expected: 100,
        answer: {
          rootCause: "Three distinct bugs causing the reported symptoms:\n\n**Bug 1 — Duplicate last item (page overlap):** The query uses LIMIT pageSize+1 to detect hasNext, but the full array (including the extra detection row) is returned to the client. When pageSize=20, page 1 returns 21 items. Page 2 with OFFSET 20 starts at what was the 21st item — the same item that was the extra row on page 1.\n\n**Bug 2 — Empty last page (totalPages undercount):** Math.floor(total / pageSize) truncates. For 21 items / 20 = 1.05, floors to 1 total page. But there should be 2. So the UI shows a page 2 link that returns 0 results.\n\n**Bug 3 — Sorting resets / SQL injection:** sortBy and order are interpolated directly into the SQL string (ORDER BY ${sortBy} ${order}). This is a SQL injection vulnerability — an attacker could send sortBy=name; DROP TABLE products; --. But even without malicious intent, if the client sends an invalid sortBy value on subsequent pages, the sort order changes, explaining why 'sorting seems to reset between pages.'",
          evidence: "1. Page overlap: LIMIT 21, returns 21 items. Page 2 OFFSET 20 re-fetches the 21st item. The hasNext flag is computed correctly but the response includes the sentinel row. 2. Empty last page: 21 items with pageSize=20 → Math.floor(21/20)=1 → totalPages=1, but the UI likely adds +1 for hasNext, showing an empty page 2. 3. Sort reset: if the frontend doesn't consistently send the same sortBy param (or it's URL-encoded differently), the SQL generates different ORDER BY on each page request. 4. The count query and paginated query are separate — if data changes between them, total and results can be inconsistent.",
          proposedFix: "```javascript\n// Fix 1: Slice to pageSize\nconst hasNext = products.length > pageSize;\nconst sliced = products.slice(0, pageSize);\n\n// Fix 2: Ceil for totalPages\nconst totalPages = Math.ceil(total / pageSize);\n\n// Fix 3: Allowlist for sort\nconst ALLOWED_SORT = ['name', 'price', 'created_at'];\nconst ALLOWED_ORDER = ['asc', 'desc'];\nconst safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : 'name';\nconst safeOrder = ALLOWED_ORDER.includes(order) ? order : 'asc';\n\n// Use parameterized where possible\nconst products = await db.query(\n  `SELECT * FROM products ORDER BY ${safeSortBy} ${safeOrder} LIMIT $1 OFFSET $2`,\n  [pageSize + 1, offset]\n);\n\nres.json({\n  products: sliced,\n  page,\n  pageSize,\n  total,\n  totalPages,\n  hasNext,\n});\n```\n\nAdditional: Consider cursor-based pagination for consistency (avoids the count query race), but fix the offset bugs first since that's the immediate issue.",
        },
      },
    ],
  },

  // ── DATA ANALYSIS: da_sql_001 (Cohort Analysis) ──
  {
    questionId: "da_sql_001",
    category: "data_analysis",
    levels: [
      {
        expected: 20,
        answer: {
          query: "SELECT * FROM users JOIN orders ON users.id = orders.user_id;",
          explanation: "Join users and orders to see who bought what.",
          optimization: "Add an index.",
        },
      },
      {
        expected: 40,
        answer: {
          query: "SELECT DATE_TRUNC('month', u.created_at) as signup_month, COUNT(*) as user_count, SUM(o.total_amount) as revenue FROM users u JOIN orders o ON u.id = o.user_id GROUP BY signup_month ORDER BY signup_month;",
          explanation: "Group users by signup month and sum their orders. This shows revenue per cohort.",
          optimization: "Index on users.created_at and orders.user_id.",
        },
      },
      {
        expected: 60,
        answer: {
          query: `SELECT
  DATE_TRUNC('month', u.created_at) as signup_cohort,
  DATE_TRUNC('month', o.created_at) as order_month,
  COUNT(DISTINCT u.id) as active_users,
  SUM(o.total_amount) as total_revenue
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY signup_cohort, order_month
ORDER BY signup_cohort, order_month;`,
          explanation: "Group by both signup cohort and order month to see how each cohort's revenue evolves over time. Only include completed orders. COUNT DISTINCT for active users per bucket.",
          optimization: "Composite index on orders(user_id, status, created_at) would help. For 200K orders this should run quickly.",
        },
      },
      {
        expected: 80,
        answer: {
          query: `WITH user_cohorts AS (
  SELECT id, DATE_TRUNC('month', created_at) AS signup_cohort
  FROM users
)
SELECT
  TO_CHAR(uc.signup_cohort, 'YYYY-MM') AS signup_cohort,
  TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS order_month,
  COUNT(DISTINCT uc.id) AS active_users,
  SUM(o.total_amount) AS total_revenue,
  ROUND(SUM(o.total_amount) / COUNT(DISTINCT uc.id), 2) AS avg_revenue_per_user
FROM user_cohorts uc
JOIN orders o ON uc.id = o.user_id
WHERE o.status = 'completed'
GROUP BY uc.signup_cohort, DATE_TRUNC('month', o.created_at)
ORDER BY uc.signup_cohort, order_month;`,
          explanation: "CTE first to compute signup cohort per user, then join to completed orders. Group by cohort + order month. avg_revenue_per_user = SUM / COUNT DISTINCT (not AVG, since AVG would give per-order average). YYYY-MM formatting matches expected output.",
          optimization: "Index on orders(user_id, status) covers the join and filter. CTE avoids recomputing cohort. With 200K orders and 50K users, this should complete in <1s.",
        },
      },
      {
        expected: 100,
        answer: {
          query: `WITH user_cohorts AS (
  SELECT
    id AS user_id,
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS signup_cohort
  FROM users
),
monthly_orders AS (
  SELECT
    user_id,
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS order_month,
    total_amount
  FROM orders
  WHERE status = 'completed'  -- exclude refunded (~5%) and cancelled
)
SELECT
  uc.signup_cohort,
  mo.order_month,
  COUNT(DISTINCT uc.user_id) AS active_users,
  SUM(mo.total_amount) AS total_revenue,
  ROUND(SUM(mo.total_amount) / NULLIF(COUNT(DISTINCT uc.user_id), 0), 2) AS avg_revenue_per_user
FROM user_cohorts uc
INNER JOIN monthly_orders mo ON uc.user_id = mo.user_id
GROUP BY uc.signup_cohort, mo.order_month
ORDER BY uc.signup_cohort, mo.order_month;`,
          explanation: "Two CTEs for clarity:\n1. user_cohorts: derives signup month per user from users.created_at\n2. monthly_orders: pre-filters to completed orders only (excludes ~5% refunded and cancelled as specified)\n\nINNER JOIN because we only want users who have orders (30% never ordered — they'd produce NULL revenue rows with LEFT JOIN, which isn't useful here).\n\nCOUNT(DISTINCT user_id) counts active users per cohort per month — not raw order count.\n\navg_revenue_per_user uses SUM/COUNT DISTINCT (not AVG(total_amount) which would give per-order average). NULLIF prevents division by zero if a cohort has 0 active users in a month.\n\nOutput matches expected: signup_cohort (YYYY-MM), order_month (YYYY-MM), active_users, total_revenue, avg_revenue_per_user.",
          optimization: "1. Index: CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, created_at) — covers the join, filter, and date truncation.\n2. With 200K orders and 50K users, this produces ~18 months × ~18 months ≈ 324 output rows max. PostgreSQL handles this in <500ms even without the index.\n3. If this runs frequently, materialize as a monthly summary table updated by a cron job.\n4. The CTEs help PostgreSQL optimize the plan — it materializes user_cohorts (50K rows) and monthly_orders (~190K after filtering) then hash-joins them.",
        },
      },
    ],
  },

  // ── DATA ANALYSIS: da_sql_002 (Slow Query Optimization) ──
  {
    questionId: "da_sql_002",
    category: "data_analysis",
    levels: [
      {
        expected: 20,
        answer: {
          query: "The query looks correct. Maybe add LIMIT to make it faster.",
          explanation: "It's slow because the table is large.",
          optimization: "Add LIMIT 100 at the end.",
        },
      },
      {
        expected: 40,
        answer: {
          query: "Add an index on department_id to speed up the subqueries.",
          explanation: "The correlated subqueries are scanning the table for each row. An index would help.",
          optimization: "CREATE INDEX idx_dept ON employees(department_id);",
        },
      },
      {
        expected: 60,
        answer: {
          query: `SELECT
  e.employee_id,
  e.department_id,
  e.salary,
  AVG(e.salary) OVER (PARTITION BY e.department_id) as dept_avg,
  RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as salary_rank,
  MAX(e.salary) OVER (PARTITION BY e.department_id) as dept_max
FROM employees e
WHERE e.is_active = true
ORDER BY e.department_id, salary_rank;`,
          explanation: "Window functions replace all 3 correlated subqueries. Each PARTITION BY department_id computes the aggregate in a single pass instead of per-row.",
          optimization: "CREATE INDEX idx_employees_dept_salary ON employees(department_id, salary);",
        },
      },
      {
        expected: 80,
        answer: {
          query: `SELECT
  e.employee_id,
  e.department_id,
  e.salary,
  AVG(e.salary) OVER (PARTITION BY e.department_id) AS dept_avg,
  RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank,
  MAX(e.salary) OVER (PARTITION BY e.department_id) AS dept_max
FROM employees e
WHERE e.is_active = true
ORDER BY e.department_id, salary_rank;`,
          explanation: "The original has 3 correlated subqueries, each scanning the full department for every row: 3 × 10M = 30M subquery executions. Window functions (AVG OVER, RANK OVER, MAX OVER) compute all three in a single pass over the partitioned data, reducing complexity from O(N×M) to O(N log N). PostgreSQL can share the partition sort across all three window functions.",
          optimization: "CREATE INDEX idx_employees_dept_salary ON employees(department_id, salary) WHERE is_active = true;\n\nThis partial index covers the WHERE filter and supports the PARTITION BY + ORDER BY in the window functions. Expected improvement: 45s → <2s.",
        },
      },
      {
        expected: 100,
        answer: {
          query: `-- Optimized query using window functions
SELECT
  e.employee_id,
  e.department_id,
  e.salary,
  AVG(e.salary) OVER w AS dept_avg,
  RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank,
  MAX(e.salary) OVER w AS dept_max
FROM employees e
WHERE e.is_active = true
WINDOW w AS (PARTITION BY e.department_id)
ORDER BY e.department_id, salary_rank;`,
          explanation: "**Why the original is slow:**\nThe 3 correlated subqueries each re-scan the department's rows for every row in the outer query. With 10M rows and 500 departments (avg 20K per dept), each subquery does ~20K comparisons per row = 3 × 10M × 20K = 600B row comparisons total. Without an index on department_id, each subquery is a full table scan.\n\n**Why window functions fix it:**\nWindow functions with PARTITION BY department_id sort the data once by department, then compute AVG, RANK, and MAX in a single streaming pass per partition. Total work: one sort (O(N log N)) + one pass (O(N)) = roughly O(N log N). PostgreSQL can share the partition between AVG/MAX (same window frame) using the WINDOW clause.\n\n**Named window (WINDOW w):** AVG and MAX share the same partition definition, so using a named window avoids redundant sort steps. RANK needs its own ORDER BY so it gets a separate window spec.\n\n**Performance estimate:**\n- Original: ~45s (N×M correlated scans, no index)\n- With window functions only: ~8-10s (sort on department_id without index)\n- With window functions + index: <2s (index provides pre-sorted data for partitioning)",
          optimization: "**Primary index:**\n```sql\nCREATE INDEX idx_emp_active_dept_salary\n  ON employees(department_id, salary)\n  WHERE is_active = true;\n```\nPartial index filters out inactive rows (saves space). Composite (department_id, salary) supports both the PARTITION BY and ORDER BY in RANK's window function. The index provides sorted input, eliminating the sort step.\n\n**Why composite, not just department_id:**\nA single-column index on department_id would help the partition lookup but PostgreSQL would still need to sort by salary within each partition for RANK. The composite index provides both grouping and ordering.\n\n**Additional consideration:**\nIf this query runs frequently, consider a materialized view refreshed hourly:\n```sql\nCREATE MATERIALIZED VIEW dept_salary_stats AS\n  SELECT employee_id, department_id, salary,\n    AVG(salary) OVER w AS dept_avg,\n    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank,\n    MAX(salary) OVER w AS dept_max\n  FROM employees WHERE is_active = true\n  WINDOW w AS (PARTITION BY department_id);\nCREATE UNIQUE INDEX ON dept_salary_stats(employee_id);\n```\nThis makes the query O(1) lookup instead of O(N log N) computation.",
        },
      },
    ],
  },

  // ── PRACTICAL CODING: pc_impl_001 (LRU Cache) ──
  {
    questionId: "pc_impl_001",
    category: "practical_coding",
    levels: [
      {
        expected: 20,
        answer: {
          code: `class LRUCache:
    def __init__(self, capacity):
        self.data = {}
        self.capacity = capacity

    def get(self, key):
        if key in self.data:
            return self.data[key]
        return -1

    def put(self, key, value):
        self.data[key] = value`,
          approach: "Used a dictionary to store key-value pairs.",
          complexity: "O(1) for get and put.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 40,
        answer: {
          code: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key):
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return -1

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)`,
          approach: "Dictionary for storage, list for tracking order. Remove oldest when at capacity. Move accessed keys to end of list.",
          complexity: "O(1) for get and put.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 60,
        answer: {
          code: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key: int) -> int:
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            lru = self.order.pop(0)
            del self.cache[lru]
        self.cache[key] = value
        self.order.append(key)`,
          approach: "Dictionary for O(1) lookup, list to track access order. On get/put, move key to end of list. When at capacity, pop from front (least recently used). This correctly implements LRU behavior.",
          complexity: "get: O(n) due to list.remove() scanning the list. put: O(n) same reason. Space: O(capacity). The O(n) remove is a weakness — could be improved with a doubly linked list for O(1) operations.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 80,
        answer: {
          code: `class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add_to_front(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._remove(node)
            self._add_to_front(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            node = Node(key, value)
            self.cache[key] = node
            self._add_to_front(node)`,
          approach: "Hash map + doubly linked list. Map stores key→node for O(1) lookup. Linked list maintains recency order with sentinel head/tail nodes for clean edge cases. Most recent at head, LRU at tail.",
          complexity: "get: O(1) — hash lookup + constant-time list operations. put: O(1) — same. Space: O(capacity) for both map and list nodes.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 100,
        answer: {
          code: `class Node:
    """Doubly linked list node storing key (for eviction lookup) and value."""
    __slots__ = ('key', 'val', 'prev', 'next')

    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev: 'Node | None' = None
        self.next: 'Node | None' = None

class LRUCache:
    """
    LRU Cache with O(1) get and put.

    Design: HashMap<key, Node> + Doubly Linked List
    - Map provides O(1) key lookup to the list node
    - List maintains recency order: head.next = MRU, tail.prev = LRU
    - Sentinel head/tail nodes eliminate null checks in insert/remove

    Why not OrderedDict: problem explicitly forbids built-in ordered structures.
    Why not array: removing from middle is O(n), breaking the O(1) requirement.
    """

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[int, Node] = {}
        # Sentinel nodes — never hold real data
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node) -> None:
        """Remove node from its current position in O(1)."""
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_after_head(self, node: Node) -> None:
        """Insert node right after head (most recently used position)."""
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        # Move to MRU position
        self._remove(node)
        self._add_after_head(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            # Update existing: change value, move to MRU
            node = self.cache[key]
            node.val = value
            self._remove(node)
            self._add_after_head(node)
        else:
            # Evict LRU if at capacity
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            # Insert new node at MRU position
            node = Node(key, value)
            self.cache[key] = node
            self._add_after_head(node)`,
          approach: "Classic hash map + doubly linked list design:\n\n1. HashMap<key, Node> provides O(1) lookup to locate any node in the list.\n2. Doubly linked list maintains recency: head.next = most recently used, tail.prev = least recently used.\n3. Sentinel head/tail nodes simplify insert/remove by eliminating edge cases (empty list, single element).\n4. Node stores both key and value — key is needed during eviction to delete from the hash map.\n\nWhy this works in O(1): get() does one hash lookup + one remove + one insert (all O(1) pointer operations). put() does the same, plus potential eviction from tail (also O(1)).\n\nWhy not use Python's OrderedDict: the problem explicitly says not to use built-in ordered dictionaries. This implementation manually builds the same structure.\n\nAlternative approaches considered: (1) Array-based with index tracking — O(n) remove from middle. (2) Single linked list — O(n) to find predecessor for removal. (3) Timestamp-based eviction — O(n) to find minimum timestamp. All fail the O(1) constraint.",
          complexity: "Time: get O(1), put O(1) — all operations are hash map lookups and constant-time pointer manipulation.\nSpace: O(capacity) — one hash entry + one list node per cached item, plus 2 sentinel nodes.\n\nWith the given constraints (capacity ≤ 3000, ≤ 200K operations), this handles the worst case in ~200K × O(1) = effectively instant.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
    ],
  },

  // ── PRACTICAL CODING: pc_impl_002 (Trie / Prefix Tree) ──
  {
    questionId: "pc_impl_002",
    category: "practical_coding",
    levels: [
      {
        expected: 20,
        answer: {
          code: `class Trie:
    def __init__(self):
        self.words = []

    def insert(self, word):
        self.words.append(word)

    def search(self, word):
        return word in self.words

    def startsWith(self, prefix):
        for w in self.words:
            if w.startswith(prefix):
                return True
        return False`,
          approach: "Store words in a list. Search by iterating.",
          complexity: "O(n) for search, O(n*m) for startsWith.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 40,
        answer: {
          code: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                node[ch] = {}
            node = node[ch]

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return True

    def startsWith(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return False
            node = node[ch]
        return True`,
          approach: "Use nested dictionaries. Each character maps to a sub-dictionary. Traverse to check if word or prefix exists.",
          complexity: "O(m) for each operation.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 60,
        answer: {
          code: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                node[ch] = {}
            node = node[ch]
        node['$'] = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return '$' in node

    def startsWith(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return False
            node = node[ch]
        return True`,
          approach: "Dictionary-based tree. Each level stores characters as keys.",
          complexity: "O(1) for search and insert since dictionaries are hash-based.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 80,
        answer: {
          code: `class TrieNode:
    def __init__(self):
        self.children: dict[str, 'TrieNode'] = {}
        self.is_end: bool = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self._find_node(word)
        return node is not None and node.is_end

    def startsWith(self, prefix: str) -> bool:
        return self._find_node(prefix) is not None

    def _find_node(self, prefix: str) -> 'TrieNode | None':
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node`,
          approach: "Trie with TrieNode class. Each node has children dict (char → child node) and is_end flag. Refactored search and startsWith to share a _find_node helper that traverses the trie to the last character. search checks is_end, startsWith just checks existence. This avoids code duplication between the two methods.",
          complexity: "insert: O(m), search: O(m), startsWith: O(m) where m is the length of the word/prefix. Space: O(total characters across all inserted words) in the worst case (no shared prefixes). With shared prefixes, space is much less — that's the whole point of a trie.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
      {
        expected: 100,
        answer: {
          code: `class TrieNode:
    """Each node represents a single character in the trie path.
    children maps char → child node.
    is_end marks whether a complete word ends at this node."""
    __slots__ = ('children', 'is_end')

    def __init__(self):
        self.children: dict[str, 'TrieNode'] = {}
        self.is_end: bool = False

class Trie:
    """
    Prefix tree supporting insert, exact search, and prefix search.

    Design choices:
    - Dict-based children instead of array[26]: dict is cleaner in Python
      and handles sparse character sets well. For a-z only with dense usage,
      array[26] would be faster due to direct indexing.
    - __slots__ on TrieNode to reduce per-node memory overhead (~40% less
      than default dict-based attributes).
    - Shared _traverse helper to DRY up search/startsWith logic.
    """

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        """Insert word into the trie. O(m) where m = len(word)."""
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        """Return True if exact word exists. O(m)."""
        node = self._traverse(word)
        return node is not None and node.is_end

    def startsWith(self, prefix: str) -> bool:
        """Return True if any word starts with prefix. O(m)."""
        return self._traverse(prefix) is not None

    def _traverse(self, s: str) -> 'TrieNode | None':
        """Follow the path for string s, return the terminal node or None."""
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node`,
          approach: "Standard trie (prefix tree) implementation with TrieNode class.\n\n**Structure:** Each node has a children dict (char → TrieNode) and an is_end boolean. The root is an empty node. Words are stored character-by-character along paths from root.\n\n**Key design decisions:**\n1. Dict children vs array[26]: Dict is more Pythonic, handles sparse alphabets, and uses less memory when not all 26 chars are present. Array[26] would give O(1) child lookup vs dict's amortized O(1), but the constant factor difference is negligible.\n2. __slots__ on TrieNode: reduces per-node memory by ~40% by preventing __dict__ creation.\n3. Shared _traverse helper: search() and startsWith() both traverse the trie — only the final check differs (is_end vs existence). DRY.\n\n**Why trie over alternatives:**\n- HashSet: O(1) exact search but O(n×m) prefix search (must check every word)\n- Sorted array + binary search: O(log n) search but O(n) insert\n- Trie: O(m) for all operations, and prefix search is natural (just stop at the prefix node)\n\n**Edge cases handled:**\n- Empty string: traverses zero characters, returns root (which is never is_end unless \"\" was inserted)\n- Prefix of existing word: startsWith returns True, search returns False (unless prefix was also inserted)\n- Insert same word twice: is_end is already True, no-op beyond traversal",
          complexity: "Time: insert O(m), search O(m), startsWith O(m) where m is string length. All operations are a single traversal — no backtracking.\n\nSpace: O(N × average_word_length) in the worst case with no shared prefixes. With shared prefixes (common in real data), much less. For the given constraints (30K calls, words up to 2000 chars), worst case is ~60M nodes but practically much less.\n\nThe __slots__ optimization saves ~64 bytes per node (no __dict__), significant when there are many nodes.",
          blocks: [{ type: "code", language: "python", content: "# same as above" }],
        },
      },
    ],
  },
];

// ── OpenAI evaluation call ──

interface EvalResult {
  score: number | null;
  criteriaResults: { criterion: string; coverage: string; evidence: string }[];
  strengths: string[];
  weaknesses: string[];
}

async function callEval(answer: Answer, question: Question): Promise<EvalResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(question) },
        { role: "user", content: buildUserMessage(answer, question) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as { choices: { message: { content: string } }[] };
  const raw = JSON.parse(payload.choices[0]?.message?.content ?? "{}");

  const score = typeof raw.score === "number"
    ? Math.max(0, Math.min(100, Math.round(raw.score >= 0 && raw.score <= 1 ? raw.score * 100 : raw.score)))
    : null;

  return {
    score,
    criteriaResults: Array.isArray(raw.criteriaResults) ? raw.criteriaResults : [],
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
  };
}

// ── Main ──

interface CalibrationResult {
  questionId: string;
  category: string;
  title: string;
  levels: {
    expected: number;
    actual: number | null;
    delta: number;
    pass: boolean;
  }[];
  correlation: number;
  monotonic: boolean;
}

function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const rank = (arr: number[]) => {
    const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) ranks[sorted[i].i] = i + 1;
    return ranks;
  };

  const rx = rank(x);
  const ry = rank(y);
  const d2 = rx.reduce((sum, r, i) => sum + (r - ry[i]) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function isMonotonic(scores: (number | null)[]): boolean {
  const valid = scores.filter((s): s is number => s != null);
  for (let i = 1; i < valid.length; i++) {
    if (valid[i] < valid[i - 1] - 10) return false; // allow 10-point tolerance
  }
  return true;
}

async function main() {
  const totalEvals = CASES.reduce((sum, c) => sum + c.levels.length, 0);
  const totalRubrics = CASES.length;

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   LGTM Evaluation Calibration Test                   ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Model: ${MODEL.padEnd(44)}║`);
  console.log(`║  Questions: ${String(totalRubrics).padEnd(40)}║`);
  console.log(`║  Evaluations: ${String(totalEvals).padEnd(38)}║`);
  console.log(`║  Total API calls: ~${String(totalEvals + totalRubrics).padEnd(33)}║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  const results: CalibrationResult[] = [];

  for (const tc of CASES) {
    const question = questions.getById(tc.questionId);
    if (!question) {
      console.error(`Question ${tc.questionId} not found, skipping`);
      continue;
    }

    console.log(`▸ ${tc.category} — ${question.title}`);

    // Generate rubric
    console.log(`  [rubric] Generating...`);
    let rubric;
    try {
      rubric = await generateRubric({
        category: question.category,
        type: question.type,
        title: question.title,
        prompt: question.prompt,
        diff: question.diff || undefined,
        language: question.language,
      });
      console.log(`  [rubric] ${rubric.mustCover.length} mustCover, ${rubric.strongSignals.length} strongSignals`);
    } catch (err) {
      console.error(`  [rubric] FAILED: ${err}`);
      continue;
    }

    const questionWithRubric = { ...question, rubric };
    const levelResults: CalibrationResult["levels"] = [];

    for (const level of tc.levels) {
      const fakeAnswer: Answer = {
        id: "calibration-test",
        sessionId: "calibration-test",
        questionId: tc.questionId,
        review: level.answer,
        status: "submitted",
        createdAt: new Date().toISOString(),
      };

      process.stdout.write(`  ${level.expected}pt →`);
      try {
        const result = await callEval(fakeAnswer, questionWithRubric);
        const actual = result.score;
        const delta = actual != null ? actual - level.expected : 0;
        const pass = actual != null && Math.abs(delta) <= 20; // within ±20 points
        levelResults.push({ expected: level.expected, actual, delta, pass });
        process.stdout.write(` ${actual}pt (${delta >= 0 ? "+" : ""}${delta}) ${pass ? "✓" : "✗"}\n`);
      } catch (err) {
        levelResults.push({ expected: level.expected, actual: null, delta: 0, pass: false });
        process.stdout.write(` ERROR\n`);
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    const expectedScores = levelResults.map((l) => l.expected);
    const actualScores = levelResults.map((l) => l.actual ?? 0);
    const corr = spearmanCorrelation(expectedScores, actualScores);
    const mono = isMonotonic(levelResults.map((l) => l.actual));

    results.push({
      questionId: tc.questionId,
      category: tc.category,
      title: question.title,
      levels: levelResults,
      correlation: Math.round(corr * 1000) / 1000,
      monotonic: mono,
    });

    console.log(`  Correlation: ${corr.toFixed(3)} | Monotonic: ${mono ? "YES" : "NO"}\n`);
  }

  // ── Summary ──
  console.log(`\n${"═".repeat(100)}`);
  console.log("CALIBRATION RESULTS");
  console.log("═".repeat(100));
  console.log(
    "Category".padEnd(20) +
    "Question".padEnd(32) +
    "20→".padEnd(8) +
    "40→".padEnd(8) +
    "60→".padEnd(8) +
    "80→".padEnd(8) +
    "100→".padEnd(8) +
    "Corr".padEnd(8) +
    "Mono"
  );
  console.log("─".repeat(100));

  for (const r of results) {
    const scores = r.levels.map((l) => l.actual != null ? String(l.actual) : "ERR");
    console.log(
      r.category.padEnd(20) +
      r.title.slice(0, 30).padEnd(32) +
      scores.map((s) => s.padEnd(8)).join("") +
      String(r.correlation).padEnd(8) +
      (r.monotonic ? "YES" : "NO")
    );
  }
  console.log("─".repeat(100));

  const avgCorr = results.reduce((s, r) => s + r.correlation, 0) / results.length;
  const monoCount = results.filter((r) => r.monotonic).length;
  const totalLevels = results.reduce((s, r) => s + r.levels.length, 0);
  const passCount = results.reduce((s, r) => s + r.levels.filter((l) => l.pass).length, 0);

  console.log(`\nAvg Correlation: ${avgCorr.toFixed(3)}`);
  console.log(`Monotonic: ${monoCount}/${results.length}`);
  console.log(`Within ±20pt: ${passCount}/${totalLevels} (${Math.round(passCount / totalLevels * 100)}%)`);

  // ── Identify Problems ──
  console.log(`\n${"═".repeat(100)}`);
  console.log("PROBLEMS");
  console.log("═".repeat(100));

  let problems = 0;
  for (const r of results) {
    for (const l of r.levels) {
      if (!l.pass) {
        problems++;
        console.log(`✗ ${r.category} / ${r.title.slice(0, 30)} — expected ${l.expected}, got ${l.actual} (delta: ${l.delta > 0 ? "+" : ""}${l.delta})`);
      }
    }
    if (!r.monotonic) {
      problems++;
      const scores = r.levels.map((l) => l.actual ?? "?").join(" → ");
      console.log(`✗ ${r.category} / ${r.title.slice(0, 30)} — NOT monotonic: ${scores}`);
    }
    if (r.correlation < 0.8) {
      problems++;
      console.log(`✗ ${r.category} / ${r.title.slice(0, 30)} — low correlation: ${r.correlation}`);
    }
  }

  if (problems === 0) {
    console.log("No problems found! All calibrations within tolerance.");
  }

  // ── Save Report ──
  if (SAVE) {
    const reportPath = resolve(__dirname, "..", "..", "..", "..", "docs", "eval-calibration-report.md");
    const now = new Date().toISOString().split("T")[0];

    let md = `# Evaluation Calibration Report\n\n`;
    md += `**Date:** ${now}  \n`;
    md += `**Model:** ${MODEL}  \n`;
    md += `**Questions:** ${results.length}  \n`;
    md += `**Evaluations:** ${totalLevels}  \n`;
    md += `**Tolerance:** ±20 points  \n\n`;

    md += `## Summary\n\n`;
    md += `| Category | Question | 20pt | 40pt | 60pt | 80pt | 100pt | Correlation | Monotonic |\n`;
    md += `|----------|----------|------|------|------|------|-------|-------------|----------|\n`;
    for (const r of results) {
      const scores = r.levels.map((l) => l.actual != null ? `${l.actual}` : "ERR");
      md += `| ${r.category} | ${r.title.slice(0, 40)} | ${scores.join(" | ")} | ${r.correlation} | ${r.monotonic ? "YES" : "NO"} |\n`;
    }

    md += `\n**Avg Correlation:** ${avgCorr.toFixed(3)}  \n`;
    md += `**Monotonic:** ${monoCount}/${results.length}  \n`;
    md += `**Within ±20pt:** ${passCount}/${totalLevels} (${Math.round(passCount / totalLevels * 100)}%)  \n`;

    if (problems > 0) {
      md += `\n## Problems\n\n`;
      for (const r of results) {
        const rProblems: string[] = [];
        for (const l of r.levels) {
          if (!l.pass) {
            rProblems.push(`Expected ${l.expected}pt, got ${l.actual}pt (${l.delta > 0 ? "+" : ""}${l.delta})`);
          }
        }
        if (!r.monotonic) rProblems.push(`Not monotonic: ${r.levels.map((l) => l.actual ?? "?").join(" → ")}`);
        if (r.correlation < 0.8) rProblems.push(`Low correlation: ${r.correlation}`);

        if (rProblems.length > 0) {
          md += `### ${r.category} — ${r.title}\n`;
          for (const p of rProblems) md += `- ${p}\n`;
          md += `\n`;
        }
      }
    }

    md += `\n## Detailed Results\n\n`;
    for (const r of results) {
      md += `### ${r.category} — ${r.title}\n\n`;
      md += `| Expected | Actual | Delta | Status |\n`;
      md += `|----------|--------|-------|--------|\n`;
      for (const l of r.levels) {
        const status = l.pass ? "PASS" : "FAIL";
        md += `| ${l.expected} | ${l.actual ?? "ERR"} | ${l.delta > 0 ? "+" : ""}${l.delta} | ${status} |\n`;
      }
      md += `\nCorrelation: ${r.correlation} | Monotonic: ${r.monotonic ? "YES" : "NO"}\n\n`;
    }

    writeFileSync(reportPath, md);
    console.log(`\nReport saved to: docs/eval-calibration-report.md`);
  }

  const allGood = problems === 0;
  process.exit(allGood ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
