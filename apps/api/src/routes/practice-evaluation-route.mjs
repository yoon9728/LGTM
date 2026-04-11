import { getPracticeEvaluations, findPracticeEvaluationByAnswerId, findPracticeEvaluationById } from "../storage/practice-evaluation.repo.mjs";

export function handlePracticeEvaluationCollectionRoute(request, response) {
  if (request.method !== "GET") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
    return true;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const answerId = url.searchParams.get("answerId");

  if (answerId) {
    const evaluation = findPracticeEvaluationByAnswerId(answerId);
    if (!evaluation) {
      response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { code: "not_found", message: `No evaluation found for answer '${answerId}'.` } }));
      return true;
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, evaluation }));
    return true;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, evaluations: getPracticeEvaluations() }));
  return true;
}

export function handlePracticeEvaluationItemRoute(request, response, evaluationId) {
  if (request.method !== "GET") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
    return true;
  }

  const evaluation = findPracticeEvaluationById(evaluationId);
  if (!evaluation) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "not_found", message: `Evaluation '${evaluationId}' not found.` } }));
    return true;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, evaluation }));
  return true;
}
