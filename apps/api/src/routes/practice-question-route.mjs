import { getAllPracticeQuestions, getPracticeQuestionById } from "../storage/practice-question.repo.mjs";

export function handlePracticeQuestionCollectionRoute(request, response) {
  if (request.method !== "GET") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
    return true;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, questions: getAllPracticeQuestions() }));
  return true;
}

export function handlePracticeQuestionItemRoute(request, response, questionId) {
  if (request.method !== "GET") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
    return true;
  }

  const question = getPracticeQuestionById(questionId);
  if (!question) {
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "not_found", message: `Question '${questionId}' not found.` } }));
    return true;
  }

  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ ok: true, question }));
  return true;
}
