const apiBase = window.INTERVIEW_APP_API_BASE || "http://localhost:4300";
const draftStorageKey = "interview-app-practice-draft";

// ── DOM refs ─────────────────────────────────────────────
const hero           = document.querySelector("#hero");
const startButton    = document.querySelector("#start-session");
const practiceFlow   = document.querySelector("#practice-flow");
const questionTitle  = document.querySelector("#question-title");
const diffView       = document.querySelector("#diff-view");
const diffFilename   = document.querySelector("#diff-filename");
const diffStats      = document.querySelector("#diff-stats");
const answerForm     = document.querySelector("#answer-form");
const submitButton   = document.querySelector("#submit-answer");
const retryButton    = document.querySelector("#retry-answer");
const summaryField   = document.querySelector("#summary");
const findingsField  = document.querySelector("#findings");
const resultPanel    = document.querySelector("#result-panel");
const scoreValue     = document.querySelector("#score-value");
const scoreGrade     = document.querySelector("#score-grade");
const scoreBar       = document.querySelector("#score-bar");
const reasonLine     = document.querySelector("#reason-line");
const statusLine     = document.querySelector("#status-line");
const statusText     = document.querySelector("#status-text");
const strengthsList  = document.querySelector("#strengths-list");
const weaknessesList = document.querySelector("#weaknesses-list");
const nextStepsList  = document.querySelector("#next-steps-list");
const newSessionBtn  = document.querySelector("#new-session");

let currentSession       = null;
let currentQuestion      = null;
let lastSubmittedPayload = null;

// ── Session Progress ──────────────────────────────────────
/**
 * Updates the session progress tracker (the three-dot stepper).
 * step: 1 = diff, 2 = analysis, 3 = result
 */
function setSessionStep(active) {
  const steps = document.querySelectorAll(".session-step[data-step]");
  steps.forEach((el) => {
    const n = parseInt(el.dataset.step, 10);
    delete el.dataset.active;
    delete el.dataset.done;
    if (n === active) el.dataset.active = "true";
    else if (n < active) el.dataset.done = "true";
  });
}

// ── Score count-up animation ──────────────────────────────
/**
 * Animates the score value from 0 to endValue over ~900ms.
 * Uses a cubic ease-out curve so it decelerates into the final number.
 */
function animateScoreCountUp(endValue) {
  if (!scoreValue || typeof endValue !== "number") return;

  // Respect the user's motion preference: skip animation and show the
  // final value immediately so the score is never withheld.
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    scoreValue.textContent = Number.isInteger(endValue)
      ? String(endValue)
      : endValue.toFixed(1);
    return;
  }

  const duration    = 900;
  const startTime   = performance.now();
  const isInteger   = Number.isInteger(endValue);

  function tick(now) {
    const elapsed  = now - startTime;
    const t        = Math.min(elapsed / duration, 1);
    // Cubic ease-out: decelerate near the end
    const eased    = 1 - Math.pow(1 - t, 3);
    const current  = eased * endValue;

    scoreValue.textContent = isInteger
      ? String(Math.round(current))
      : current.toFixed(1);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      scoreValue.textContent = String(endValue);
    }
  }

  requestAnimationFrame(tick);
}

// ── Diff rendering ────────────────────────────────────────
/**
 * Parses a unified diff string and renders it with a gutter (line numbers)
 * and a code column. Each row gets a class for add/rem/meta/header.
 * Also updates the diff-stats toolbar element with added/removed counts.
 *
 * Structure per line:
 *   <span class="diff-line [diff-line--*]">
 *     <span class="diff-gutter" aria-hidden="true">N</span>
 *     <span class="diff-code">…text…</span>
 *   </span>
 *   \n
 */
