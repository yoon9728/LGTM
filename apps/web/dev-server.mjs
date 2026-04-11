import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 4173);
const root = path.join(process.cwd(), "src");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const target = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
  const filePath = path.join(root, target);

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes.get(ext) || 'text/plain; charset=utf-8' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Interview App web listening on http://localhost:${port}`);
});
