import { handleHealthRoute } from "./health-route.mjs";
import { handlePracticeSessionCollectionRoute } from "./practice-session-route.mjs";
import { handlePracticeSessionItemRoute, handlePracticeSessionRetryEvaluationRoute } from "./practice-session-item-route.mjs";
import { handlePracticeAnswerCollectionRoute } from "./practice-answer-route.mjs";
import { handlePracticeEvaluationCollectionRoute, handlePracticeEvaluationItemRoute } from "./practice-evaluation-route.mjs";
import { handlePracticeQuestionCollectionRoute, handlePracticeQuestionItemRoute } from "./practice-question-route.mjs";

// Match /prefix/:id  or  /prefix/:id/suffix patterns.
// Returns the captured :id string or null if no match.
function matchSegment(pathname, prefix, suffix = "") {
  const withSuffix = suffix ? `${prefix}/` : prefix + "/";
  if (!pathname.startsWith(withSuffix)) return null;
  const rest = pathname.slice(withSuffix.length);
  if (suffix) {
    if (!rest.endsWith("/" + suffix)) return null;
    const id = rest.slice(0, rest.length - suffix.length - 1);
    return id.includes("/") ? null : id;
  }
  return rest.includes("/") ? null : rest || null;
}

export async function handleApiRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const path = url.pathname;

  if (request.method === "GET" && path === "/") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, service: "interview-app-api", slice: "mvp-first-slice" }));
    return true;
  }

  if (request.method === "GET" && path === "/health") {
    return handleHealthRoute(response);
  }

  // /practice/questions  and  /practice/questions/:id
  if (path === "/practice/questions") {
    return handlePracticeQuestionCollectionRoute(request, response);
  }
  const questionId = matchSegment(path, "/practice/questions");
  if (questionId) {
    return handlePracticeQuestionItemRoute(request, response, questionId);
  }

  // /practice/sessions/:id/retry-evaluation  (must come before the :id-only match)
  const retrySessionId = matchSegment(path, "/practice/sessions", "retry-evaluation");
  if (retrySessionId) {
    return handlePracticeSessionRetryEvaluationRoute(request, response, retrySessionId);
  }

  // /practice/sessions  and  /practice/sessions/:id
  if (path === "/practice/sessions") {
    return handlePracticeSessionCollectionRoute(request, response);
  }
  const sessionId = matchSegment(path, "/practice/sessions");
  if (sessionId) {
    return handlePracticeSessionItemRoute(request, response, sessionId);
  }

  // /practice/answers
  if (path === "/practice/answers") {
    return handlePracticeAnswerCollectionRoute(request, response);
  }

  // /practice/evaluations  and  /practice/evaluations/:id
  if (path === "/practice/evaluations") {
    return handlePracticeEvaluationCollectionRoute(request, response);
  }
  const evaluationId = matchSegment(path, "/practice/evaluations");
  if (evaluationId) {
    return handlePracticeEvaluationItemRoute(request, response, evaluationId);
  }

  return false;
}
