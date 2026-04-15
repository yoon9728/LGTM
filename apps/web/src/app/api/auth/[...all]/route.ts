import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

async function handler(req: NextRequest) {
  return proxyRequest(req, { rewriteCookies: true });
}

export const GET = handler;
export const POST = handler;
