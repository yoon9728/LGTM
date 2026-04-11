export function handleHealthRoute(response) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({
    ok: true,
    service: "interview-app-api",
    mode: "practice",
    status: "mvp-slice-complete",
    routes: [
      "GET  /health",
      "GET  /practice/questions",
      "GET  /practice/questions/:id",
      "GET  /practice/sessions",
      "POST /practice/sessions",
      "GET  /practice/sessions/:id",
      "POST /practice/sessions/:id/retry-evaluation",
      "GET  /practice/answers",
      "POST /practice/answers",
      "GET  /practice/evaluations",
      "GET  /practice/evaluations?answerId=",
      "GET  /practice/evaluations/:id"
    ]
  }));

  return true;
}
