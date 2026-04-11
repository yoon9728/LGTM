import { getPracticeSession } from "../domain/practice-session.service.mjs";
import { findPracticeAnswerBySessionId } from "../storage/practice-answer.repo.mjs";
import { findPracticeEvaluationByAnswerId } from "../storage/practice-evaluation.repo.mjs";
import { evaluatePracticeAnswerJob } from "../jobs/evaluate-practice-answer.job.mjs";

export async function handlePracticeSessionItemRoute(request, response, sessionId) {
  if (request.method === "GET") {
    const session = getPracticeSession(sessionId);
    if (!session) {
      response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { code: "not_found", message: `Session '${sessionId}' not found.` } }));
      return true;
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, session }));
    return true;
  }

  response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
  return true;
}

// POST /practice/sessions/:sessionId/retry-evaluation
// Re-runs evaluation on the session's existing answer without creating a duplicate.
// This is the safe path for the frontend retry button after a timeout or provider failure.
export async function handlePracticeSessionRetryEvaluationRoute(request, response, sessionId) {
  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
    return true;
  }

  const session = getPracticeSession(sessionId);
  if (!session) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "not_found", message: `Session '${sessionId}' not found.` } }));
    return true;
  }

  const answer = findPracticeAnswerBySessionId(sessionId);
  if (!answer) {
    response.writeHead(422, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "no_answer", message: "No answer found for this session. Submit an answer first." } }));
    return true;
  }

  // Check whether there's already a successful evaluation — don't re-run if it succeeded
  const existing = findPracticeEvaluationByAnswerId(answer.id);
  if (existing && existing.evaluable === true && existing.score != null) {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, answer, evaluation: existing, reused: true }));
    return true;
  }

  // Re-run evaluation for an existing answer (e.g. after timeout or provider failure)
  const evaluation = await evaluatePracticeAnswerJob(answer);
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, answer, evaluation, retried: true }));
  return true;
}