function renderDiff(target, diffText) {
  if (!diffText) {
    const row = _makeDiffRow("diff-line--header", 0, "// No diff available.", false);
    target.innerHTML = "";
    target.appendChild(row);
    _renderDiffStats(0, 0);
    return;
  }

  const lines      = diffText.split("\n");
  const frag       = document.createDocumentFragment();
  let lineNum      = 0;
  let hasFilename  = false;
  let addCount     = 0;
  let remCount     = 0;

  for (const line of lines) {
    let kind         = "";
    let showLineNum  = false;

    if (line.startsWith("+++") || line.startsWith("---")) {
      kind = "diff-line--header";
      if (!hasFilename && line.startsWith("+++ b/")) {
        const name = line.slice(6).trim();
        if (name && diffFilename) {
          diffFilename.textContent = name;
          hasFilename = true;
        }
      }
    } else if (
      line.startsWith("diff ") ||
      line.startsWith("index ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file")
    ) {
      kind = "diff-line--header";
    } else if (line.startsWith("@@")) {
      kind = "diff-line--meta";
    } else if (line.startsWith("+")) {
      kind        = "diff-line--add";
      lineNum    += 1;
      showLineNum = true;
      addCount   += 1;
    } else if (line.startsWith("-")) {
      kind        = "diff-line--rem";
      showLineNum = true;
      remCount   += 1;
    } else {
      lineNum    += 1;
      showLineNum = true;
    }

    const row = _makeDiffRow(kind, lineNum, line, showLineNum);
    frag.appendChild(row);
    frag.appendChild(document.createTextNode("\n"));
  }

  target.innerHTML = "";
  target.appendChild(frag);
  _renderDiffStats(addCount, remCount);
}

/** Renders the +N −M change summary into #diff-stats. */
function _renderDiffStats(added, removed) {
  if (!diffStats) return;
  diffStats.innerHTML = "";
  if (added === 0 && removed === 0) return;

  if (added > 0) {
    const s = document.createElement("span");
    s.className = "diff-stats-add";
    s.textContent = `+${added}`;
    diffStats.appendChild(s);
  }
  if (added > 0 && removed > 0) {
    const sep = document.createElement("span");
    sep.className = "diff-stats-sep";
    sep.textContent = " / ";
    diffStats.appendChild(sep);
  }
  if (removed > 0) {
    const s = document.createElement("span");
    s.className = "diff-stats-rem";
    s.textContent = `−${removed}`;
    diffStats.appendChild(s);
  }
}

/**
 * Creates a single diff row element.
 */
function _makeDiffRow(kind, lineNum, text, showLineNum) {
  const row = document.createElement("span");
  row.className = "diff-line" + (kind ? " " + kind : "");

  const gutter = document.createElement("span");
  gutter.className = "diff-gutter";
  gutter.setAttribute("aria-hidden", "true");
  gutter.textContent = showLineNum ? String(lineNum) : "";

  const code = document.createElement("span");
  code.className = "diff-code";
  code.textContent = text;

  row.appendChild(gutter);
  row.appendChild(code);
  return row;
}

// ── Utility ───────────────────────────────────────────────
function renderList(target, items = []) {
  target.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function persistDraft() {
  const draft = {
    summary:  summaryField?.value  || "",
    findings: findingsField?.value || ""
  };
  window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (summaryField)  summaryField.value  = draft.summary  || "";
    if (findingsField) findingsField.value = draft.findings || "";
  } catch {
    // ignore malformed local draft state
  }
}

function setSubmitting(isSubmitting) {
  if (submitButton) submitButton.disabled = isSubmitting;
  if (startButton)  startButton.disabled  = isSubmitting;
}

function showStatus(message, kind = "info") {
  if (!statusLine) return;
  statusLine.hidden = !message;
  if (statusText) statusText.textContent = message || "";
  statusLine.dataset.kind = kind;
}

// ── Score display ──────────────────────────────────────────
/**
 * BUG-6: Instantly reset the score bar to 0% WITHOUT triggering the
 * CSS transition (which would animate the bar backward to 0 on reset).
 * We suppress the transition for one frame, reset, then restore.
 */
