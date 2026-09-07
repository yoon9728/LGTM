import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { test } from "vitest";
import ts from "typescript";

// Source-level component/handler tests. No server, browser, DB, or provider is started.
// This small hook harness does not replace browser/layout or React lifecycle tests.
const sourceRoot = new URL("../", import.meta.url);
const sessionPage = "app/practice/session/[id]/page.tsx";
const listPage = "app/practice/[category]/[type]/page.tsx";
const params = { params: { id: "s" } };
const signedIn = { data: { user: { id: "u" } }, isPending: false };
const guest = { data: null, isPending: false };
const jsx = (type, props, key) => ({ type, props, key });

function load(file, dependencies = {}, globals = {}) {
  const filename = fileURLToPath(new URL(file, sourceRoot));
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports,
    require(id) {
      if (id in dependencies) return dependencies[id];
      if (id === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "Fragment" };
      if (id === "next/link") return { default: "Link", __esModule: true };
      if (id === "next/dynamic") return { default: () => "Dynamic", __esModule: true };
      if (id === "@/lib/utils") return { cn: (...parts) => parts.filter(Boolean).join(" ") };
      if (id === "@/lib/guest") return { GUEST_LIMIT: 4, useGuestSessionCount: () => 0 };
      if (id === "@/components/theme-provider") return { useTheme: () => ({ theme: "dark" }) };
      if (id === "@/lib/language-registry") return { languages: [{ id: "python", label: "Python" }, { id: "javascript", label: "JavaScript" }], getMonacoLanguage: (id) => id };
      if (id.startsWith("@/components/") || id === "lucide-react") return new Proxy({}, { get: (_, key) => key });
      throw new Error(`Unexpected import: ${id}`);
    },
    crypto: webcrypto, console, Event,
    process: { env: { NODE_ENV: "test" } },
    window: { scrollTo() {} },
    setInterval: () => 1, clearInterval() {}, setTimeout: () => 1,
    fetch: () => { throw new Error("Unexpected network request"); },
    ...globals,
  }, { filename });
  return loadedModule.exports;
}

function createHarness(file, api = {}, auth = signedIn, exportName = "default") {
  const slots = [];
  const effects = [];
  const cleanups = new Map();
  let childKey;
  let cursor = 0;
  const react = {
    use: (value) => value,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(fn) { cursor++; return fn; },
    useMemo(fn) { cursor++; return fn(); },
    useEffect(fn, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((value, index) => !Object.is(value, previous[index]))) {
        slots[index] = deps;
        effects.push(() => {
          cleanups.get(index)?.();
          const cleanup = fn();
          if (typeof cleanup === "function") cleanups.set(index, cleanup);
          else cleanups.delete(index);
        });
      }
    },
  };
  // Stable callback identity matches React's useCallback contract.
  react.useCallback = (fn, deps) => {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) slots[index] = { fn, deps };
    return slots[index].fn;
  };
  const pushes = [];
  const router = { push: (path) => pushes.push(path) };
  const Component = load(file, {
    react,
    "@/lib/api": { api, getApiErrorMessage: (_, fallback) => fallback },
    "@/lib/auth-client": { useSession: () => auth },
    "next/navigation": { useRouter: () => router },
  })[exportName];
  return {
    pushes,
    render(props = params) {
      cursor = 0;
      let tree = Component(props);
      if (typeof tree.type === "function") {
        if (childKey !== tree.key) {
          for (const cleanup of cleanups.values()) cleanup();
          cleanups.clear();
          slots.length = 0;
          effects.length = 0;
          childKey = tree.key;
        }
        cursor = 0;
        tree = tree.type(tree.props);
      }
      while (effects.length) effects.shift()();
      return tree;
    },
  };
}

function findAll(tree, predicate, found = []) {
  if (!tree || typeof tree !== "object") return found;
  if (Array.isArray(tree)) { tree.forEach((node) => findAll(node, predicate, found)); return found; }
  if (predicate(tree)) found.push(tree);
  findAll(tree.props?.children, predicate, found);
  return found;
}

function text(tree) {
  if (tree == null || typeof tree === "boolean") return "";
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  return typeof tree === "object" ? text(tree.props?.children) : String(tree);
}

