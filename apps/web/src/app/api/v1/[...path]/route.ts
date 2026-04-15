import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

function handler(req: NextRequest) {
  // Strip /api/v1 prefix so /api/v1/practice/questions → /practice/questions
  const url = new URL(req.url);
  const rewritten = new URL(req.url);
  rewritten.pathname = url.pathname.replace(/^\/api\/v1/, "");
  const rewrittenReq = new NextRequest(rewritten, req);
  return proxyRequest(rewrittenReq, { rewriteCookies: true });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
