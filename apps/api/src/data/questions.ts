export interface Question {
  id: string;
  category: string;    // 대분류: code_review, system_design, debugging, data_analysis, practical_coding
  type: string;        // 서브카테고리: security_review, scalability, runtime_error, sql_query, etc.
  language?: string;   // practical_coding 전용: java, python, c_cpp, javascript, rust, go, kotlin, typescript
  title: string;
  prompt: string;
  diff: string;
  guest?: boolean;
  rubric: {
    mustCover: string[];
    strongSignals: string[];
    weakPatterns: string[];
  };
}

const questions: Question[] = [
  // ════════════════════════════════════════════════════════
  //  CODE REVIEW
  // ════════════════════════════════════════════════════════

  // ── Security Review ────────────────────────────────────
  {
    id: "cr_security_001",
    category: "code_review",
    type: "security_review",
    guest: true,
    title: "Review an unescaped user input in SQL query",
    prompt:
      "Review the diff and identify all security and correctness issues before this is merged.",
    diff: `diff --git a/src/api/search.js b/src/api/search.js
--- a/src/api/search.js
+++ b/src/api/search.js
@@ -7,12 +7,10 @@
 router.get('/search', async (req, res) => {
   const { q, limit } = req.query;
-  const sanitized = q.replace(/[^a-zA-Z0-9 ]/g, '');
-  const results = await pool.query(
-    'SELECT id, name FROM products WHERE name ILIKE $1 LIMIT $2',
-    [\`%\${sanitized}%\`, Math.min(parseInt(limit) || 20, 100)]
-  );
-  res.json({ results: results.rows });
+  const results = await pool.query(
+    \`SELECT id, name, price FROM products WHERE name ILIKE '%\${q}%' ORDER BY price LIMIT \${limit}\`
+  );
+  res.json({ results: results.rows });
 });`,
    rubric: {
      mustCover: [
        "String interpolation of user input (q) directly into SQL creates a SQL injection vulnerability — an attacker can read, modify, or delete arbitrary data.",
        "The limit parameter is also interpolated without validation, enabling injection or query manipulation via non-numeric input.",
        "The original code used parameterized queries ($1, $2) which were safe — this change removes that protection.",
      ],
      strongSignals: [
        "Explains the specific attack vector — e.g., q = \"'; DROP TABLE products; --\" or UNION-based data exfiltration.",
        "Notes that the price column was added to the SELECT, potentially exposing data that was intentionally hidden.",
        "Recommends restoring parameterized queries and validating/capping the limit server-side.",
      ],
      weakPatterns: [
        "Mentions SQL injection as a general concept without explaining how it applies to this specific diff.",
        "Only flags one of the two injection points (q or limit) but misses the other.",
      ],
    },
  },
  {
    id: "cr_security_002",
    category: "code_review",
    type: "security_review",
    title: "Review a password comparison using timing-unsafe equality",
    prompt:
      "Review the diff and identify the security issues and any other problems with this authentication change.",
    diff: `diff --git a/src/auth/login.js b/src/auth/login.js
--- a/src/auth/login.js
+++ b/src/auth/login.js
@@ -3,18 +3,16 @@
-import bcrypt from 'bcrypt';

 export async function authenticate(email, password) {
   const user = await findUserByEmail(email);
-  if (!user) {
-    // constant-time comparison even for missing users
-    await bcrypt.compare(password, '$2b$10$placeholder.hash.value');
-    return { ok: false, error: 'invalid_credentials' };
-  }
-  const match = await bcrypt.compare(password, user.passwordHash);
-  if (!match) return { ok: false, error: 'invalid_credentials' };
+  if (!user) return { ok: false, error: 'user_not_found' };
+  if (password !== user.passwordHash) {
+    return { ok: false, error: 'wrong_password' };
+  }
   return { ok: true, user: { id: user.id, email: user.email } };
 }`,
    rubric: {
      mustCover: [
        "Comparing plaintext password against the stored hash with === will never match a bcrypt hash — this completely breaks authentication, no user can log in.",
        "The different error messages ('user_not_found' vs 'wrong_password') enable user enumeration — attackers can discover which emails have accounts.",
        "Removing bcrypt means passwords are now compared in plaintext, implying the system may be storing passwords unhashed, which is a critical security violation.",
      ],
      strongSignals: [
        "Notes that the original code used a constant-time placeholder comparison for missing users to prevent timing-based enumeration.",
        "Explains that === string comparison is vulnerable to timing attacks even if the hash comparison were correct.",
        "Recommends restoring bcrypt and using a single generic error message for all auth failures.",
      ],
      weakPatterns: [
        "Only mentions that bcrypt was removed without explaining why plaintext comparison is catastrophic.",
        "Focuses on code style or simplification without recognizing the security regression.",
      ],
    },
  },
  {
    id: "cr_security_003",
    category: "code_review",
    type: "security_review",
    title: "Review a JWT token stored in localStorage with no expiry check",
    prompt:
      "Review the diff and identify all security risks in this authentication token handling change.",
    diff: `diff --git a/src/lib/auth.js b/src/lib/auth.js
--- a/src/lib/auth.js
+++ b/src/lib/auth.js
@@ -1,18 +1,12 @@
-import { jwtVerify } from 'jose';
-
-const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
-
-export async function getUser(req) {
-  const token = req.cookies.get('session_token')?.value;
-  if (!token) return null;
-  try {
-    const { payload } = await jwtVerify(token, SECRET);
-    if (payload.exp && payload.exp < Date.now() / 1000) return null;
-    return { id: payload.sub, role: payload.role };
-  } catch {
-    return null;
-  }
+export function getUser() {
+  const token = localStorage.getItem('auth_token');
+  if (!token) return null;
+  const payload = JSON.parse(atob(token.split('.')[1]));
+  return { id: payload.sub, role: payload.role };
 }
+
+export function setUser(token) {
+  localStorage.setItem('auth_token', token);
+}`,
    rubric: {
      mustCover: [
        "localStorage is accessible to any JavaScript on the page — XSS attacks can steal the token. HttpOnly cookies were immune to this.",
        "The JWT signature is never verified — atob only decodes the payload. An attacker can forge any token with any role.",
        "Token expiry check was removed — expired tokens are now accepted indefinitely.",
      ],
      strongSignals: [
        "Explains that moving from HttpOnly cookie to localStorage fundamentally changes the threat model from server-side to client-side.",
        "Notes that JSON.parse(atob(...)) will throw on malformed tokens with no error handling.",
        "Recommends keeping server-side verification and HttpOnly cookies, with CSRF protection.",
      ],
      weakPatterns: [
        "Only mentions 'localStorage is insecure' without explaining the XSS vector.",
        "Focuses on the code being simpler without noting the removed signature verification.",
      ],
    },
  },

  // ── Performance Review ─────────────────────────────────
  {
    id: "cr_performance_001",
    category: "code_review",
    type: "performance_review",
    guest: true,
    title: "Review a risky null-handling change",
    prompt:
      "Review the diff and explain the most important issues, risks, and next steps before merging it.",
    diff: `diff --git a/src/payments/checkout.js b/src/payments/checkout.js
--- a/src/payments/checkout.js
+++ b/src/payments/checkout.js
@@ -12,11 +12,11 @@
   const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);
   const discount = coupon ? await getCouponDiscount(coupon.code) : 0;

-  const total = Math.max(subtotal - discount, 0);
+  const total = subtotal - discount;

   return {
     subtotal,
     discount,
-    total,
+    total: total.toFixed(2),
   };
 }`,
    rubric: {
      mustCover: [
        "Removing the lower bound can produce negative totals when the discount exceeds the subtotal.",
        "toFixed() returns a string, changing the response contract from number to string.",
        "The change needs regression tests for zero-total and over-discount edge cases.",
      ],
      strongSignals: [
        "Mentions downstream breakage if callers do arithmetic on the total field.",
        "Suggests a schema or type check to catch contract drift.",
      ],
      weakPatterns: [
        "Only notes that toFixed changes precision without mentioning the type change.",
        "Approves or dismisses the change without addressing both issues.",
      ],
    },
  },
  {
    id: "cr_performance_002",
    category: "code_review",
    type: "performance_review",
    title: "Review a pagination change that fetches all rows",
    prompt:
      "Review the diff and assess the performance, correctness, and operational risks of this change.",
    diff: `diff --git a/src/api/users.js b/src/api/users.js
--- a/src/api/users.js
+++ b/src/api/users.js
@@ -3,16 +3,12 @@
 router.get('/users', adminOnly, async (req, res) => {
-  const page = Math.max(1, parseInt(req.query.page) || 1);
-  const perPage = Math.min(parseInt(req.query.perPage) || 25, 100);
-  const offset = (page - 1) * perPage;
-
-  const [rows, countResult] = await Promise.all([
-    pool.query('SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [perPage, offset]),
-    pool.query('SELECT count(*) FROM users'),
-  ]);
-  const total = parseInt(countResult.rows[0].count);
-  res.json({ users: rows.rows, page, perPage, total, totalPages: Math.ceil(total / perPage) });
+  const { rows } = await pool.query(
+    'SELECT * FROM users ORDER BY created_at DESC'
+  );
+  const page = parseInt(req.query.page) || 1;
+  const perPage = parseInt(req.query.perPage) || 25;
+  const start = (page - 1) * perPage;
+  res.json({ users: rows.slice(start, start + perPage), total: rows.length });
 });`,
    rubric: {
      mustCover: [
        "SELECT * FROM users with no LIMIT fetches every row into application memory — this will crash or OOM the server as the users table grows.",
        "SELECT * instead of named columns exposes all fields (password hashes, tokens, internal flags) in the query result, even if .slice trims the response — a data leak risk.",
        "The perPage parameter is no longer capped, so a client can request perPage=999999 and receive the entire table in one response.",
      ],
      strongSignals: [
        "Calculates the concrete impact: 1M users × ~1KB/row ≈ 1GB loaded per request.",
        "Notes that the original LIMIT/OFFSET pushed pagination to the database, which is orders of magnitude more efficient.",
        "Points out that removing the adminOnly check for perPage max creates an abuse vector.",
      ],
      weakPatterns: [
        "Only mentions that the code 'moves pagination to JS' without quantifying the risk.",
        "Suggests adding a LIMIT without noticing the SELECT * column exposure problem.",
      ],
    },
  },
  {
    id: "cr_performance_003",
    category: "code_review",
    type: "performance_review",
    title: "Review a caching change that ignores user context",
    prompt:
      "Review the diff and explain what problems this caching approach introduces and how to fix them.",
    diff: `diff --git a/src/api/dashboard.js b/src/api/dashboard.js
--- a/src/api/dashboard.js
+++ b/src/api/dashboard.js
@@ -1,12 +1,18 @@
 import { getDashboardData } from '../services/dashboard.js';
+import NodeCache from 'node-cache';
+
+const cache = new NodeCache({ stdTTL: 300 });

 router.get('/dashboard', authMiddleware, async (req, res) => {
-  const data = await getDashboardData(req.user.id, req.user.role);
-  res.json({ ok: true, data });
+  const cached = cache.get('dashboard');
+  if (cached) {
+    return res.json({ ok: true, data: cached });
+  }
+  const data = await getDashboardData(req.user.id, req.user.role);
+  cache.set('dashboard', data);
+  res.json({ ok: true, data });
 });`,
    rubric: {
      mustCover: [
        "The cache key is a single global string ('dashboard') but the data is user-specific (uses req.user.id and role) — every user will see the first user's cached dashboard data.",
        "This is a data leakage bug — User A's private dashboard data (financials, stats, PII) will be served to User B.",
        "The 5-minute TTL means the wrong data persists for up to 5 minutes, affecting every request in that window.",
      ],
      strongSignals: [
        "Recommends a cache key that includes the user ID and role, e.g., `dashboard:${userId}:${role}`.",
        "Notes that in-process caching (NodeCache) won't work in multi-instance deployments — suggests Redis or CDN-level caching.",
        "Mentions that dashboard data may contain sensitive information, making this a privacy/compliance issue, not just a bug.",
      ],
      weakPatterns: [
        "Only mentions performance benefits of caching without noticing the data leakage.",
        "Suggests increasing or decreasing TTL without addressing the cache key problem.",
      ],
    },
  },

  // ── Logic Review ───────────────────────────────────────
  {
    id: "cr_logic_001",
    category: "code_review",
    type: "logic_review",
    title: "Review a race condition in user balance update",
    prompt:
      "Review the diff and explain the risks, edge cases, and what you would change before approving.",
    diff: `diff --git a/src/services/wallet.js b/src/services/wallet.js
--- a/src/services/wallet.js
+++ b/src/services/wallet.js
@@ -5,14 +5,11 @@
 export async function deductBalance(userId, amount) {
-  const user = await db.users.findOne({ id: userId });
-  if (user.balance < amount) {
-    throw new InsufficientFundsError(user.balance, amount);
-  }
-  await db.users.update(
-    { id: userId },
-    { balance: user.balance - amount }
-  );
-  return { newBalance: user.balance - amount };
+  const user = await db.users.findOne({ id: userId });
+  if (user.balance < amount) {
+    throw new InsufficientFundsError(user.balance, amount);
+  }
+  user.balance -= amount;
+  await user.save();
+  return { newBalance: user.balance };
 }`,
    rubric: {
      mustCover: [
        "Read-then-write without a transaction or atomic update creates a race condition — two concurrent deductions can both pass the balance check and overdraw the account.",
        "The in-memory mutation (user.balance -= amount) means the returned newBalance is based on stale data if another request modified the row between read and save.",
        "There is no input validation — amount could be negative, zero, or non-numeric, allowing balance manipulation.",
      ],
      strongSignals: [
        "Recommends an atomic UPDATE ... SET balance = balance - amount WHERE balance >= amount pattern.",
        "Suggests wrapping the operation in a database transaction with row-level locking.",
        "Notes that the function should validate amount > 0 at the boundary.",
      ],
      weakPatterns: [
        "Only mentions the code style change (ORM save vs raw update) without noting concurrency risk.",
        "Approves the change because it 'looks cleaner' without analyzing the behavioral difference.",
      ],
    },
  },
  {
    id: "cr_logic_002",
    category: "code_review",
    type: "logic_review",
    title: "Review a timezone-unaware date comparison",
    prompt:
      "Review the diff and identify the correctness bugs, edge cases, and risks in this scheduling logic.",
    diff: `diff --git a/src/services/scheduler.js b/src/services/scheduler.js
--- a/src/services/scheduler.js
+++ b/src/services/scheduler.js
@@ -3,18 +3,12 @@
 export async function getUpcomingEvents(userId) {
-  const now = new Date();
-  const events = await db.events.find({
-    userId,
-    startsAt: { $gte: now.toISOString() },
-  });
-  return events.map(e => ({
-    ...e,
-    startsAt: new Date(e.startsAt),
-    displayTime: formatInUserTimezone(e.startsAt, e.timezone),
-  }));
+  const today = new Date().toLocaleDateString();
+  const events = await db.events.find({ userId });
+  return events.filter(e => {
+    const eventDate = new Date(e.startsAt).toLocaleDateString();
+    return eventDate >= today;
+  });
 }`,
    rubric: {
      mustCover: [
        "toLocaleDateString() returns a locale-dependent string (e.g., '4/11/2026' vs '11/04/2026') — string comparison with >= produces wrong results depending on server locale and date format.",
        "All events are fetched from the database and filtered in JS instead of using a database query — this becomes a full table scan as events grow.",
        "The user's timezone-aware display (formatInUserTimezone) was removed — all times are now in server-local timezone, which is wrong for users in other timezones.",
      ],
      strongSignals: [
        "Gives a concrete example: '4/2/2026' >= '12/1/2025' is false in string comparison because '4' < '1' lexicographically.",
        "Recommends ISO 8601 format (YYYY-MM-DD) if string comparison is needed, or proper Date object comparison.",
        "Notes that the original DB-side filter ($gte with ISO string) was both correct and more efficient.",
      ],
      weakPatterns: [
        "Only says 'date comparison might be off' without explaining why string comparison fails.",
        "Focuses on code brevity without noticing the timezone regression.",
      ],
    },
  },

  // ── API Review ─────────────────────────────────────────
  {
    id: "cr_api_001",
    category: "code_review",
    type: "api_review",
    title: "Review a silent error swallow in async handler",
    prompt:
      "Review the diff and identify the most critical risks before this is merged to production.",
    diff: `diff --git a/src/api/orders.js b/src/api/orders.js
--- a/src/api/orders.js
+++ b/src/api/orders.js
@@ -18,12 +18,10 @@
   try {
     const order = await createOrder(req.body);
-    await sendOrderConfirmationEmail(order);
-    res.status(201).json({ ok: true, orderId: order.id });
+    sendOrderConfirmationEmail(order).catch(() => {});
+    res.status(201).json({ ok: true, orderId: order.id });
   } catch (error) {
-    logger.error('Order creation failed', { error });
-    res.status(500).json({ error: 'Order creation failed' });
+    res.status(500).json({ error: error.message });
   }
 });`,
    rubric: {
      mustCover: [
        "The email error is silently swallowed — failures are invisible in logs and monitoring.",
        "Exposing error.message in the 500 response leaks internal implementation details to clients.",
        "Fire-and-forget email means there is no retry, no dead-letter queue, and no alerting.",
      ],
      strongSignals: [
        "Recommends structured logging instead of raw error.message in the response.",
        "Proposes a background job or queue for email delivery instead of fire-and-forget.",
        "Notes that silent catch blocks are an observability antipattern.",
      ],
      weakPatterns: [
        "Focuses only on the UX of the email without noting the security leak.",
        "Approves the fire-and-forget pattern without noting failure visibility.",
      ],
    },
  },
  {
    id: "cr_api_002",
    category: "code_review",
    type: "api_review",
    title: "Review a memory leak in event listener setup",
    prompt:
      "Review the diff and explain the runtime risks, potential failures, and what should be changed.",
    diff: `diff --git a/src/components/LiveChart.jsx b/src/components/LiveChart.jsx
--- a/src/components/LiveChart.jsx
+++ b/src/components/LiveChart.jsx
@@ -1,20 +1,15 @@
-import { useEffect, useRef, useState } from 'react';
+import { useState } from 'react';
 import { socket } from '../lib/socket';

 export function LiveChart({ channelId }) {
   const [points, setPoints] = useState([]);
-  const channelRef = useRef(channelId);
-
-  useEffect(() => {
-    channelRef.current = channelId;
-    const handler = (data) => {
-      if (data.channel === channelRef.current) {
-        setPoints((prev) => [...prev, data.point].slice(-100));
-      }
-    };
-    socket.on('tick', handler);
-    return () => socket.off('tick', handler);
-  }, [channelId]);
+
+  socket.on('tick', (data) => {
+    if (data.channel === channelId) {
+      setPoints((prev) => [...prev, data.point]);
+    }
+  });

   return <canvas data-points={JSON.stringify(points)} />;
 }`,
    rubric: {
      mustCover: [
        "Moving socket.on outside useEffect means a new listener is registered on every render — this is a memory leak that causes exponential handler accumulation.",
        "There is no cleanup (socket.off) — old listeners are never removed, so even after unmounting, the component's handlers keep firing and calling setPoints on an unmounted component.",
        "The .slice(-100) cap was removed, so the points array grows unbounded, eventually causing performance degradation or an out-of-memory crash.",
      ],
      strongSignals: [
        "Explains that N renders = N active listeners, each firing on every tick, causing O(N) work per event.",
        "Notes the React warning: 'Can't perform a state update on an unmounted component' and potential memory leak from stale closures.",
        "Recommends restoring useEffect with a cleanup return and keeping the bounded slice.",
      ],
      weakPatterns: [
        "Only mentions that useEffect was removed without explaining the consequence of listener accumulation.",
        "Says the code 'works' because data still arrives, missing the performance and memory implications.",
      ],
    },
  },
  {
    id: "cr_api_003",
    category: "code_review",
    type: "api_review",
    title: "Review an environment variable change that breaks 12-factor config",
    prompt:
      "Review the diff and explain the operational risks, failure modes, and what you would recommend.",
    diff: `diff --git a/src/config.js b/src/config.js
--- a/src/config.js
+++ b/src/config.js
@@ -1,16 +1,12 @@
-const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
-
-for (const key of requiredVars) {
-  if (!process.env[key]) {
-    console.error(\`Missing required env var: \${key}\`);
-    process.exit(1);
-  }
-}
-
 export const config = {
-  databaseUrl: process.env.DATABASE_URL,
-  redisUrl: process.env.REDIS_URL,
-  jwtSecret: process.env.JWT_SECRET,
-  port: parseInt(process.env.PORT) || 3000,
+  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
+  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
+  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-123',
+  port: parseInt(process.env.PORT) || 3000,
 };`,
    rubric: {
      mustCover: [
        "The hardcoded JWT secret fallback means production will silently use a known, insecure secret if the env var is missing — any attacker can forge tokens.",
        "Removing the startup validation means the app will boot with default database/Redis URLs in production, silently connecting to the wrong (or nonexistent) services instead of failing fast.",
        "The default database and Redis URLs point to localhost, which will silently fail or connect to unintended services in containerized/cloud deployments.",
      ],
      strongSignals: [
        "Explains the 12-factor app principle: config from env vars, fail fast on missing secrets.",
        "Notes that a default JWT secret is equivalent to no authentication — any party can mint valid tokens.",
        "Recommends keeping the startup guard for secrets and only using defaults for non-sensitive config like PORT.",
      ],
      weakPatterns: [
        "Only mentions that defaults are 'convenient for development' without analyzing production impact.",
        "Approves the change because it reduces boilerplate without checking the security implications.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  SYSTEM DESIGN
  // ════════════════════════════════════════════════════════

  // ── Scalability ────────────────────────────────────────
  {
    id: "sd_scalability_001",
    category: "system_design",
    type: "scalability",
    guest: true,
    title: "Design a URL shortener that handles 100M+ links",
    prompt:
      "Design a URL shortening service (like bit.ly). Explain the data model, API, key generation strategy, and how you'd handle 10,000 writes/sec and 100,000 reads/sec. Address collision handling and analytics.",
    diff: `## Requirements
- Shorten long URLs to short aliases (e.g., lgtm.sh/abc123)
- Redirect short URLs to original URLs with <50ms p99 latency
- Track click analytics (count, referrer, geo)
- Handle 10K writes/sec, 100K reads/sec
- Links expire after configurable TTL (default 2 years)
- Custom aliases supported (optional)

## Constraints
- Short code must be 6-8 characters
- No two URLs should map to the same short code
- System must be available 99.99%
- Budget: moderate (cloud-native, not unlimited)

## Your Task
Design the system. Cover: data model, API endpoints,
key generation, read/write path, caching strategy,
and how you'd scale each component.`,
    rubric: {
      mustCover: [
        "Key generation strategy — base62 encoding of auto-increment ID, pre-generated key pool, or hash-based with collision check. Must explain tradeoffs.",
        "Read path optimization — cache layer (Redis/Memcached) in front of DB for redirect lookups, since reads dominate writes 10:1.",
        "Data model — at minimum: short_code (PK), original_url, created_at, expires_at, user_id. Explain indexing strategy.",
      ],
      strongSignals: [
        "Discusses pre-generated key service to avoid collision under high concurrency.",
        "Addresses analytics as a separate write path (async event stream, not synchronous DB write on redirect).",
        "Calculates storage: 100M links × ~2KB = ~200GB, fits in single DB with read replicas.",
      ],
      weakPatterns: [
        "Only says 'use a hash function' without addressing collision probability or resolution.",
        "Ignores caching entirely despite the 100K reads/sec requirement.",
      ],
    },
  },
  {
    id: "sd_scalability_002",
    category: "system_design",
    type: "scalability",
    title: "Design a real-time notification system for 10M users",
    prompt:
      "Design a notification system that delivers push notifications, in-app notifications, and email digests to 10M active users. Cover the architecture, delivery guarantees, and how you'd handle fan-out for viral content.",
    diff: `## Requirements
- Support push (mobile), in-app (WebSocket), and email channels
- User preferences: per-channel opt-in/opt-out
- Guaranteed delivery: at-least-once for critical, best-effort for social
- Fan-out: single event can notify 1M+ followers (celebrity post)
- Real-time: in-app notifications within 2 seconds
- Daily email digest option

## Constraints
- 10M daily active users
- 500M notifications/day
- Peak: 50K notifications/sec
- Must not lose critical notifications (payment, security)
- Budget-conscious: minimize per-notification cost

## Your Task
Design the architecture. Cover: event ingestion, fan-out strategy,
delivery pipeline per channel, failure handling, and user preference management.`,
    rubric: {
      mustCover: [
        "Fan-out strategy — pull vs push model. For high-follower accounts, pull-based (read-time fan-out) avoids writing millions of rows per event.",
        "Channel routing — a preference service that checks user settings before dispatching to push/in-app/email workers.",
        "Delivery guarantees — message queue (Kafka/SQS) with retry for critical notifications, separate best-effort path for social.",
      ],
      strongSignals: [
        "Proposes hybrid fan-out: push for normal users (<10K followers), pull for celebrities (>10K followers).",
        "Designs the email digest as a batch job (cron) that aggregates unread notifications, not individual sends.",
        "Addresses WebSocket connection management — sticky sessions or connection registry for in-app delivery.",
      ],
      weakPatterns: [
        "Treats all notifications the same without distinguishing critical vs social delivery guarantees.",
        "Ignores the fan-out problem and assumes linear write for all events.",
      ],
    },
  },

  // ── Database Design ────────────────────────────────────
  {
    id: "sd_database_001",
    category: "system_design",
    type: "database_design",
    title: "Design a schema for a multi-tenant SaaS application",
    prompt:
      "Design the database schema for a multi-tenant project management tool (like Jira). Each tenant (company) has users, projects, and tasks. Address data isolation, query performance, and migration strategy.",
    diff: `## Requirements
- Multi-tenant: each company sees only their data
- Entities: tenants, users, projects, tasks, comments
- Tasks have: status, assignee, priority, labels, due date
- Users can belong to multiple projects within their tenant
- Support filtering/sorting tasks by any field
- Audit log for all task changes

## Constraints
- 10,000 tenants, largest has 50,000 tasks
- 99th percentile query latency < 100ms
- Must support tenant data export and deletion (GDPR)
- PostgreSQL as primary database

## Your Task
Design the schema. Cover: table structure, multi-tenancy strategy,
indexing plan, and how you'd handle tenant isolation.`,
    rubric: {
      mustCover: [
        "Multi-tenancy strategy — shared DB with tenant_id column (row-level isolation) vs schema-per-tenant vs DB-per-tenant. Must justify the choice with tradeoffs.",
        "Row-level security or application-level tenant filtering — every query must scope to tenant_id to prevent data leakage.",
        "Indexing strategy — composite indexes starting with tenant_id (e.g., tenant_id + status, tenant_id + assignee_id) for efficient filtered queries.",
      ],
      strongSignals: [
        "Recommends PostgreSQL Row-Level Security (RLS) policies as defense-in-depth alongside application filtering.",
        "Designs the audit log as an append-only table with tenant_id, entity_type, entity_id, action, old_value, new_value, actor_id, timestamp.",
        "Addresses GDPR deletion — soft delete with tenant-scoped cascade, or hard delete with foreign key cascade strategy.",
      ],
      weakPatterns: [
        "Picks a tenancy model without explaining why or acknowledging tradeoffs.",
        "Ignores tenant_id in index design, leading to full table scans.",
      ],
    },
  },

  // ── API Architecture ───────────────────────────────────
  {
    id: "sd_api_001",
    category: "system_design",
    type: "api_architecture",
    title: "Design a rate limiter for a public API",
    prompt:
      "Design a rate limiting system for a public REST API serving 50,000 requests/sec. Cover the algorithm, storage, distributed behavior, and how you'd handle edge cases.",
    diff: `## Requirements
- Rate limit per API key: 1000 req/min for free tier, 10,000 for paid
- Rate limit per IP for unauthenticated requests: 100 req/min
- Return standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Graceful degradation: rate limiter failure should not block requests
- Support burst allowance (short spikes above limit)

## Constraints
- 50,000 total requests/sec across all clients
- Distributed: 20+ API server instances behind a load balancer
- Must be consistent across instances (no per-instance counting)
- Latency overhead < 5ms per request
- Redis available as shared state store

## Your Task
Design the rate limiter. Cover: algorithm choice, storage design,
distributed coordination, and failure modes.`,
    rubric: {
      mustCover: [
        "Algorithm choice — Token Bucket or Sliding Window Log/Counter. Must explain why and the tradeoffs vs Fixed Window (burst at boundaries) or Leaky Bucket (no burst).",
        "Distributed state — Redis as shared counter store, using atomic operations (INCR + EXPIRE or Lua script) to avoid race conditions across instances.",
        "Failure mode — if Redis is down, fail-open (allow requests) to avoid total API outage, with local fallback counting.",
      ],
      strongSignals: [
        "Proposes Sliding Window Counter as a compromise: less memory than log, smoother than fixed window.",
        "Designs the Redis key structure: ratelimit:{api_key}:{window_timestamp} with TTL matching the window.",
        "Addresses the thundering herd problem at window boundaries and proposes jitter or token bucket for smoothing.",
      ],
      weakPatterns: [
        "Only describes one algorithm without comparing alternatives.",
        "Uses in-memory per-instance counters without addressing distributed consistency.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  DEBUGGING
  // ════════════════════════════════════════════════════════

  // ── Runtime Error ──────────────────────────────────────
  {
    id: "debug_runtime_001",
    category: "debugging",
    type: "runtime_error",
    guest: true,
    title: "Debug a TypeError in production API response handling",
    prompt:
      "The following API endpoint crashes intermittently in production with 'TypeError: Cannot read properties of undefined (reading \"map\")'. Analyze the code, identify all possible causes, and propose a fix.",
    diff: `// Error log:
// TypeError: Cannot read properties of undefined (reading 'map')
//   at GET /api/dashboard (dashboard.js:15:38)
// Frequency: ~2% of requests, mostly during peak hours

async function getDashboard(req, res) {
  const userId = req.user.id;

  const [profile, orders, recommendations] = await Promise.all([
    fetchUserProfile(userId),
    fetchRecentOrders(userId),
    fetchRecommendations(userId),
  ]);

  const orderSummary = orders.items.map(order => ({
    id: order.id,
    total: order.total,
    status: order.status,
  }));

  const recList = recommendations.products.map(p => ({
    name: p.name,
    score: p.relevance,
  }));

  res.json({
    name: profile.name,
    recentOrders: orderSummary,
    recommendations: recList,
    memberSince: profile.createdAt,
  });
}`,
    rubric: {
      mustCover: [
        "Promise.all fails fast on the first rejection but still resolves the others — if one service is slow/failing, the others may resolve with undefined or partial data.",
        "orders.items and recommendations.products assume the response shape is always correct. If either service returns null, {}, or an error response, .map crashes.",
        "The 2% failure rate during peak hours suggests timeout or service degradation — one of the downstream services intermittently returns an unexpected shape.",
      ],
      strongSignals: [
        "Recommends Promise.allSettled instead of Promise.all to handle partial failures gracefully.",
        "Suggests defensive checks: orders?.items?.map() or validation of response shape before accessing nested properties.",
        "Notes that the error could be in fetchRecentOrders returning { items: undefined } when the order service times out or returns an error wrapper.",
      ],
      weakPatterns: [
        "Only says 'add null checks' without explaining why the data is null in the first place.",
        "Blames the client for sending bad requests without analyzing the server-side failure pattern.",
      ],
    },
  },
  {
    id: "debug_runtime_002",
    category: "debugging",
    type: "runtime_error",
    title: "Debug an intermittent CORS error in production",
    prompt:
      "Users report 'CORS policy: No Access-Control-Allow-Origin header' errors that appear randomly. The API works fine in development. Analyze the code and configuration to find the root cause.",
    diff: `// Nginx config (reverse proxy)
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

// Express app (port 3000)
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'https://app.example.com',
  credentials: true,
}));

// Health check (before CORS middleware in some deployments)
app.get('/health', (req, res) => res.json({ ok: true }));

// API routes
app.use('/api', apiRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Report: CORS error occurs ~5% of requests
// More frequent during deployments and high traffic
// Browser shows: "has been blocked by CORS policy"
// Preflight OPTIONS requests sometimes fail`,
    rubric: {
      mustCover: [
        "The error handler does not set CORS headers — when an unhandled error occurs, the 500 response has no Access-Control-Allow-Origin header, causing the browser to report CORS error instead of the actual 500 error.",
        "Nginx doesn't handle OPTIONS preflight requests — if the proxy_pass fails or times out, Nginx returns a response without CORS headers.",
        "During deployments, the upstream (localhost:3000) may be temporarily unavailable. Nginx returns 502/504 without CORS headers, which the browser reports as a CORS error.",
      ],
      strongSignals: [
        "Recommends adding CORS headers at the Nginx level as a fallback, so even proxy errors include the correct headers.",
        "Notes that the CORS middleware must run before any error-throwing middleware/routes to ensure headers are set on error responses.",
        "Suggests checking if app.get('/health') before cors() middleware means health check requests also miss CORS headers.",
      ],
      weakPatterns: [
        "Only suggests 'use cors: *' which would fix the symptom but is a security regression from the specific origin.",
        "Focuses on the browser error message without investigating why CORS headers are missing intermittently.",
      ],
    },
  },

  // ── Logic Bug ──────────────────────────────────────────
  {
    id: "debug_logic_001",
    category: "debugging",
    type: "logic_bug",
    title: "Debug an off-by-one error in pagination",
    prompt:
      "Users report that page 2 shows the same last item as page 1, and the last page is always empty. Analyze the pagination implementation and find all bugs.",
    diff: `// Bug report:
// - Page 2 repeats the last item from page 1
// - Last page shows 0 results even though total says there are more
// - Sorting seems to reset between pages

async function getProducts(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const sortBy = req.query.sortBy || 'name';
  const order = req.query.order || 'asc';

  const total = await db.products.count();
  const offset = (page - 1) * pageSize;

  const products = await db.query(
    \`SELECT * FROM products ORDER BY \${sortBy} \${order} LIMIT \${pageSize + 1} OFFSET \${offset}\`
  );

  // Check if there's a next page
  const hasNext = products.length > pageSize;

  res.json({
    products: products,  // BUG: should slice to pageSize
    page,
    pageSize,
    total,
    totalPages: Math.floor(total / pageSize),  // BUG: should ceil
    hasNext,
  });
}`,
    rubric: {
      mustCover: [
        "products array is not sliced to pageSize — LIMIT pageSize+1 fetches an extra row for hasNext detection, but all rows (including the extra) are returned to the client, causing the overlap with the next page.",
        "Math.floor(total / pageSize) undercounts total pages — 21 items / 20 = 1.05, floors to 1, but there should be 2 pages. Must use Math.ceil.",
        "sortBy and order are interpolated directly into SQL without validation — this is both a SQL injection vulnerability and explains the 'sorting resets' issue if the client sends invalid sort params.",
      ],
      strongSignals: [
        "Identifies the fix: products.slice(0, pageSize) before returning, and Math.ceil(total / pageSize) for totalPages.",
        "Notes that the separate COUNT query and the paginated query can return inconsistent results if data changes between the two queries.",
        "Recommends parameterized sort columns via allowlist instead of direct interpolation.",
      ],
      weakPatterns: [
        "Only finds one of the three bugs without checking the full pagination logic.",
        "Suggests switching to cursor-based pagination without diagnosing the actual offset bugs first.",
      ],
    },
  },

  // ── Memory Leak ────────────────────────────────────────
  {
    id: "debug_memory_001",
    category: "debugging",
    type: "memory_leak",
    title: "Debug a Node.js memory leak in a WebSocket server",
    prompt:
      "The WebSocket server's memory usage grows from 200MB to 4GB over 24 hours, then OOM-kills. Analyze the code and identify all memory leak sources.",
    diff: `// Memory profile:
// - Starts at ~200MB RSS
// - Grows ~150MB/hour
// - OOM killed at ~4GB after 24 hours
// - Heap snapshots show growing Map and Array objects
// - ~5000 concurrent WebSocket connections

const connections = new Map();
const messageHistory = [];

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const userId = req.headers['x-user-id'];
  connections.set(userId, ws);

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    messageHistory.push({
      userId,
      message: msg,
      timestamp: Date.now(),
      rawData: data,  // keeps Buffer reference
    });

    // Broadcast to all connections
    for (const [id, client] of connections) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    }
  });

  ws.on('error', (err) => {
    console.error(\`WS error for \${userId}:\`, err);
  });
});

// Periodic cleanup (runs every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  // BUG: filters but doesn't reassign
  messageHistory.filter(m => m.timestamp > oneHourAgo);
}, 3600000);`,
    rubric: {
      mustCover: [
        "connections Map never removes disconnected clients — there is no ws.on('close') handler, so the Map grows unboundedly with every new connection.",
        "messageHistory.filter() returns a new array but doesn't reassign it — the original array keeps growing. Should be messageHistory = messageHistory.filter(...) or use splice.",
        "rawData: data stores the raw Buffer/string for every message, doubling memory usage. At 5000 connections sending messages, this accumulates rapidly.",
      ],
      strongSignals: [
        "Calculates the leak rate: 5000 connections × ~10 msgs/min × ~1KB/msg = ~50MB/min for messageHistory alone.",
        "Notes that connections.set(userId, ws) overwrites old connections without closing them — if a user reconnects, the old WS is orphaned but still in memory.",
        "Recommends adding ws.on('close', () => connections.delete(userId)) and a bounded circular buffer for message history.",
      ],
      weakPatterns: [
        "Only finds one of the three leak sources.",
        "Suggests 'increase memory limit' without fixing the underlying leaks.",
      ],
    },
  },

  // ── Concurrency Bug ────────────────────────────────────
  {
    id: "debug_concurrency_001",
    category: "debugging",
    type: "concurrency_bug",
    title: "Debug a double-charge bug in payment processing",
    prompt:
      "Customers are occasionally charged twice for the same order. The bug is not reproducible locally but happens ~0.1% in production. Analyze the code and identify the concurrency issue.",
    diff: `// Bug report:
// - ~0.1% of orders are double-charged
// - Customer receives two confirmation emails
// - Happens more frequently during flash sales
// - Database shows two payment records for same order
// - Both payments have status 'completed'

async function processPayment(orderId, amount) {
  // Check if already paid
  const existing = await db.payments.findOne({ orderId, status: 'completed' });
  if (existing) {
    return { success: true, paymentId: existing.id, alreadyPaid: true };
  }

  // Create pending payment
  const payment = await db.payments.create({
    orderId,
    amount,
    status: 'pending',
    createdAt: new Date(),
  });

  try {
    // Charge payment provider
    const result = await stripe.charges.create({
      amount: amount * 100,
      currency: 'usd',
      metadata: { orderId, paymentId: payment.id },
    });

    // Mark as completed
    await db.payments.update(
      { id: payment.id },
      { status: 'completed', stripeChargeId: result.id }
    );

    await sendConfirmationEmail(orderId);
    return { success: true, paymentId: payment.id };
  } catch (err) {
    await db.payments.update(
      { id: payment.id },
      { status: 'failed', error: err.message }
    );
    throw err;
  }
}`,
    rubric: {
      mustCover: [
        "Classic TOCTOU (time-of-check-time-of-use) race: two concurrent requests both check findOne, both see no completed payment, both proceed to charge. The check-then-act is not atomic.",
        "The 'pending' payment record doesn't prevent the second request because the check only looks for 'completed' status — the first request's 'pending' record is invisible to the guard.",
        "During flash sales, retries and double-clicks increase concurrency, making the race window more likely to be hit.",
      ],
      strongSignals: [
        "Recommends a unique constraint on (orderId, status='completed') or an idempotency key pattern using Stripe's idempotencyKey.",
        "Proposes using SELECT ... FOR UPDATE or database advisory lock to serialize payment attempts for the same order.",
        "Notes that the fix should also include checking for 'pending' status in the guard, not just 'completed'.",
      ],
      weakPatterns: [
        "Suggests 'just add a check' without recognizing that the existing check already exists and is the problem.",
        "Blames the frontend for double-clicking without addressing the server-side race condition.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  DATA ANALYSIS
  // ════════════════════════════════════════════════════════

  // ── SQL Query ──────────────────────────────────────────
  {
    id: "da_sql_001",
    category: "data_analysis",
    type: "sql_query",
    guest: true,
    title: "Write a SQL query to find revenue trends with cohort analysis",
    prompt:
      "Given the schema below, write a SQL query that shows monthly revenue by user signup cohort (the month each user first signed up). Include the number of active users per cohort per month and the average revenue per user.",
    diff: `-- Schema:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'completed', 'refunded', 'cancelled'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data characteristics:
-- 50,000 users over 18 months
-- 200,000 orders
-- ~30% of users never ordered
-- ~5% of orders are refunded

-- Expected output columns:
-- signup_cohort (YYYY-MM), order_month (YYYY-MM),
-- active_users, total_revenue, avg_revenue_per_user`,
    rubric: {
      mustCover: [
        "Correct cohort definition — group users by DATE_TRUNC('month', users.created_at) to get signup month.",
        "Filter to only completed orders (exclude refunded/cancelled) when calculating revenue.",
        "JOIN users to orders, group by signup cohort AND order month, aggregate SUM(total_amount) and COUNT(DISTINCT user_id).",
      ],
      strongSignals: [
        "Uses CTE or subquery to first calculate signup cohort per user, then joins to orders for clarity.",
        "Calculates avg_revenue_per_user as SUM(total_amount) / COUNT(DISTINCT user_id), not AVG(total_amount).",
        "Orders results by signup_cohort, order_month and handles NULL (users with no orders) appropriately.",
      ],
      weakPatterns: [
        "Groups only by order month without the cohort dimension.",
        "Includes refunded orders in revenue calculation.",
      ],
    },
  },
  {
    id: "da_sql_002",
    category: "data_analysis",
    type: "sql_query",
    title: "Optimize a slow query with window functions",
    prompt:
      "The following query takes 45 seconds on a 10M row table. Rewrite it to be efficient, explain what indexes you'd add, and calculate the expected improvement.",
    diff: `-- Current query (takes 45 seconds):
SELECT
  e.employee_id,
  e.department_id,
  e.salary,
  (SELECT AVG(salary) FROM employees e2
   WHERE e2.department_id = e.department_id) as dept_avg,
  (SELECT COUNT(*) FROM employees e2
   WHERE e2.department_id = e.department_id
   AND e2.salary > e.salary) + 1 as salary_rank,
  (SELECT MAX(salary) FROM employees e2
   WHERE e2.department_id = e.department_id) as dept_max
FROM employees e
WHERE e.is_active = true
ORDER BY e.department_id, salary_rank;

-- Table: employees (10M rows, 500 departments)
-- Current indexes: PRIMARY KEY (employee_id)
-- No other indexes exist`,
    rubric: {
      mustCover: [
        "The correlated subqueries execute once per row — 3 subqueries × 10M rows = 30M subquery executions, each scanning the department. Window functions (AVG() OVER, RANK() OVER, MAX() OVER) reduce this to a single pass.",
        "Missing index on (department_id, salary) forces full table scans for each subquery. A composite index would dramatically reduce I/O.",
        "The rewritten query should use PARTITION BY department_id for all window functions, with a WHERE is_active = true filter.",
      ],
      strongSignals: [
        "Provides the complete rewritten query using AVG(salary) OVER (PARTITION BY department_id), RANK() OVER (...ORDER BY salary DESC), MAX(salary) OVER (...).",
        "Recommends index: CREATE INDEX idx_employees_dept_salary ON employees(department_id, salary) WHERE is_active = true (partial index).",
        "Estimates improvement: from O(N × M) correlated scans to O(N log N) with window functions + index, expecting 45s → <2s.",
      ],
      weakPatterns: [
        "Only adds indexes without rewriting the correlated subqueries.",
        "Rewrites the query but doesn't explain why the original was slow.",
      ],
    },
  },

  // ── Data Pipeline ──────────────────────────────────────
  {
    id: "da_pipeline_001",
    category: "data_analysis",
    type: "data_pipeline",
    title: "Design an ETL pipeline for e-commerce analytics",
    prompt:
      "Design a data pipeline that ingests raw e-commerce events (page views, add-to-cart, purchases) and produces daily analytics dashboards. Cover data flow, transformations, and quality checks.",
    diff: `## Source Systems
- Web analytics: ~50M page view events/day (JSON, Kafka topic)
- Order service: ~500K orders/day (PostgreSQL CDC)
- Product catalog: ~100K products (REST API, updated hourly)
- User service: ~2M users (PostgreSQL CDC)

## Required Outputs
1. Daily sales dashboard: revenue, orders, AOV by category/region
2. Funnel analysis: page view → add-to-cart → purchase conversion rates
3. Product performance: views, conversion rate, revenue per product
4. User segmentation: RFM (recency, frequency, monetary) scores

## Constraints
- Dashboard must be updated by 6 AM daily
- Historical data: 2 years retention
- Raw events: 90 days hot, 2 years cold storage
- Must handle late-arriving events (up to 72 hours)
- Budget: moderate (cloud-native)

## Your Task
Design the pipeline architecture. Cover: ingestion, storage layers,
transformation logic, scheduling, data quality, and failure handling.`,
    rubric: {
      mustCover: [
        "Layered storage architecture — raw/bronze (landing), cleaned/silver (validated), aggregated/gold (dashboard-ready). Each layer serves a different purpose.",
        "Late-arriving event handling — reprocessing strategy for the 72-hour window, either via watermarking or daily re-aggregation of the last 3 days.",
        "Data quality checks — schema validation on ingestion, row count reconciliation between source and target, anomaly detection on key metrics (e.g., revenue drop >50%).",
      ],
      strongSignals: [
        "Proposes specific technology choices with justification: Kafka for ingestion, S3/GCS for raw storage, Spark/dbt for transformation, Airflow/Dagster for orchestration.",
        "Designs idempotent transformations so re-runs don't produce duplicates.",
        "Addresses the funnel analysis specifically — sessionization of page view events, attribution of add-to-cart to purchase.",
      ],
      weakPatterns: [
        "Describes a simple cron job + SQL without addressing late events or data quality.",
        "Ignores the scale (50M events/day) and proposes a solution that won't handle the throughput.",
      ],
    },
  },

  // ── Data Modeling ──────────────────────────────────────
  {
    id: "da_modeling_001",
    category: "data_analysis",
    type: "data_modeling",
    title: "Design a star schema for a subscription analytics warehouse",
    prompt:
      "Design a dimensional model (star schema) for analyzing subscription metrics: MRR, churn rate, plan upgrades/downgrades, and customer lifetime value. Cover fact and dimension tables.",
    diff: `## Business Context
- SaaS product with monthly/annual subscriptions
- 3 plans: Starter ($29/mo), Pro ($79/mo), Enterprise ($199/mo)
- Metrics needed: MRR, churn rate, expansion revenue, contraction revenue
- Track plan changes (upgrades, downgrades, cancellations)
- Customer segments: by plan, industry, company size, region

## Key Business Questions
1. What is our MRR trend by plan and region?
2. What is the churn rate by cohort and plan?
3. Which segments have the highest LTV?
4. What % of revenue comes from expansion (upgrades)?
5. What is the average time between signup and first upgrade?

## Constraints
- Data warehouse: Snowflake
- Update frequency: daily
- Historical data: 3 years
- Must support both point-in-time and trend analysis

## Your Task
Design the star schema. List all fact and dimension tables
with columns, grain, and explain how each business question maps to the model.`,
    rubric: {
      mustCover: [
        "Fact table at the subscription-event grain — each row is a subscription change (new, renewal, upgrade, downgrade, cancellation) with amount, MRR delta, and foreign keys to dimensions.",
        "Time dimension (date_dim) with fiscal periods, day-of-week, etc. Customer dimension with industry, company size, region. Plan dimension with plan name, price, tier.",
        "MRR calculation logic — SUM of active subscription amounts as of a given date, with expansion/contraction derived from upgrade/downgrade events.",
      ],
      strongSignals: [
        "Designs a separate subscription_snapshot fact table (daily snapshot of active subscriptions) alongside the event fact table for point-in-time MRR queries.",
        "Includes a Type 2 SCD (slowly changing dimension) for customer dimension to track changes in plan/segment over time.",
        "Maps each business question to specific SQL patterns: MRR = SUM(mrr_amount) from snapshot table; churn = COUNT(cancellations) / COUNT(active_start_of_period).",
      ],
      weakPatterns: [
        "Creates only a flat denormalized table without proper fact/dimension separation.",
        "Ignores the time dimension or treats dates as plain strings.",
      ],
    },
  },

  // ════════════════════════════════════════════════════════
  //  PRACTICAL CODING
  // ════════════════════════════════════════════════════════

  // ── Python ─────────────────────────────────────────────
  {
    id: "pc_python_001",
    category: "practical_coding",
    type: "implementation",
    language: "python",
    guest: true,
    title: "Implement an LRU Cache with O(1) operations",
    prompt:
      "Implement an LRU (Least Recently Used) Cache class in Python with O(1) time complexity for both get and put operations. Include proper handling of capacity overflow.",
    diff: `# Implement the LRUCache class:
#
# class LRUCache:
#     def __init__(self, capacity: int):
#         # Initialize with given capacity
#
#     def get(self, key: int) -> int:
#         # Return value if key exists, otherwise return -1
#         # Mark as recently used
#
#     def put(self, key: int, value: int) -> None:
#         # Insert or update key-value pair
#         # If capacity exceeded, evict least recently used item
#
# Example usage:
# cache = LRUCache(2)
# cache.put(1, 1)
# cache.put(2, 2)
# cache.get(1)       # returns 1
# cache.put(3, 3)    # evicts key 2
# cache.get(2)       # returns -1 (not found)
# cache.get(3)       # returns 3
#
# Constraints:
# - 1 <= capacity <= 3000
# - 0 <= key <= 10^4
# - 0 <= value <= 10^5
# - At most 2 * 10^5 calls to get and put
# - All operations must be O(1) time complexity
#
# IMPORTANT: Do not use collections.OrderedDict.
# Implement the doubly-linked list yourself.`,
    rubric: {
      mustCover: [
        "Uses a hash map (dict) for O(1) key lookup combined with a doubly-linked list for O(1) insertion/removal to maintain access order.",
        "Correctly handles capacity overflow by removing the tail (least recently used) node and its corresponding hash map entry.",
        "On get(), moves the accessed node to the head (most recently used). On put(), adds new node at head or moves existing node to head.",
      ],
      strongSignals: [
        "Uses sentinel head/tail nodes to simplify edge cases (empty list, single element).",
        "Implements clean helper methods: _add_to_head(), _remove_node(), _move_to_head() for doubly-linked list operations.",
        "Handles edge case: put() with existing key updates the value AND moves to head, not just updates.",
      ],
      weakPatterns: [
        "Uses OrderedDict (explicitly prohibited in the prompt).",
        "Implements O(n) search in a list instead of O(1) hash map lookup.",
      ],
    },
  },
  {
    id: "pc_python_002",
    category: "practical_coding",
    type: "implementation",
    language: "python",
    title: "Implement a thread-safe producer-consumer queue",
    prompt:
      "Implement a bounded, thread-safe queue in Python that supports multiple producers and consumers. Include proper blocking behavior when the queue is full or empty.",
    diff: `# Implement the BoundedQueue class:
#
# class BoundedQueue:
#     def __init__(self, capacity: int):
#         # Initialize with max capacity
#
#     def put(self, item, timeout=None) -> bool:
#         # Add item to queue. Block if full.
#         # Returns True if added, False if timeout exceeded.
#
#     def get(self, timeout=None):
#         # Remove and return item from queue. Block if empty.
#         # Returns item or raises Empty if timeout exceeded.
#
#     def size(self) -> int:
#         # Return current number of items
#
#     def is_empty(self) -> bool:
#     def is_full(self) -> bool:
#
# Requirements:
# - Must be thread-safe for concurrent producers/consumers
# - put() blocks when queue is full (until space available or timeout)
# - get() blocks when queue is empty (until item available or timeout)
# - Use threading primitives (Lock, Condition), not queue.Queue
# - Support graceful shutdown: close() method that unblocks all waiters
#
# Example:
# q = BoundedQueue(5)
# # Producer thread: q.put("task1")
# # Consumer thread: item = q.get()
# # Shutdown: q.close()  # all blocked get()/put() return immediately`,
    rubric: {
      mustCover: [
        "Uses threading.Lock (or RLock) with threading.Condition for proper wait/notify semantics — Condition.wait() releases the lock while waiting and reacquires it on wake.",
        "Two separate Conditions (not_full, not_empty) or one Condition with proper predicate checks to avoid missed wakeups and spurious wakeups.",
        "Blocking with timeout — Condition.wait(timeout) returns False on timeout, which must be checked to avoid returning stale data or blocking forever.",
      ],
      strongSignals: [
        "Uses a while loop (not if) for the wait condition to handle spurious wakeups correctly.",
        "Implements close() that sets a flag and calls notify_all() on both conditions to unblock all waiters.",
        "Uses collections.deque with maxlen or manual circular buffer for efficient O(1) FIFO operations.",
      ],
      weakPatterns: [
        "Uses busy-waiting (while loop with sleep) instead of Condition.wait().",
        "Only uses a single Lock without Condition, making blocking behavior impossible without spinning.",
      ],
    },
  },
  {
    id: "pc_python_003",
    category: "practical_coding",
    type: "implementation",
    language: "python",
    title: "Implement a rate limiter with sliding window",
    prompt:
      "Implement a sliding window rate limiter in Python. It should allow N requests per window of T seconds, with accurate counting that doesn't reset at window boundaries.",
    diff: `# Implement the SlidingWindowRateLimiter class:
#
# class SlidingWindowRateLimiter:
#     def __init__(self, max_requests: int, window_seconds: float):
#         # max_requests: max allowed in any rolling window
#         # window_seconds: size of the sliding window
#
#     def allow(self, key: str) -> bool:
#         # Returns True if request is allowed, False if rate limited
#         # Must be accurate to sub-second precision
#
#     def remaining(self, key: str) -> int:
#         # Returns number of requests remaining in current window
#
#     def reset_time(self, key: str) -> float:
#         # Returns seconds until the oldest request in window expires
#
# Requirements:
# - Sliding window (not fixed window) — no burst at boundaries
# - Per-key tracking (e.g., per user, per IP)
# - Thread-safe
# - Memory efficient — clean up expired entries
#
# Example:
# limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
# limiter.allow("user_1")  # True (1/5)
# limiter.allow("user_1")  # True (2/5)
# # ... 3 more calls ...
# limiter.allow("user_1")  # False (rate limited)
# limiter.remaining("user_1")  # 0`,
    rubric: {
      mustCover: [
        "Stores individual request timestamps per key (e.g., deque or sorted list) and counts only those within the sliding window on each allow() call.",
        "Evicts expired timestamps (older than current_time - window_seconds) before counting, to maintain accurate window.",
        "Uses threading.Lock for thread safety around the shared timestamps data structure.",
      ],
      strongSignals: [
        "Uses collections.deque for efficient O(1) append and O(k) left-pop of expired entries.",
        "Implements periodic cleanup or lazy eviction to prevent memory growth from inactive keys.",
        "Compares sliding window vs fixed window vs sliding window counter approach and justifies the choice.",
      ],
      weakPatterns: [
        "Implements a fixed window counter that resets at boundaries instead of true sliding window.",
        "Stores all requests forever without eviction, causing memory leak.",
      ],
    },
  },

  // ── Java ───────────────────────────────────────────────
  {
    id: "pc_java_001",
    category: "practical_coding",
    type: "implementation",
    language: "java",
    title: "Implement a concurrent HashMap with fine-grained locking",
    prompt:
      "Implement a thread-safe HashMap in Java using segment-based (striped) locking. Support get, put, remove, and size operations with better concurrency than a single global lock.",
    diff: `// Implement the StripedHashMap<K, V> class:
//
// public class StripedHashMap<K, V> {
//     public StripedHashMap(int numStripes, int initialCapacity)
//     public V get(K key)
//     public V put(K key, V value)
//     public V remove(K key)
//     public int size()
//     public boolean containsKey(K key)
// }
//
// Requirements:
// - Stripe-based locking: divide buckets into N lock stripes
// - Each stripe has its own ReentrantLock
// - get() on different stripes can proceed concurrently
// - put() only locks the affected stripe
// - size() must be eventually consistent (no global lock)
// - Handle null keys (map to stripe 0)
//
// Constraints:
// - Do NOT use java.util.concurrent.ConcurrentHashMap
// - Use ReentrantLock, not synchronized
// - Default: 16 stripes
//
// Example:
// StripedHashMap<String, Integer> map = new StripedHashMap<>(16, 256);
// map.put("key1", 100);  // locks stripe for "key1".hashCode()
// map.get("key1");       // returns 100, only locks that stripe`,
    rubric: {
      mustCover: [
        "Stripe assignment: hash the key, use modulo to select which of N ReentrantLocks to acquire. All operations on keys mapping to the same stripe are serialized.",
        "Proper lock/unlock pattern using try/finally to ensure the lock is released even if an exception occurs.",
        "size() either uses an AtomicInteger counter updated on put/remove, or iterates all stripes (acknowledging it's a snapshot, not exact under concurrency).",
      ],
      strongSignals: [
        "Handles hash collision properly — each bucket is a linked list or array of entries within the stripe.",
        "Uses Math.abs(key.hashCode() % numStripes) or bitwise (hashCode & (numStripes - 1)) for stripe selection, handling Integer.MIN_VALUE edge case.",
        "Discusses tradeoff: more stripes = better concurrency but more memory; fewer stripes = more contention.",
      ],
      weakPatterns: [
        "Uses a single global lock, defeating the purpose of striped locking.",
        "Doesn't use try/finally for lock release, risking deadlock on exceptions.",
      ],
    },
  },
  {
    id: "pc_java_002",
    category: "practical_coding",
    type: "implementation",
    language: "java",
    title: "Implement a generic object pool with lifecycle management",
    prompt:
      "Implement a generic, thread-safe object pool in Java. Objects should be borrowed, returned, and validated. Support min/max pool size, idle timeout, and health checks.",
    diff: `// Implement the ObjectPool<T> class:
//
// public class ObjectPool<T> {
//     public ObjectPool(PoolConfig config, PooledObjectFactory<T> factory)
//     public T borrow(long timeoutMs) throws TimeoutException
//     public void returnObject(T obj)
//     public void invalidate(T obj)
//     public int getActiveCount()
//     public int getIdleCount()
//     public void shutdown()
// }
//
// interface PooledObjectFactory<T> {
//     T create();
//     boolean validate(T obj);  // health check
//     void destroy(T obj);      // cleanup
// }
//
// Requirements:
// - Borrow: get idle object or create new (up to maxSize)
// - Return: validate and put back to idle pool
// - Invalidate: destroy and remove from pool
// - Idle timeout: destroy objects idle > maxIdleTimeMs
// - Min pool size: maintain at least minSize objects
// - Thread-safe with blocking borrow (wait if maxSize reached)
//
// PoolConfig: minSize=5, maxSize=20, maxIdleTimeMs=60000`,
    rubric: {
      mustCover: [
        "Uses a BlockingQueue (LinkedBlockingDeque) for the idle pool and a Semaphore or counter for total pool size enforcement.",
        "Borrow: poll from idle queue → if empty and under maxSize, create new → if at maxSize, block with timeout → throw TimeoutException.",
        "Return: validate the object (factory.validate), if valid add back to idle queue, if invalid destroy and decrement pool size.",
      ],
      strongSignals: [
        "Implements a background evictor thread (ScheduledExecutorService) that periodically removes idle objects exceeding maxIdleTimeMs while maintaining minSize.",
        "Tracks borrowed objects in a Set/Map to detect double-return and leaked objects.",
        "shutdown() stops the evictor, drains the idle pool calling destroy() on each, and waits for borrowed objects with a timeout.",
      ],
      weakPatterns: [
        "No validation on return — returns broken objects to the pool.",
        "Uses busy-wait polling instead of blocking queue primitives.",
      ],
    },
  },

  // ── JavaScript/TypeScript ──────────────────────────────
  {
    id: "pc_javascript_001",
    category: "practical_coding",
    type: "implementation",
    language: "javascript",
    title: "Implement a Promise.allSettled with concurrency limit",
    prompt:
      "Implement a function that runs async tasks with a concurrency limit (like p-limit). All tasks must complete (no early abort). Return results in order with status/value/reason.",
    diff: `// Implement promisePool:
//
// async function promisePool<T>(
//   tasks: (() => Promise<T>)[],
//   concurrency: number
// ): Promise<Array<
//   | { status: 'fulfilled'; value: T }
//   | { status: 'rejected'; reason: any }
// >>
//
// Requirements:
// - Run at most 'concurrency' tasks simultaneously
// - When one task finishes, start the next pending task
// - All tasks run to completion (don't stop on errors)
// - Results array matches input order (not completion order)
// - Handle edge cases: empty array, concurrency > tasks.length
//
// Example:
// const tasks = [
//   () => fetch('/api/1'),  // 200ms
//   () => fetch('/api/2'),  // fails
//   () => fetch('/api/3'),  // 100ms
//   () => fetch('/api/4'),  // 300ms
//   () => fetch('/api/5'),  // 150ms
// ];
// const results = await promisePool(tasks, 2);
// // Runs tasks 1,2 first. When 2 fails, starts 3. When 3 done, starts 4. etc.
// // results[0] = { status: 'fulfilled', value: ... }
// // results[1] = { status: 'rejected', reason: ... }`,
    rubric: {
      mustCover: [
        "Maintains an active count or uses a semaphore pattern — when a task completes, the next pending task is started immediately, keeping the pool at max concurrency.",
        "Results are stored by original index, not completion order — must track which slot each result belongs to.",
        "Errors are caught per-task and stored as { status: 'rejected', reason } — a single failure must not abort other tasks.",
      ],
      strongSignals: [
        "Uses a clean recursive or iterator-based approach: each worker pulls the next task from a shared index, processes it, and loops until no tasks remain.",
        "Handles edge cases: concurrency <= 0 (throw or default to 1), empty tasks array (return []), tasks.length < concurrency.",
        "Returns a single Promise that resolves when all tasks are done, using a counter or Promise.all on worker promises.",
      ],
      weakPatterns: [
        "Launches all tasks at once and just uses Promise.allSettled — ignores the concurrency limit.",
        "Uses setTimeout or artificial delays instead of proper task scheduling.",
      ],
    },
  },
  {
    id: "pc_javascript_002",
    category: "practical_coding",
    type: "implementation",
    language: "javascript",
    title: "Implement a deep equality comparison function",
    prompt:
      "Implement a deepEqual function in JavaScript that compares two values for structural equality. Handle all JS types including objects, arrays, Date, RegExp, Map, Set, and circular references.",
    diff: `// Implement deepEqual:
//
// function deepEqual(a: unknown, b: unknown): boolean
//
// Must handle:
// - Primitives: number, string, boolean, null, undefined, bigint, symbol
// - Special numbers: NaN === NaN (true), +0 === -0 (true)
// - Objects: compare own enumerable properties recursively
// - Arrays: same length, same elements in same order
// - Date: compare .getTime()
// - RegExp: compare .source and .flags
// - Map: same keys and values (deep comparison)
// - Set: same elements (deep comparison)
// - Circular references: detect and handle without infinite loop
// - Ignore prototype chain (only own properties)
//
// Examples:
// deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })  // true
// deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))  // true
// deepEqual(NaN, NaN)  // true
// deepEqual(new Map([['a', 1]]), new Map([['a', 1]]))  // true
// const obj = { self: null }; obj.self = obj;
// deepEqual(obj, obj)  // true (circular reference)`,
    rubric: {
      mustCover: [
        "Handles primitives with Object.is() or explicit NaN check — standard === treats NaN !== NaN, which is wrong for deep equality.",
        "Recursively compares object properties using Object.keys() or Object.getOwnPropertyNames(), checking both key sets are equal and each value is deepEqual.",
        "Circular reference detection using a visited Set/Map (WeakMap of seen pairs) — if the same pair of objects is encountered again, return true to avoid infinite recursion.",
      ],
      strongSignals: [
        "Handles Map deep comparison by iterating entries and deep-comparing both keys and values (not just reference equality on keys).",
        "Handles Set deep comparison using an O(n²) approach: for each element in Set A, find a deep-equal match in Set B.",
        "Uses a two-argument visited cache (WeakMap<object, WeakSet<object>>) to track pairs already compared, not just individual objects.",
      ],
      weakPatterns: [
        "Only handles plain objects and arrays, ignoring Date, RegExp, Map, Set.",
        "Uses JSON.stringify for comparison — fails on circular refs, undefined values, Map/Set, and key ordering.",
      ],
    },
  },

  // ── C/C++ ──────────────────────────────────────────────
  {
    id: "pc_c_cpp_001",
    category: "practical_coding",
    type: "implementation",
    language: "c_cpp",
    title: "Implement a memory pool allocator in C",
    prompt:
      "Implement a fixed-size block memory pool allocator in C. Pre-allocate a chunk of memory and manage fixed-size blocks with O(1) allocation and deallocation. No system malloc calls after initialization.",
    diff: `/* Implement the memory pool:
 *
 * typedef struct MemPool MemPool;
 *
 * MemPool* pool_create(size_t block_size, size_t block_count);
 * void*    pool_alloc(MemPool* pool);
 * void     pool_free(MemPool* pool, void* ptr);
 * void     pool_destroy(MemPool* pool);
 * size_t   pool_available(MemPool* pool);
 *
 * Requirements:
 * - Single malloc in pool_create for the entire pool
 * - O(1) alloc and free using a free list
 * - Alignment: blocks aligned to 8 bytes minimum
 * - pool_free must detect double-free (return error or assert)
 * - pool_alloc returns NULL when pool is exhausted
 * - No memory leaks — pool_destroy frees everything
 *
 * Memory layout:
 * [MemPool header][Block 0][Block 1]...[Block N-1]
 *
 * Free list: each free block stores a pointer to the next free block
 * (embedded in the block's own memory since it's unused)
 *
 * Example:
 * MemPool* pool = pool_create(64, 1024);  // 1024 blocks of 64 bytes
 * void* a = pool_alloc(pool);   // O(1)
 * void* b = pool_alloc(pool);   // O(1)
 * pool_free(pool, a);           // O(1)
 * void* c = pool_alloc(pool);   // reuses a's block
 * pool_destroy(pool);           // single free
 */`,
    rubric: {
      mustCover: [
        "Free list implementation — each free block embeds a pointer to the next free block (intrusive linked list). Alloc pops from the head, free pushes to the head. Both O(1).",
        "Single allocation: pool_create allocates sizeof(MemPool) + block_count * aligned_block_size in one malloc call. All blocks are contiguous.",
        "Alignment: block_size must be rounded up to at least sizeof(void*) and 8-byte aligned so that the embedded free list pointer and user data are properly aligned.",
      ],
      strongSignals: [
        "Double-free detection by checking if the pointer falls within the pool's memory range and verifying the block is not already in the free list (or using a bitmap).",
        "Initializes the free list in pool_create by linking all blocks: for each block, cast to void** and store pointer to next block.",
        "Handles edge cases: block_size < sizeof(void*) (must be at least pointer-sized for the free list), block_count == 0, NULL pool parameter.",
      ],
      weakPatterns: [
        "Uses malloc for each block allocation, defeating the purpose of a pool allocator.",
        "Uses linear search to find free blocks instead of a free list.",
      ],
    },
  },
  {
    id: "pc_c_cpp_002",
    category: "practical_coding",
    type: "implementation",
    language: "c_cpp",
    title: "Implement a lock-free queue in C++ using atomics",
    prompt:
      "Implement a lock-free single-producer single-consumer (SPSC) queue in C++ using std::atomic. The queue should be bounded and use a ring buffer for cache-friendly access.",
    diff: `// Implement the SPSCQueue:
//
// template <typename T, size_t Capacity>
// class SPSCQueue {
// public:
//     bool push(const T& item);  // returns false if full
//     bool pop(T& item);         // returns false if empty
//     bool empty() const;
//     bool full() const;
//     size_t size() const;
// };
//
// Requirements:
// - Lock-free: use std::atomic for head/tail, no mutexes
// - Single-producer, single-consumer (one thread pushes, one pops)
// - Ring buffer with power-of-2 capacity for efficient modulo
// - Cache-line padding to prevent false sharing between head and tail
// - No dynamic memory allocation after construction
//
// Memory ordering:
// - push: store with release semantics (make written data visible)
// - pop: load with acquire semantics (see producer's writes)
//
// Example:
// SPSCQueue<int, 1024> queue;
// // Producer thread: queue.push(42);
// // Consumer thread: int val; queue.pop(val);`,
    rubric: {
      mustCover: [
        "Ring buffer with atomic head (read by consumer, written by consumer) and atomic tail (read by producer, written by producer). Push writes at tail, pop reads at head.",
        "Memory ordering: push uses store_release on tail after writing data (ensures data write happens-before tail advance). Pop uses load_acquire on tail (ensures it sees the data).",
        "Full check: (tail + 1) % capacity == head. Empty check: head == tail. One slot is wasted to distinguish full from empty.",
      ],
      strongSignals: [
        "Aligns head and tail to separate cache lines using alignas(64) or padding to prevent false sharing.",
        "Uses power-of-2 capacity with bitwise AND (index & (Capacity - 1)) instead of modulo for performance.",
        "Explains why SPSC doesn't need compare_exchange (CAS) — only one thread modifies each index.",
      ],
      weakPatterns: [
        "Uses memory_order_seq_cst everywhere without understanding the performance implications.",
        "Doesn't address false sharing between head and tail.",
      ],
    },
  },

  // ── Rust ───────────────────────────────────────────────
  {
    id: "pc_rust_001",
    category: "practical_coding",
    type: "implementation",
    language: "rust",
    title: "Implement a custom iterator with lazy evaluation",
    prompt:
      "Implement a Rust iterator that lazily processes a stream of log entries. Support filtering, mapping, and windowed aggregation without loading all data into memory.",
    diff: `// Implement the LogProcessor:
//
// struct LogEntry {
//     timestamp: u64,
//     level: LogLevel,  // Debug, Info, Warn, Error
//     message: String,
//     source: String,
// }
//
// struct LogProcessor<I: Iterator<Item = LogEntry>> {
//     inner: I,
// }
//
// impl<I: Iterator<Item = LogEntry>> LogProcessor<I> {
//     fn new(iter: I) -> Self
//     fn errors_only(self) -> LogProcessor<impl Iterator<Item = LogEntry>>
//     fn with_source(self, source: &str) -> LogProcessor<impl Iterator<Item = LogEntry>>
//     fn messages(self) -> impl Iterator<Item = String>
//     fn windowed_count(self, window_secs: u64) -> impl Iterator<Item = (u64, usize)>
// }
//
// Requirements:
// - All operations are lazy (no allocation until consumed)
// - Chainable: processor.errors_only().with_source("api").messages()
// - windowed_count groups entries by time window and yields (window_start, count)
// - Must implement Iterator trait correctly
// - Zero-copy where possible (&str references)
//
// Example:
// let entries = read_log_file("app.log"); // returns impl Iterator<Item=LogEntry>
// let error_counts = LogProcessor::new(entries)
//     .errors_only()
//     .with_source("payment-service")
//     .windowed_count(60);  // 60-second windows
// for (window, count) in error_counts {
//     println!("{}: {} errors", window, count);
// }`,
    rubric: {
      mustCover: [
        "Lazy evaluation — errors_only() and with_source() return new LogProcessor wrapping a Filter iterator, not collecting into a Vec.",
        "windowed_count() must maintain state (current window start and count) and yield when the window boundary is crossed — this requires a custom Iterator implementation, not just .filter().map().",
        "Ownership: self is consumed by each method (builder pattern with move semantics), returning a new LogProcessor with the transformed iterator.",
      ],
      strongSignals: [
        "Uses impl Iterator<Item = LogEntry> in return types for zero-cost abstraction (monomorphized at compile time).",
        "Implements windowed_count with a struct that holds a Peekable<I> to look ahead without consuming, or buffers the current entry.",
        "Explains the difference between this approach and collecting into Vec: O(1) memory vs O(n) memory for the pipeline.",
      ],
      weakPatterns: [
        "Collects into Vec in intermediate steps, losing laziness.",
        "Uses Box<dyn Iterator> everywhere instead of impl Iterator, adding unnecessary heap allocation and dynamic dispatch.",
      ],
    },
  },
  {
    id: "pc_rust_002",
    category: "practical_coding",
    type: "implementation",
    language: "rust",
    title: "Implement a safe concurrent cache with interior mutability",
    prompt:
      "Implement a thread-safe cache in Rust that supports concurrent reads and exclusive writes. Use proper Rust concurrency primitives — no unsafe code.",
    diff: `// Implement the ConcurrentCache:
//
// pub struct ConcurrentCache<K, V> {
//     // Choose appropriate interior mutability primitives
// }
//
// impl<K: Eq + Hash + Clone, V: Clone> ConcurrentCache<K, V> {
//     pub fn new(capacity: usize) -> Self
//     pub fn get(&self, key: &K) -> Option<V>
//     pub fn insert(&self, key: K, value: V) -> Option<V>
//     pub fn remove(&self, key: &K) -> Option<V>
//     pub fn get_or_insert_with<F: FnOnce() -> V>(&self, key: K, f: F) -> V
//     pub fn len(&self) -> usize
//     pub fn clear(&self)
// }
//
// Requirements:
// - Thread-safe: Send + Sync
// - Multiple readers can access concurrently (RwLock)
// - get_or_insert_with must be atomic (no double-computation)
// - Capacity limit with LRU eviction
// - No unsafe blocks
// - &self methods only (interior mutability pattern)
//
// Example:
// let cache = Arc::new(ConcurrentCache::new(100));
// let cache_clone = cache.clone();
// thread::spawn(move || {
//     cache_clone.insert("key1".to_string(), expensive_compute());
// });
// let val = cache.get_or_insert_with("key2".to_string(), || compute());`,
    rubric: {
      mustCover: [
        "Uses Arc<RwLock<HashMap<K, V>>> or similar pattern for interior mutability with concurrent read access.",
        "get_or_insert_with must upgrade from read lock to write lock atomically, or use write lock throughout to prevent double computation.",
        "All methods take &self (not &mut self) to allow the cache to be shared across threads via Arc.",
      ],
      strongSignals: [
        "Addresses the RwLock upgrade problem: Rust's RwLock doesn't support lock upgrade, so get_or_insert_with should try read first, drop it, then acquire write and re-check (double-check locking).",
        "Implements LRU eviction within the write lock using a linked list or VecDeque for access order tracking.",
        "Discusses sharded locking (multiple RwLocks for different key ranges) to reduce contention.",
      ],
      weakPatterns: [
        "Uses Mutex instead of RwLock, blocking all reads during writes.",
        "Ignores the capacity/LRU requirement entirely.",
      ],
    },
  },

  // ── Go ─────────────────────────────────────────────────
  {
    id: "pc_go_001",
    category: "practical_coding",
    type: "implementation",
    language: "go",
    title: "Implement a worker pool with graceful shutdown",
    prompt:
      "Implement a worker pool in Go that processes jobs from a channel with a configurable number of workers. Support graceful shutdown that finishes in-progress jobs and drains the queue.",
    diff: `// Implement the WorkerPool:
//
// type Job func() error
//
// type WorkerPool struct {
//     // fields
// }
//
// func NewWorkerPool(numWorkers int, queueSize int) *WorkerPool
// func (p *WorkerPool) Submit(job Job) error  // returns error if pool is shut down
// func (p *WorkerPool) Shutdown(ctx context.Context) error  // graceful shutdown
// func (p *WorkerPool) Stats() PoolStats  // active workers, pending jobs, completed, failed
//
// type PoolStats struct {
//     ActiveWorkers int
//     PendingJobs   int
//     Completed     int64
//     Failed        int64
// }
//
// Requirements:
// - Workers read from a buffered channel
// - Submit blocks if queue is full (backpressure)
// - Shutdown: stop accepting new jobs, finish in-progress and queued jobs
// - Context cancellation: force-stop if shutdown exceeds deadline
// - Thread-safe stats using atomic operations
// - Panic recovery: if a job panics, the worker recovers and continues
//
// Example:
// pool := NewWorkerPool(4, 100)
// pool.Submit(func() error { return processItem(item) })
// ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
// defer cancel()
// pool.Shutdown(ctx)  // waits up to 30s for completion`,
    rubric: {
      mustCover: [
        "Workers as goroutines reading from a buffered chan Job. Submit sends to the channel. Close the channel to signal no more jobs.",
        "Graceful shutdown: close the jobs channel (stops new submissions), then wait for all workers to finish with sync.WaitGroup.",
        "Panic recovery: each worker wraps job execution in defer/recover to prevent a panicking job from killing the worker goroutine.",
      ],
      strongSignals: [
        "Uses context.Context in Shutdown — select on ctx.Done() alongside WaitGroup completion to support force-stop on deadline.",
        "Uses atomic.Int64 for completed/failed counters to avoid mutex contention on hot path.",
        "Submit returns an error after shutdown instead of panicking — uses a sync.Once or atomic flag to track shutdown state.",
      ],
      weakPatterns: [
        "No WaitGroup — Shutdown returns immediately without waiting for workers.",
        "No panic recovery — a single panicking job crashes the entire pool.",
      ],
    },
  },

  // ── Kotlin ─────────────────────────────────────────────
  {
    id: "pc_kotlin_001",
    category: "practical_coding",
    type: "implementation",
    language: "kotlin",
    title: "Implement a coroutine-based retry mechanism with backoff",
    prompt:
      "Implement a retry utility in Kotlin using coroutines. Support exponential backoff, jitter, configurable retry conditions, and circuit breaker integration.",
    diff: `// Implement the retry utility:
//
// data class RetryConfig(
//     val maxAttempts: Int = 3,
//     val initialDelay: Duration = 1.seconds,
//     val maxDelay: Duration = 30.seconds,
//     val multiplier: Double = 2.0,
//     val jitterFactor: Double = 0.1,  // 0.0 to 1.0
//     val retryOn: (Throwable) -> Boolean = { true },
// )
//
// suspend fun <T> retry(
//     config: RetryConfig = RetryConfig(),
//     block: suspend (attempt: Int) -> T
// ): T
//
// Requirements:
// - Exponential backoff: delay doubles each attempt (capped at maxDelay)
// - Jitter: randomize delay by ±jitterFactor to prevent thundering herd
// - retryOn predicate: only retry if the exception matches (e.g., IOException)
// - Coroutine-friendly: use delay() not Thread.sleep()
// - Cancellation-aware: respect coroutine cancellation (don't catch CancellationException)
// - Log each attempt with attempt number and delay
//
// Example:
// val result = retry(RetryConfig(maxAttempts = 5, retryOn = { it is IOException })) {
//     httpClient.get("https://api.example.com/data")
// }`,
    rubric: {
      mustCover: [
        "Exponential backoff calculation: delay = min(initialDelay * multiplier^attempt, maxDelay), with jitter applied as random offset within ±jitterFactor.",
        "CancellationException must NOT be caught — it must propagate to respect structured concurrency. Only catch Exception and re-check with retryOn.",
        "Uses kotlinx.coroutines.delay() (suspending, non-blocking) instead of Thread.sleep() (blocking).",
      ],
      strongSignals: [
        "Implements jitter correctly: delay * (1.0 + Random.nextDouble(-jitterFactor, jitterFactor)) to spread retry storms.",
        "Returns the result on success or throws the last exception on exhaustion — preserves the original exception with addSuppressed for earlier failures.",
        "Uses structured concurrency: the retry function is a suspend function that participates in the caller's coroutine scope.",
      ],
      weakPatterns: [
        "Catches Throwable or CancellationException, breaking coroutine cancellation.",
        "Uses Thread.sleep() instead of suspending delay(), blocking the coroutine dispatcher.",
      ],
    },
  },

  // ── TypeScript ─────────────────────────────────────────
  {
    id: "pc_typescript_001",
    category: "practical_coding",
    type: "implementation",
    language: "typescript",
    title: "Implement a type-safe event emitter with generics",
    prompt:
      "Implement a fully type-safe event emitter in TypeScript where event names and their payload types are enforced at compile time. No 'any' types allowed.",
    diff: `// Implement TypedEventEmitter:
//
// interface EventMap {
//   [event: string]: any;  // user defines this
// }
//
// class TypedEventEmitter<Events extends EventMap> {
//   on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): () => void
//   once<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): () => void
//   emit<K extends keyof Events>(event: K, data: Events[K]): void
//   off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void
//   listenerCount<K extends keyof Events>(event: K): number
//   removeAllListeners<K extends keyof Events>(event?: K): void
// }
//
// Usage (should compile with zero errors):
// interface AppEvents {
//   'user:login': { userId: string; timestamp: number };
//   'user:logout': { userId: string };
//   'error': Error;
//   'data': number[];
// }
//
// const emitter = new TypedEventEmitter<AppEvents>();
// emitter.on('user:login', (data) => {
//   console.log(data.userId);    // ✓ TypeScript knows data has userId
//   console.log(data.whatever);  // ✗ Compile error
// });
// emitter.emit('user:login', { userId: '123', timestamp: Date.now() });  // ✓
// emitter.emit('user:login', { wrong: true });  // ✗ Compile error
// emitter.emit('nonexistent', {});  // ✗ Compile error`,
    rubric: {
      mustCover: [
        "Generic constraint: Events extends EventMap (or Record<string, unknown>), with K extends keyof Events for type-safe event name lookup.",
        "Listener type is (data: Events[K]) => void — the payload type is inferred from the event name via indexed access type.",
        "Internal storage: Map<keyof Events, Set<Function>> or similar, with proper type narrowing on retrieval.",
      ],
      strongSignals: [
        "on() returns an unsubscribe function (() => void) for convenient cleanup.",
        "once() wraps the listener to auto-remove after first call, handling the type correctly.",
        "No runtime type assertions or 'as any' casts — the implementation is fully type-safe internally.",
      ],
      weakPatterns: [
        "Uses 'any' for internal listener storage and casts on emit.",
        "Doesn't constrain event names — allows arbitrary strings at call sites.",
      ],
    },
  },

  // ── Code Optimization (keep existing ones, re-categorized) ──
  {
    id: "pc_javascript_opt_001",
    category: "practical_coding",
    type: "optimization",
    language: "javascript",
    title: "Optimize a slow array deduplication function",
    prompt:
      "Read the function below. Identify performance problems and suggest how to optimize it. Explain the time complexity of the current vs. your proposed approach.",
    diff: `// Current implementation — works but slow on large arrays
function deduplicateUsers(users) {
  const result = [];
  for (const user of users) {
    let isDuplicate = false;
    for (const existing of result) {
      if (existing.email === user.email) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push(user);
    }
  }
  return result;
}

// Called with arrays of 50,000+ user objects
// Each user: { id, name, email, role, createdAt }
// Current latency: ~4 seconds on production`,
    rubric: {
      mustCover: [
        "The nested loop is O(n²) — for each user, it scans the entire result array to check for duplicates, making it extremely slow for large inputs.",
        "Using a Set or Map keyed by email reduces the lookup to O(1) per user, making the overall function O(n).",
        "The function should preserve insertion order (first occurrence wins) — any optimization must maintain this behavior.",
      ],
      strongSignals: [
        "Provides a concrete implementation using Map or Set with O(n) complexity.",
        "Notes that if the input is already sorted by email, a single-pass scan with neighbor comparison would also work.",
        "Mentions that for 50K objects, the difference is ~2.5 billion comparisons (O(n²)) vs 50K lookups (O(n)).",
      ],
      weakPatterns: [
        "Only says 'use a Set' without explaining why the current approach is slow or what the complexity change is.",
        "Suggests using [...new Set(users)] which doesn't work because Set uses reference equality for objects.",
      ],
    },
  },
  {
    id: "pc_javascript_opt_002",
    category: "practical_coding",
    type: "optimization",
    language: "javascript",
    title: "Optimize a React component with unnecessary re-renders",
    prompt:
      "Read the component below. Identify why it causes performance problems and explain how to optimize it without changing the feature behavior.",
    diff: `import { useState } from 'react';

function ProductList({ products, onAddToCart }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => a.price - b.price);

  const stats = {
    total: sorted.length,
    avgPrice: sorted.reduce((sum, p) => sum + p.price, 0) / sorted.length || 0,
    minPrice: Math.min(...sorted.map(p => p.price)),
    maxPrice: Math.max(...sorted.map(p => p.price)),
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      <div>
        {sorted.length} results | Avg: \${stats.avgPrice.toFixed(2)} |
        Range: \${stats.minPrice} - \${stats.maxPrice}
      </div>
      {sorted.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={() => onAddToCart(product.id)}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  console.log('Rendering:', product.name); // fires on every keystroke
  return (
    <div>
      <h3>{product.name}</h3>
      <p>\${product.price}</p>
      <button onClick={onAdd}>Add to Cart</button>
    </div>
  );
}

// products array has ~2,000 items
// Typing in search is laggy — each keystroke takes ~300ms`,
    rubric: {
      mustCover: [
        "Every keystroke re-renders all ProductCards because `() => onAddToCart(product.id)` creates a new function reference each render, defeating React's diffing.",
        "The filter, sort, and stats calculations run on every render — these should be memoized with useMemo since they only depend on products and searchTerm.",
        "ProductCard should be wrapped in React.memo to skip re-renders when props haven't changed, combined with useCallback for the onAdd handler.",
      ],
      strongSignals: [
        "Shows concrete useMemo usage for filtered/sorted/stats with correct dependency arrays.",
        "Explains that React.memo does shallow comparison, so stable references (useCallback) are required for it to work.",
        "Mentions that Math.min/max with spread on 2000 items is fine, but the real cost is 2000 DOM re-renders per keystroke.",
      ],
      weakPatterns: [
        "Only suggests React.memo without addressing the inline function problem that makes memo useless.",
        "Recommends debouncing the search input without fixing the underlying re-render issue.",
      ],
    },
  },
  {
    id: "pc_javascript_opt_003",
    category: "practical_coding",
    type: "optimization",
    language: "javascript",
    title: "Optimize a database query with N+1 problem",
    prompt:
      "Read the code below. Identify the performance bottleneck and explain how to fix it. Consider both the query pattern and data structure.",
    diff: `async function getOrderSummaries(userId) {
  const orders = await db.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  const summaries = [];
  for (const order of orders) {
    const items = await db.query(
      'SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
      [order.id]
    );

    const shipping = await db.query(
      'SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [order.id]
    );

    summaries.push({
      ...order,
      items: items.rows,
      itemCount: items.rows.length,
      total: items.rows.reduce((sum, i) => sum + i.price * i.quantity, 0),
      shippingStatus: shipping.rows[0]?.status || 'pending',
    });
  }

  return summaries;
}

// User has ~150 orders
// Page load takes 8-12 seconds
// Database metrics show ~450 queries per page load`,
    rubric: {
      mustCover: [
        "This is a classic N+1 query problem — for N orders, it makes 2N additional queries (items + shipping), totaling 1 + 2×150 = 301 queries.",
        "The fix is to batch the queries: fetch all order_items and shipments for all order IDs in one query each using WHERE order_id IN (...), then join in JS.",
        "SELECT * on orders pulls unnecessary columns — only the fields used in the summary should be selected to reduce data transfer.",
      ],
      strongSignals: [
        "Shows a concrete batched query using ANY($1) or IN with the array of order IDs, reducing 301 queries to 3.",
        "Suggests using a single JOIN query that combines orders + items + shipments in one round-trip if the database supports it.",
        "Notes that adding an index on order_items(order_id) and shipments(order_id) would further improve performance.",
      ],
      weakPatterns: [
        "Only mentions 'too many queries' without quantifying the N+1 pattern or explaining the fix.",
        "Suggests caching results without fixing the underlying query pattern.",
      ],
    },
  },
  {
    id: "pc_python_opt_001",
    category: "practical_coding",
    type: "optimization",
    language: "python",
    title: "Optimize a string processing pipeline",
    prompt:
      "Read the function below. Identify why it's slow and propose optimizations. Explain the memory and CPU implications of each change.",
    diff: `def process_log_entries(raw_log):
    # raw_log is a string, typically 50-200MB of server logs
    lines = raw_log.split('\\n')

    # Step 1: Filter to error lines only
    error_lines = [line for line in lines
                   if 'ERROR' in line or 'FATAL' in line]

    # Step 2: Parse each error line
    parsed = []
    for line in error_lines:
        parts = line.split(' | ')
        parsed.append({
            'timestamp': parts[0],
            'level': parts[1],
            'message': ' | '.join(parts[2:]),
            'source': line,
        })

    # Step 3: Deduplicate by message
    unique = []
    for entry in parsed:
        if not any(e['message'] == entry['message'] for e in unique):
            unique.append(entry)

    # Step 4: Sort by timestamp
    sorted_entries = sorted(unique, key=lambda e: e['timestamp'])

    return sorted_entries

# Called hourly on production log files
# Current: takes 45 seconds, spikes memory to 2GB+`,
    rubric: {
      mustCover: [
        "split('\\n') on a 200MB string creates a list of millions of strings, doubling memory usage — the entire file is duplicated as individual string objects.",
        "The deduplication uses linear search (any() inside a loop), which is O(n²) — for large error sets this dominates the processing time. A dict/set keyed by message makes it O(n).",
        "The pipeline creates 4 intermediate lists (lines, error_lines, parsed, unique) — each is a full copy. A single-pass generator approach would dramatically reduce memory.",
      ],
      strongSignals: [
        "Suggests reading line-by-line with a file iterator or io.StringIO instead of loading the entire file into memory.",
        "Notes that combining filter + map + dedup into a single pass with a seen set avoids all intermediate lists.",
        "Calculates the memory impact: 200MB string + 200MB of line references + parsed dicts ≈ 2GB+ peak allocation.",
      ],
      weakPatterns: [
        "Only mentions 'use generators' without explaining why the current approach uses too much memory.",
        "Suggests optimizing the sort without addressing the O(n²) deduplication which is the actual bottleneck.",
      ],
    },
  },
];

// ── Metadata for categories and types ────────────────────

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  types: TypeMeta[];
}

export interface TypeMeta {
  id: string;
  label: string;
  description: string;
  language?: string; // for practical_coding
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "code_review",
    label: "Code Review",
    description: "Read a diff, find bugs, explain risks and next steps before merging.",
    types: [
      { id: "security_review", label: "Security Review", description: "Find vulnerabilities, injection risks, auth flaws" },
      { id: "performance_review", label: "Performance Review", description: "Spot performance regressions, memory issues, contract changes" },
      { id: "logic_review", label: "Logic Review", description: "Identify race conditions, edge cases, correctness bugs" },
      { id: "api_review", label: "API Review", description: "Review API design, error handling, observability" },
    ],
  },
  {
    id: "system_design",
    label: "System Design",
    description: "Architect a system, defend your tradeoffs, address scale and failure modes.",
    types: [
      { id: "scalability", label: "Scalability", description: "Design systems that handle millions of users" },
      { id: "database_design", label: "Database Design", description: "Schema design, indexing, multi-tenancy" },
      { id: "api_architecture", label: "API Architecture", description: "Rate limiting, API gateways, versioning" },
    ],
  },
  {
    id: "debugging",
    label: "Debugging",
    description: "Read code and logs, trace the root cause, propose a targeted fix.",
    types: [
      { id: "runtime_error", label: "Runtime Error", description: "TypeError, null refs, intermittent crashes" },
      { id: "logic_bug", label: "Logic Bug", description: "Off-by-one, incorrect calculations, wrong behavior" },
      { id: "memory_leak", label: "Memory Leak", description: "Growing memory, leaked resources, unbounded buffers" },
      { id: "concurrency_bug", label: "Concurrency Bug", description: "Race conditions, deadlocks, double execution" },
    ],
  },
  {
    id: "data_analysis",
    label: "Data Analysis",
    description: "Write queries, design pipelines, model data for analytics.",
    types: [
      { id: "sql_query", label: "SQL Query", description: "Write and optimize SQL for analytics" },
      { id: "data_pipeline", label: "Data Pipeline", description: "Design ETL/ELT pipelines for scale" },
      { id: "data_modeling", label: "Data Modeling", description: "Star schemas, dimensional modeling, warehousing" },
    ],
  },
  {
    id: "practical_coding",
    label: "Practical Coding",
    description: "Implement real data structures, algorithms, and systems in your language.",
    types: [
      { id: "implementation", label: "Implementation", description: "Build data structures and systems from scratch" },
      { id: "optimization", label: "Optimization", description: "Profile and optimize existing code" },
    ],
  },
];

export const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "c_cpp", label: "C/C++" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go" },
  { id: "kotlin", label: "Kotlin" },
];

// ── Query helpers ────────────────────────────────────────

export function getRandom(guestOnly = false): Question {
  const pool = guestOnly ? questions.filter((q) => q.guest) : questions;
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

export function getRandomByCategory(category?: string, type?: string, language?: string, guestOnly = false): Question {
  let pool = guestOnly ? questions.filter((q) => q.guest) : questions;
  if (category) pool = pool.filter((q) => q.category === category);
  if (type) pool = pool.filter((q) => q.type === type);
  if (language) pool = pool.filter((q) => q.language === language);
  if (pool.length === 0) pool = guestOnly ? questions.filter((q) => q.guest) : questions;
  return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
}

/** @deprecated Use getRandomByCategory instead */
export function getRandomByType(type?: string, guestOnly = false): Question {
  return getRandomByCategory(undefined, type, undefined, guestOnly);
}

export function getById(id: string): Question | undefined {
  const q = questions.find((q) => q.id === id);
  return q ? structuredClone(q) : undefined;
}

export function getAll(): Question[] {
  return structuredClone(questions);
}

export function getGuestQuestions(): Question[] {
  return structuredClone(questions.filter((q) => q.guest));
}

export function getByCategory(category: string, type?: string, language?: string): Question[] {
  let pool = questions.filter((q) => q.category === category);
  if (type) pool = pool.filter((q) => q.type === type);
  if (language) pool = pool.filter((q) => q.language === language);
  return structuredClone(pool);
}