function resetScoreBar() {
  if (!scoreBar) return;
  scoreBar.style.transition = "none";
  scoreBar.style.width      = "0%";
  delete scoreBar.dataset.band;
  // Restore the transition after the synchronous style flush.
  requestAnimationFrame(() => {
    scoreBar.style.transition = "";
  });
}

/** Maps numeric score to a band name and short grade label. */
function _scoreInfo(score) {
  if (typeof score !== "number") return { band: "na", label: "" };
  if (score >= 9)  return { band: "high", label: "Excellent" };
  if (score >= 7)  return { band: "high", label: "Strong" };
  if (score >= 5)  return { band: "mid",  label: "Adequate" };
  if (score >= 3)  return { band: "low",  label: "Needs Work" };
  return                  { band: "low",  label: "Insufficient" };
}

function applyScoreBand(score) {
  const { band, label } = _scoreInfo(score);

  if (scoreValue) {
    scoreValue.dataset.band = band;
  }

  if (scoreGrade) {
    scoreGrade.textContent   = label;
    scoreGrade.dataset.band  = band;
  }

  if (scoreBar) {
    scoreBar.dataset.band = band;
    const pct = typeof score === "number"
      ? Math.min(100, Math.max(0, score * 10))
      : 0;
    // Trigger bar animation on next frame so CSS transition fires
    requestAnimationFrame(() => {
      scoreBar.style.width = `${pct}%`;
    });
  }
}

function renderEvaluation(evaluation = {}) {
  resultPanel.hidden = false;
  // Update progress to step 3
  setSessionStep(3);
  // Scroll the result into view — it lives below the fold after submission.
  requestAnimationFrame(() => {
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const evaluable = evaluation.evaluable !== false;
  const score     = evaluation.score;

  if (evaluable && typeof score === "number") {
    // Start count-up animation; applyScoreBand will set the final textContent
    // via the rAF inside — we pre-set to "0" so the count-up starts visually.
    scoreValue.textContent = "0";
    applyScoreBand(score);
    animateScoreCountUp(score);
  } else if (!evaluable) {
    scoreValue.textContent = "—";
    applyScoreBand(null);
  } else {
    scoreValue.textContent = score ?? "n/a";
    applyScoreBand(typeof score === "number" ? score : null);
  }

  reasonLine.hidden      = !evaluation.reason;
  reasonLine.textContent = evaluation.reason || "";

  // BUG-5: hide empty result columns / containers so we never show
  // a section heading with zero content beneath it.
  const strengths  = evaluation.strengths  || [];
  const weaknesses = evaluation.weaknesses || [];
  const nextSteps  = evaluation.nextSteps  || [];

  renderList(strengthsList,  strengths);
  renderList(weaknessesList, weaknesses);
  renderList(nextStepsList,  nextSteps);

  // Hide the entire strengths column when the API returned nothing.
  const strengthsCol = strengthsList?.closest(".result-col--strengths");
  if (strengthsCol) strengthsCol.hidden = strengths.length === 0;

  // Hide the entire weaknesses column when the API returned nothing.
  const weaknessesCol = weaknessesList?.closest(".result-col--weaknesses");
  if (weaknessesCol) weaknessesCol.hidden = weaknesses.length === 0;

  // If BOTH columns are empty, hide the grid wrapper too.
  const resultGrid = strengthsCol?.closest(".result-grid");
  if (resultGrid) resultGrid.hidden = strengths.length === 0 && weaknesses.length === 0;

  // Hide the "Next steps" container when the list is empty.
  const resultNext = nextStepsList?.closest(".result-next");
  if (resultNext) resultNext.hidden = nextSteps.length === 0;
}

// ── API helpers ───────────────────────────────────────────
async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with ${response.status}`;
    const error   = new Error(message);
    error.payload = payload;
    throw error;
  }
  return payload;
}

// ── Session lifecycle ──────────────────────────────────────
async function startSession() {
  setSubmitting(true);
  showStatus("Starting a new practice session…");
  try {
    const response = await fetch(`${apiBase}/practice/sessions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mode: "individual-practice" })
    });
    const payload = await parseJsonResponse(response);

    currentSession  = payload.session;
    currentQuestion = payload.question || payload.session?.question || null;

    // Reveal practice flow
    practiceFlow.hidden = false;
    hero?.setAttribute("hidden", "");

    // Initialise the session progress stepper at Step 1 (Diff).
    setSessionStep(1);

    questionTitle.textContent = currentQuestion?.title || "Review this diff";
    if (diffFilename) diffFilename.textContent = "";   // will be set by renderDiff if detectable
    renderDiff(diffView, currentQuestion?.diff || "");

    resultPanel.hidden = true;
    retryButton.hidden = true;

    // Reset score display — use helper to suppress transition (BUG-6).
    resetScoreBar();
    if (scoreValue) { scoreValue.textContent = "—"; delete scoreValue.dataset.band; }
    if (scoreGrade) { scoreGrade.textContent = "";  delete scoreGrade.dataset.band; }

    // BUG-7: Clear the form fields for the new session. We do NOT call
    // restoreDraft() here — a new session always starts with blank fields.
    // The page-load restoreDraft() handles the "browser-refresh mid-session"
    // case; here we actively clear to prevent a stale draft from a different
    // question bleeding into the new session's answer area.
    if (summaryField)  summaryField.value  = "";
    if (findingsField) findingsField.value = "";

    showStatus("");
  } catch (error) {
    showStatus(error.message || "Could not start a practice session.", "warning");
  } finally {
    setSubmitting(false);
  }
}