const button = (tree, label) => findAll(tree, (node) => ["button", "Button"].includes(node.type) && text(node).includes(label))[0];
const form = (tree) => findAll(tree, (node) => node.type === "form")[0];
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const evaluation = { id: "e", answerId: "a", score: 100, evaluable: true, reason: null, rationale: "Correct. Good explanation.", strengths: [], weaknesses: [], nextSteps: [], criteriaResults: [], provider: "mcq-exact-match" };
const question = { id: "q", category: "code_review", type: "security", title: "Question", prompt: "Prompt", diff: "+ code" };
const session = { id: "s", language: null, status: "question_ready", question };
const answer = (review) => ({ id: "a", review });

test("reopening a completed review restores the submitted answer", async () => {
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, status: "answer_submitted" } }),
    getSessionResult: async () => ({ answer: answer({ summary: "SAVED SUMMARY", findings: ["SAVED FINDING"] }), evaluation }),
  });
  h.render(); await flush(); const tree = h.render();
  assert.match(text(tree), /SAVED SUMMARY/);
  assert.match(text(tree), /SAVED FINDING/);
  assert(findAll(tree, (node) => node.type === "EvaluationResult").length);
});

test("restores coding blocks instead of the starter template", async () => {
  const coding = { ...question, category: "practical_coding", templates: { python: "pass" } };
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, question: coding, language: "python", status: "answer_submitted" } }),
    getSessionResult: async () => ({ answer: answer({ blocks: [{ type: "code", language: "python", content: "return saved_solution" }], approach: "Saved approach" }), evaluation }),
  });
  h.render(); await flush(); const tree = h.render();
  assert.match(text(tree), /return saved_solution/);
  assert.match(text(tree), /Saved approach/);
});

test("a result-load failure does not expose a new editable answer", async () => {
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, status: "answer_submitted" } }),
    getSessionResult: async () => { throw new Error("offline"); },
  });
  h.render(); await flush(); const tree = h.render();
  assert(!form(tree));
  assert(button(tree, "Reload saved result"));
  assert.match(text(tree), /does not run a new evaluation/);
});

test("submitting MCQ locks choices, blocks duplicate submit, and restores the graded selection", async () => {
  let resolveSubmit;
  const sent = [];
  const mcq = { ...question, category: "cfa", format: "mcq", choices: ["Option A", "Option B"] };
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, question: mcq } }),
    submitAnswer: (body) => { sent.push(body); return new Promise((resolve) => { resolveSubmit = resolve; }); },
  });
  h.render(); await flush(); let tree = h.render();
  await button(tree, "Show answer choices").props.onClick(); tree = h.render();
  button(tree, "Option A").props.onClick(); tree = h.render();
  const submit = form(tree).props.onSubmit;
  const pending = submit({ preventDefault() {} });
  await submit({ preventDefault() {} });
  tree = h.render();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].selectedAnswer, "A");
  assert.equal(button(tree, "Option B").props.disabled, true);
  assert(findAll(tree, (node) => node.type === "fieldset" && node.props.disabled).length);
  resolveSubmit({ answer: answer({ selectedAnswer: "A" }), evaluation }); await pending;
  tree = h.render();
  assert.match(button(tree, "Option A").props.className, /border-emerald-500/);
  assert.doesNotMatch(button(tree, "Option B").props.className, /border-emerald-500/);
});

test("provider failure is not displayed as zero and has an explicit retry action", () => {
  const failed = { ...evaluation, evaluable: false, score: null, reason: "evaluation_timeout", provider: "provider_failure_fallback" };
  const onRetry = () => {};
  const h = createHarness("components/evaluation-result.tsx", {}, signedIn, "EvaluationResult");
  const tree = h.render({ evaluation: failed, onRetry, retrying: false });
  assert.match(text(tree), /Not evaluated/);
  assert.doesNotMatch(text(tree), /0 \/ 100/);
  assert.equal(button(tree, "Retry evaluation").props.onClick, onRetry);
  assert.equal(button(h.render({ evaluation: failed, onRetry, retrying: true }), "Retrying").props.disabled, true);
});

