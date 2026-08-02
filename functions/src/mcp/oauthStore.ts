import * as crypto from "crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

/**
 * Firestore-backed storage for the hand-rolled OAuth 2.1 authorization server
 * that protects the MCP endpoint.
 *
 * Collections:
 *  - mcpOAuthClients   dynamically registered MCP clients
 *  - mcpOAuthRequests  in-flight authorization requests awaiting user consent
 *  - mcpOAuthCodes     issued authorization codes (single use)
 *  - mcpOAuthTokens    issued access / refresh tokens (stored hashed)
 */

export const CLIENTS = "mcpOAuthClients";
export const REQUESTS = "mcpOAuthRequests";
export const CODES = "mcpOAuthCodes";
export const TOKENS = "mcpOAuthTokens";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const AUTH_REQUEST_TTL_SECONDS = 60 * 10; // 10 minutes
export const CODE_TTL_SECONDS = 60 * 5; // 5 minutes

export interface OAuthClient {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  createdAt: Timestamp;
}

export interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  state?: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  resource?: string;
  status: "pending" | "approved" | "denied";
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface AuthorizationCode {
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  uid: string;
  email: string | null;
  isAdmin: boolean;
  used: boolean;
  expiresAt: Timestamp;
}

export interface StoredToken {
  type: "access" | "refresh";
  clientId: string;
  scope: string;
  uid: string;
  email: string | null;
  revoked: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export const db = () => getFirestore();

export function randomToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(32).toString("base64url")}`;
}

export function randomId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function secondsFromNow(seconds: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + seconds * 1000);
}

export function isExpired(ts?: Timestamp | null): boolean {
  if (!ts) return true;
  return ts.toMillis() <= Date.now();
}

/** Issues an access + refresh token pair for a resolved user. */
export async function issueTokens(params: {
  clientId: string;
  scope: string;
  uid: string;
  email: string | null;
}): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const accessToken = randomToken("mcp_at");
  const refreshToken = randomToken("mcp_rt");
  const now = Timestamp.now();

  const batch = db().batch();
  batch.set(db().collection(TOKENS).doc(hashToken(accessToken)), {
    type: "access",
    clientId: params.clientId,
    scope: params.scope,
    uid: params.uid,
    email: params.email,
    revoked: false,
    createdAt: now,
    expiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
  } satisfies StoredToken);
  batch.set(db().collection(TOKENS).doc(hashToken(refreshToken)), {
    type: "refresh",
    clientId: params.clientId,
    scope: params.scope,
    uid: params.uid,
    email: params.email,
    revoked: false,
    createdAt: now,
    expiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
  } satisfies StoredToken);
  await batch.commit();

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
  };
}