function buildSubmissionPayload() {
  const summary  = summaryField?.value.trim() || "";
  const findings = (findingsField?.value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    sessionId:  currentSession?.id,
    questionId: currentQuestion?.id,
    diff:       currentQuestion?.diff,
    summary,
    findings
  };
}

async function submitPayload(payload) {
  setSubmitting(true);
  retryButton.hidden = true;
  // Advance the session stepper to Step 2 (Analysis / AI evaluation in flight).
  setSessionStep(2);
  showStatus("Evaluating with AI — this takes a few seconds…", "processing");
  lastSubmittedPayload = payload;
  let shouldPersistDraft = true;

  try {
    const response = await fetch(`${apiBase}/practice/answers`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    const parsed     = await parseJsonResponse(response);
    const evaluation = parsed.evaluation || {};

    if (evaluation.status === "timeout") {
      showStatus("The evaluation timed out. Please retry with a clearer answer.", "timeout");
      retryButton.hidden = false;
    } else if (evaluation.provider === "provider_failure_fallback") {
      showStatus("The AI provider failed. Your answer is preserved — retry when ready.", "warning");
      retryButton.hidden = false;
    } else if (evaluation.evaluable === false) {
      showStatus("Answer could not be evaluated. See the reason below.", "warning");
      retryButton.hidden = false;
    } else {
      showStatus("Evaluation complete.", "success");
      shouldPersistDraft = false;
      window.localStorage.removeItem(draftStorageKey);
    }

    renderEvaluation(evaluation);
  } catch (error) {
    showStatus(error.message || "The answer could not be submitted.", "warning");
    retryButton.hidden = false;
  } finally {
    if (shouldPersistDraft) persistDraft();
    setSubmitting(false);
  }
}

async function submitAnswer(event) {
  event.preventDefault();

  // BUG-4 guard: block zero-content submissions before touching the API.
  const rawSummary  = summaryField?.value.trim()  || "";
  const rawFindings = findingsField?.value.trim() || "";
  if (!rawSummary && !rawFindings) {
    showStatus("Write your analysis before submitting — both fields are empty.", "warning");
    summaryField?.focus();
    return;
  }
  if (!rawSummary) {
    showStatus("Please add a summary — the single most important issue you found.", "warning");
    summaryField?.focus();
    return;
  }
  if (!rawFindings) {
    showStatus("Please add at least one finding before submitting.", "warning");
    findingsField?.focus();
    return;
  }

  await submitPayload(buildSubmissionPayload());
}

// ── Retry evaluation ──────────────────────────────────────
// Re-uses the already-stored answer via the dedicated retry endpoint.
// Previously the retry button re-POSTed to /practice/answers which always
// threw a duplicate_answer error on the server — making retry permanently broken.
async function retryEvaluation(sessionId) {
  setSubmitting(true);
  retryButton.hidden = true;
  showStatus("Retrying evaluation — this takes a few seconds…", "processing");
  try {
    const response = await fetch(
      `${apiBase}/practice/sessions/${encodeURIComponent(sessionId)}/retry-evaluation`,
      { method: "POST", headers: { "Content-Type": "application/json" } }
    );
    const parsed     = await parseJsonResponse(response);
    const evaluation = parsed.evaluation || {};

    if (evaluation.status === "timeout") {
      showStatus("The evaluation timed out. Please retry again.", "timeout");
      retryButton.hidden = false;
    } else if (evaluation.provider === "provider_failure_fallback") {
      showStatus("The AI provider failed. Your answer is preserved — retry when ready.", "warning");
      retryButton.hidden = false;
    } else if (evaluation.evaluable === false) {
      showStatus("Answer could not be evaluated. See the reason below.", "warning");
      retryButton.hidden = false;
    } else {
      showStatus("Evaluation complete.", "success");
    }

    renderEvaluation(evaluation);
  } catch (error) {
    showStatus(error.message || "The retry could not be completed.", "warning");
    retryButton.hidden = false;
  } finally {
    setSubmitting(false);
  }
}

// ── New session ────────────────────────────────────────────
function resetToHero() {
  practiceFlow.hidden = true;
  hero?.removeAttribute("hidden");
  if (summaryField)  summaryField.value  = "";
  if (findingsField) findingsField.value = "";
  window.localStorage.removeItem(draftStorageKey);
  showStatus("");
  resultPanel.hidden   = true;
  retryButton.hidden   = true;
  currentSession       = null;
  currentQuestion      = null;
  lastSubmittedPayload = null;

  // Reset score display — suppress transition on reset (BUG-6).
  resetScoreBar();
  if (scoreValue)   { scoreValue.textContent = "—"; delete scoreValue.dataset.band; }
  if (scoreGrade)   { scoreGrade.textContent = "";  delete scoreGrade.dataset.band; }
  if (diffFilename)   diffFilename.textContent = "";

  // Clear all session-step indicators so the stepper is blank for the next session.
  setSessionStep(0);

  // BUG-5: un-hide result columns/grid/next-steps so they're ready for the
  // next renderEvaluation call (they may have been hidden on empty response).
  const strengthsCol  = strengthsList?.closest(".result-col--strengths");
  const weaknessesCol = weaknessesList?.closest(".result-col--weaknesses");
  const resultGrid    = strengthsCol?.closest(".result-grid");
  const resultNext    = nextStepsList?.closest(".result-next");
  if (strengthsCol)  strengthsCol.hidden  = false;
  if (weaknessesCol) weaknessesCol.hidden = false;
  if (resultGrid)    resultGrid.hidden    = false;
  if (resultNext)    resultNext.hidden    = false;
}

// ── Event wiring ──────────────────────────────────────────
startButton?.addEventListener("click",  startSession);
answerForm?.addEventListener("submit",  submitAnswer);
newSessionBtn?.addEventListener("click", resetToHero);
retryButton?.addEventListener("click", async () => {
  // Use the dedicated retry endpoint when we have a session id; it avoids
  // re-inserting an answer that already exists in the store.
  if (currentSession?.id) {
    await retryEvaluation(currentSession.id);
  } else {
    const payload = lastSubmittedPayload || buildSubmissionPayload();
    await submitPayload(payload);
  }
});
summaryField?.addEventListener("input",  persistDraft);
findingsField?.addEventListener("input", persistDraft);

// Restore any in-progress draft on load
restoreDraft();