test("an actual scored zero remains a score, not a provider failure", () => {
  const h = createHarness("components/evaluation-result.tsx", {}, signedIn, "EvaluationResult");
  const tree = h.render({ evaluation: { ...evaluation, score: 0, provider: "openai-live" } });
  assert.match(text(tree), /0 \/ 100/);
  assert.doesNotMatch(text(tree), /Not evaluated|Not scored/);
});

test("retry evaluates the saved answer without submitting a second answer", async () => {
  let retries = 0;
  const saved = answer({ summary: "Saved review" });
  const failed = { ...evaluation, evaluable: false, score: null, reason: "provider_failure" };
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, status: "answer_submitted" } }),
    getSessionResult: async () => ({ answer: saved, evaluation: failed }),
    retryEvaluation: async () => { retries++; return { answer: saved, evaluation }; },
    submitAnswer: () => { throw new Error("Must not submit the answer again"); },
  });
  h.render(); await flush(); let tree = h.render();
  const result = findAll(tree, (node) => node.type === "EvaluationResult")[0];
  assert.equal(result.props.evaluation.score, null);
  assert.equal(retries, 0, "opening a failed result must not spend a retry");
  await result.props.onRetry(); tree = h.render();
  assert.equal(retries, 1);
  assert.equal(findAll(tree, (node) => node.type === "EvaluationResult")[0].props.evaluation.score, 100);
  assert.match(text(tree), /Saved review/);
});

test("a duplicate-answer response restores the original answer, not the new draft", async () => {
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session }),
    submitAnswer: async () => { throw Object.assign(new Error("Already submitted"), { status: 409 }); },
    getSessionResult: async () => ({ answer: answer({ summary: "ORIGINAL REVIEW" }), evaluation }),
  });
  h.render(); await flush(); let tree = h.render();
  await button(tree, "write my review").props.onClick(); tree = h.render();
  findAll(tree, (node) => node.type === "Textarea" && node.props.id === "summary")[0].props.onChange({ target: { value: "NEW DRAFT" } });
  tree = h.render(); await form(tree).props.onSubmit({ preventDefault() {} }); tree = h.render();
  assert.match(text(tree), /ORIGINAL REVIEW/);
  assert.doesNotMatch(text(tree), /NEW DRAFT/);
});

test("a saved answer with no evaluation waits for an explicit retry", async () => {
  let retries = 0;
  const saved = answer({ summary: "Saved without feedback" });
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, status: "answer_submitted" } }),
    getSessionResult: async () => ({ answer: saved, evaluation: null }),
    retryEvaluation: async () => { retries++; return { answer: saved, evaluation }; },
  });
  h.render(); await flush(); const tree = h.render();
  assert.equal(retries, 0);
  assert.match(text(tree), /Saved without feedback/);
  await button(tree, "Retry evaluation").props.onClick();
  assert.equal(retries, 1);
});

test("changing session ID resets the draft and ignores a late submission result", async () => {
  let resolveSubmit;
  const h = createHarness(sessionPage, {
    getSession: async (id) => ({ session: { ...session, id, question: { ...question, title: id } } }),
    submitAnswer: () => new Promise((resolve) => { resolveSubmit = resolve; }),
  });
  h.render(); await flush(); let tree = h.render();
  await button(tree, "write my review").props.onClick(); tree = h.render();
  findAll(tree, (node) => node.type === "Textarea" && node.props.id === "summary")[0].props.onChange({ target: { value: "OLD DRAFT" } });
  tree = h.render();
  const pending = form(tree).props.onSubmit({ preventDefault() {} });
  const next = { params: { id: "next" } };
  h.render(next); await flush(); tree = h.render(next);
  await button(tree, "write my review").props.onClick(); tree = h.render(next);
  assert.equal(findAll(tree, (node) => node.type === "Textarea" && node.props.id === "summary")[0].props.value, "");
  resolveSubmit({ answer: answer({ summary: "OLD SAVED ANSWER" }), evaluation }); await pending;
  tree = h.render(next);
  assert(form(tree));
  assert(!findAll(tree, (node) => node.type === "EvaluationResult").length);
  assert.doesNotMatch(text(tree), /OLD SAVED ANSWER/);
});

