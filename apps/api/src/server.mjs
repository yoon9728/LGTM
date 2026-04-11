import http from "node:http";
import { loadInterviewAppEnv } from "./lib/env.mjs";
import { handleApiRequest } from "./routes/index.mjs";

loadInterviewAppEnv();

const port = Number(process.env.PORT || 4300);
const allowOrigin = process.env.INTERVIEW_APP_WEB_ORIGIN || "http://localhost:4173";

function applyCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", allowOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer(async (request, response) => {
  try {
    applyCorsHeaders(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const handled = await handleApiRequest(request, response);
    if (!handled) {
      response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { code: "not_found", message: "Route not found." } }));
    }
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: { code: "internal_error", message: error.message } }));
  }
});

server.listen(port, () => {
  console.log(`Interview App API listening on http://localhost:${port}`);
});
