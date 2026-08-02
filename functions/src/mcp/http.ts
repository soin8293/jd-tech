import type { Request, Response } from "firebase-functions/v2/https";

export const MCP_RESOURCE_PATH = "/mcp";
export const CONSENT_PATH = "/oauth/consent";

/**
 * Resolves the public origin the request arrived on, so the same code works
 * behind Firebase Hosting, on a custom domain, and on the raw function URL.
 */
export function originOf(req: Request): string {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
    req.headers.host ||
    "localhost";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function setCors(req: Request, res: Response): void {
  res.set("Access-Control-Allow-Origin", (req.headers.origin as string) || "*");
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.set(
    "Access-Control-Allow-Headers",
    "authorization, content-type, mcp-protocol-version, mcp-session-id, accept, last-event-id"
  );
  res.set("Access-Control-Expose-Headers", "mcp-session-id, www-authenticate");
  res.set("Access-Control-Max-Age", "3600");
}