test("a late next-question response cannot navigate away from a different session", async () => {
  let resolveCreate;
  const h = createHarness(sessionPage, {
    getSession: async (id) => ({ session: { ...session, id, status: id === "s" ? "answer_submitted" : "question_ready" } }),
    getSessionResult: async () => ({ answer: answer({ summary: "Saved" }), evaluation }),
    createSession: () => new Promise((resolve) => { resolveCreate = resolve; }),
  });
  h.render(); await flush(); let tree = h.render();
  const pending = button(tree, "Next random").props.onClick();
  const next = { params: { id: "chosen-session" } };
  h.render(next); await flush(); tree = h.render(next);
  assert(button(tree, "write my review"));
  resolveCreate({ session: { id: "unwanted-session" } }); await pending;
  assert.deepEqual(h.pushes, []);
});

test("Next random does not filter language-neutral coding questions by session language", async () => {
  let payload;
  const h = createHarness(sessionPage, {
    getSession: async () => ({ session: { ...session, language: "python", status: "answer_submitted", question: { ...question, category: "practical_coding", type: "implementation" } } }),
    getSessionResult: async () => ({ answer: answer({ code: "return 1" }), evaluation }),
    createSession: async (body) => { payload = body; return { session: { id: "next" } }; },
  });
  h.render(); await flush(); const tree = h.render();
  await button(tree, "Next random").props.onClick();
  assert.equal(payload.language, undefined);
  assert.equal(payload.category, "practical_coding");
  assert.deepEqual(h.pushes, ["/practice/session/next"]);
});

test("question-start failures show an alert instead of silently resetting the button", async () => {
  const h = createHarness(listPage, {
    getMeta: async () => ({ categories: [{ id: "cfa", label: "CFA", types: [{ id: "ethics", label: "Ethics" }] }] }),
    getQuestions: async () => ({ questions: [], categoryStats: {} }),
    createSession: async () => { throw new Error("429"); },
  }, guest);
  const props = { params: { category: "cfa", type: "ethics" } };
  h.render(props); await flush(); let tree = h.render(props);
  await button(tree, "Random question").props.onClick(); tree = h.render(props);
  assert(findAll(tree, (node) => node.props?.role === "alert").length);
  assert.equal(button(tree, "Random question").props.disabled, false);
});

test("history excludes missing scores but retains real zeros and links to the saved session", async () => {
  const history = [90, null, 0].map((score, index) => ({ sessionId: `s${index}`, questionTitle: `Q${index}`, questionCategory: "cfa", status: "answer_submitted", score, createdAt: "2026-04-01" }));
  const h = createHarness("app/history/page.tsx", { getHistory: async () => ({ history }) });
  h.render(); await flush(); const tree = h.render();
  assert.match(text(tree), /Avg Score 45/);
  assert(findAll(tree, (node) => node.type === "Link" && node.props.href === "/practice/session/s0").length);
});

test("block editor preserves custom code when changing languages and respects read-only mode", () => {
  let changed;
  const props = { blocks: [{ id: "b", type: "code", language: "javascript", content: "custom solution" }], templates: { javascript: "starter", python: "pass" }, onChange: (blocks) => { changed = blocks; } };
  const h = createHarness("components/block-editor.tsx", {}, signedIn, "BlockEditor");
  let tree = h.render(props);
  button(tree, "JavaScript").props.onClick(); tree = h.render(props);
  button(tree, "Python").props.onClick();
  assert.equal(changed[0].content, "custom solution");
  assert.equal(changed[0].language, "python");
  tree = h.render({ ...props, disabled: true });
  assert.equal(tree.props.disabled, true);
  assert.equal(findAll(tree, (node) => node.type === "Dynamic")[0].props.options.readOnly, true);
});

test("guest usage expires after 24 hours, ignores lifetime counters, and tolerates blocked storage", () => {
  let now = 1_000_000;
  const values = new Map([["lgtm_guest_completions", "4"]]);
  const fakeWindow = { localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }, dispatchEvent() {} };
  const usage = load("lib/guest.ts", { react: {} }, { window: fakeWindow, Date: { now: () => now } });
  assert.equal(usage.getGuestSessionCount(), 0);
  for (let i = 0; i < 4; i++) usage.recordGuestSession();
  assert.equal(usage.getGuestSessionCount(), 4);
  now += 24 * 60 * 60 * 1000;
  assert.equal(usage.getGuestSessionCount(), 0);
  usage.recordGuestSession();
  assert.equal(usage.getGuestSessionCount(), 1);
  fakeWindow.localStorage.getItem = () => { throw new Error("blocked"); };
  fakeWindow.localStorage.setItem = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => usage.recordGuestSession());
  assert.equal(usage.getGuestSessionCount(), 2);
});

