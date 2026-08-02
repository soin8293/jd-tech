import { onRequest } from "firebase-functions/v2/https";
import { logger } from "../utils/logger";
import { MCP_RESOURCE_PATH, originOf, setCors } from "./http";
import { StoredToken, TOKENS, db, hashToken, isExpired } from "./oauthStore";
import { McpUser, TOOLS, ToolError, runTool } from "./tools";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "jd-tech", title: "JD Suites", version: "1.0.0" };
const INSTRUCTIONS =
  "Tools for the JD Suites hotel booking app. Browse rooms, check availability, " +
  "and read your own bookings. Admin accounts can additionally list all bookings, " +
  "cancel bookings, block dates and edit room details.";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

function rpcResult(id: any, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: any, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function authenticate(header?: string): Promise<McpUser | null> {
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  const snap = await db().collection(TOKENS).doc(hashToken(token)).get();
  if (!snap.exists) return null;
  const record = snap.data() as StoredToken;
  if (record.type !== "access" || record.revoked || isExpired(record.expiresAt)) return null;
  return {
    uid: record.uid,
    email: record.email,
    scopes: (record.scope || "").split(" ").filter(Boolean),
  };
}

async function handleRpc(message: JsonRpcRequest, user: McpUser) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, {
        tools: TOOLS.map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        })),
      });

    case "tools/call": {
      const toolName = params?.name;
      try {
        const output = await runTool(String(toolName), params?.arguments, user);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output as Record<string, unknown>,
        });
      } catch (error) {
        const message = error instanceof ToolError ?
          error.message :
          "The tool failed unexpectedly. Please try again.";
        if (!(error instanceof ToolError)) logger.error(`Tool ${toolName} failed`, error);
        return rpcResult(id, {
          content: [{ type: "text", text: message }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/**
 * MCP server for JD Suites, speaking Streamable HTTP JSON-RPC and protected by
 * the app's own OAuth 2.1 authorization server (see oauthServer.ts).
 */
export const mcp = onRequest(
  { region: "us-central1", cors: false },
  async (req, res) => {
    setCors(req, res);
    const origin = originOf(req);
    const path = req.path.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Protected resource metadata (RFC 9728) — how clients discover the auth server.
    if (path.includes("/.well-known/oauth-protected-resource")) {
      res.status(200).json({
        resource: `${origin}${MCP_RESOURCE_PATH}`,
        authorization_servers: [origin],
        scopes_supported: ["mcp:read", "mcp:write"],
        bearer_methods_supported: ["header"],
        resource_name: SERVER_INFO.title,
      });
      return;
    }

    const unauthorized = () => {
      res.set(
        "WWW-Authenticate",
        `Bearer realm="${SERVER_INFO.title}", ` +
          `resource_metadata="${origin}/.well-known/oauth-protected-resource"`
      );
      res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: a valid OAuth access token is required." },
      });
    };

    let user: McpUser | null;
    try {
      user = await authenticate(req.headers.authorization);
    } catch (error) {
      logger.error("MCP token verification failed", error);
      user = null;
    }
    if (!user) {
      unauthorized();
      return;
    }

    if (req.method === "GET" || req.method === "DELETE") {
      // No server-initiated streaming or session state in this server.
      res.status(405).set("Allow", "POST").json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: "Only POST is supported on this MCP endpoint." },
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).set("Allow", "POST").send("");
      return;
    }

    try {
      const body = req.body;
      const messages: JsonRpcRequest[] = Array.isArray(body) ? body : [body];
      if (!messages.length || !messages[0] || typeof messages[0].method !== "string") {
        res.status(400).json(rpcError(null, -32600, "Invalid JSON-RPC request"));
        return;
      }

      const responses = [];
      for (const message of messages) {
        // Notifications (no id) get no response body.
        if (message.id === undefined || message.id === null) {
          continue;
        }
        responses.push(await handleRpc(message, user));
      }

      if (!responses.length) {
        res.status(202).send("");
        return;
      }
      res.status(200).json(Array.isArray(body) ? responses : responses[0]);
    } catch (error) {
      logger.error("MCP request failed", error);
      res.status(500).json(rpcError(null, -32603, "Internal server error"));
    }
  }
);
