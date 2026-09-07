import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

function handler(req: NextRequest) {
  // Strip /api/v1 prefix so /api/v1/practice/questions → /practice/questions
  const url = new URL(req.url);
  return proxyRequest(req, { rewriteCookies: true, pathname: url.pathname.replace(/^\/api\/v1/, "") });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const maxDuration = 120;