test("guest storage subscription updates across tabs and cleans up its expiry timer", () => {
  const values = new Map();
  const listeners = new Map();
  let subscription;
  let cleaned = false;
  const usage = load("lib/guest.ts", {
    react: { useSyncExternalStore: (subscribe, snapshot, serverSnapshot) => { subscription = subscribe; assert.equal(serverSnapshot(), 0); return snapshot(); } },
  }, {
    window: {
      localStorage: { getItem: (key) => values.get(key) ?? null },
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name) => listeners.delete(name),
      setInterval: () => 7,
      clearInterval: (id) => { cleaned = id === 7; },
    },
  });
  assert.equal(usage.useGuestSessionCount(), 0);
  let updates = 0;
  const unsubscribe = subscription(() => { updates++; });
  values.set(usage.GUEST_STORAGE_KEY, JSON.stringify({ count: 2, resetAt: Date.now() + 60_000 }));
  listeners.get("storage")();
  assert.equal(updates, 1);
  assert.equal(usage.useGuestSessionCount(), 2);
  unsubscribe();
  assert.equal(listeners.size, 0);
  assert.equal(cleaned, true);
});

test("theme synchronizes saved preference and still toggles when storage is blocked", () => {
  const classes = new Set(["dark"]);
  let stored = "light";
  let subscribe;
  let disconnected = false;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  const theme = load("components/theme-provider.tsx", {
    react: {
      createContext: () => ({ Provider: "Provider" }),
      useContext: () => ({}),
      useSyncExternalStore: (fn, snapshot, serverSnapshot) => { subscribe = fn; assert.equal(serverSnapshot(), "dark"); return snapshot(); },
    },
  }, {
    window: { localStorage: storage, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), addEventListener() {}, removeEventListener() {} },
    document: { documentElement: { classList: { contains: (name) => classes.has(name), toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) } } },
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
  });
  theme.ThemeProvider({ children: null });
  const unsubscribe = subscribe(() => {});
  const tree = theme.ThemeProvider({ children: null });
  assert.equal(tree.props.value.theme, "light");
  storage.setItem = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => tree.props.value.toggle());
  assert.equal(theme.ThemeProvider({ children: null }).props.value.theme, "dark");
  unsubscribe();
  assert.equal(disconnected, true);
});

test("API counts guest session creation only after success and translates quota errors", async () => {
  let count = 0;
  let status = 201;
  let isGuest = true;
  const client = load("lib/api.ts", { "./guest": { recordGuestSession: () => { count++; } } }, {
    fetch: async () => ({ ok: status < 400, status, json: async () => ({ session, isGuest }), text: async () => JSON.stringify({ error: "Guest session limit reached" }) }),
  });
  await client.api.createSession();
  assert.equal(count, 1);
  isGuest = false;
  await client.api.createSession();
  assert.equal(count, 1);
  status = 429;
  await assert.rejects(client.api.createSession(), (error) => {
    assert.match(client.getApiErrorMessage(error, "fallback"), /daily limit resets/);
    return true;
  });
  assert.equal(count, 1);
});

test("result reads and warmup stay on the same-origin proxy without a POST", async () => {
  const requests = [];
  const client = load("lib/api.ts", { "./guest": { recordGuestSession() {} } }, {
    fetch: async (url, options) => { requests.push({ url, method: options?.method ?? "GET" }); return { ok: true, json: async () => ({ answer: null, evaluation: null }) }; },
  });
  await client.api.getSessionResult("s");
  client.warmUpApi(); await flush();
  assert.deepEqual(requests, [
    { url: "/api/v1/practice/sessions/s/result", method: "GET" },
    { url: "/api/v1/health", method: "GET" },
  ]);
});
