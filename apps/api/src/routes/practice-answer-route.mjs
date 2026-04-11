import { createPracticeAnswer, listPracticeAnswers } from "../domain/practice-answer.service.mjs";
import { evaluatePracticeAnswerJob } from "../jobs/evaluate-practice-answer.job.mjs";
import { validatePracticeAnswerInput } from "../lib/validation.mjs";

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handlePracticeAnswerCollectionRoute(request, response) {
  if (request.method === "GET") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, answers: listPracticeAnswers() }));
    return true;
  }

  if (request.method === "POST") {
    const body = await readJsonBody(request);
    const errors = validatePracticeAnswerInput(body);

    if (errors.length > 0) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { code: "invalid_input", message: "Practice answer payload is invalid.", details: errors } }));
      return true;
    }

    const answer = createPracticeAnswer(body);
    const evaluation = await evaluatePracticeAnswerJob(answer);
    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, answer, evaluation }));
    return true;
  }

  response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
  return true;
}
