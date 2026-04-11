import { createPracticeSession, listPracticeSessions } from "../domain/practice-session.service.mjs";

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

export async function handlePracticeSessionCollectionRoute(request, response) {
  if (request.method === "GET") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, sessions: listPracticeSessions() }));
    return true;
  }

  if (request.method === "POST") {
    const body = await readJsonBody(request);
    const session = createPracticeSession(body);
    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, session }));
    return true;
  }

  response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: { code: "method_not_allowed", message: "Method not allowed." } }));
  return true;
}
