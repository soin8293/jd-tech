import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import {
  AUTH_REQUEST_TTL_SECONDS,
  AuthorizationCode,
  AuthorizationRequest,
  CODES,
  CODE_TTL_SECONDS,
  CLIENTS,
  OAuthClient,
  REQUESTS,
  StoredToken,
  TOKENS,
  db,
  hashToken,
  isExpired,
  issueTokens,
  randomId,
  randomToken,
  secondsFromNow,
  verifyPkce,
} from "./oauthStore";
import { CONSENT_PATH, MCP_RESOURCE_PATH, originOf, setCors } from "./http";

const SUPPORTED_SCOPES = ["mcp:read", "mcp:write"];
const DEFAULT_SCOPE = "mcp:read mcp:write";

function json(res: any, status: number, body: unknown) {
  res.status(status).set("Content-Type", "application/json").send(JSON.stringify(body));
}

function oauthError(res: any, status: number, error: string, description: string) {
  json(res, status, { error, error_description: description });
}

function normalizeScope(requested?: string): string {
  if (!requested) return DEFAULT_SCOPE;
  const granted = requested
    .split(/\s+/)
    .filter((s) => SUPPORTED_SCOPES.includes(s));
  return granted.length ? granted.join(" ") : DEFAULT_SCOPE;
}

async function resolveUser(idToken: string) {
  const decoded = await admin.auth().verifyIdToken(idToken, true);
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    isAdmin: decoded.admin === true,
  };
}

/**
 * OAuth 2.1 authorization server for the MCP endpoint.
 * Handles discovery, dynamic client registration, the authorization code flow
 * with PKCE, the consent hand-off to the app UI, and token issuance.
 */
export const mcpOAuth = onRequest(
  { region: "us-central1", cors: false },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const origin = originOf(req);
    const path = req.path.replace(/\/+$/, "") || "/";

    try {
      // ---------------------------------------------------------------
      // Discovery
      // ---------------------------------------------------------------
      if (path.endsWith("/.well-known/oauth-authorization-server") ||
          path.endsWith("/.well-known/openid-configuration")) {
        json(res, 200, {
          issuer: origin,
          authorization_endpoint: `${origin}/oauth/authorize`,
          token_endpoint: `${origin}/oauth/token`,
          registration_endpoint: `${origin}/oauth/register`,
          revocation_endpoint: `${origin}/oauth/revoke`,
          scopes_supported: SUPPORTED_SCOPES,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none"],
});
        return;
      }

      // ---------------------------------------------------------------
      // Dynamic client registration (RFC 7591)
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/register")) {
        if (req.method !== "POST") {
          oauthError(res, 405, "invalid_request", "POST required");
          return;
        }
        const body = req.body ?? {};
        const redirectUris: string[] = Array.isArray(body.redirect_uris) ?
          body.redirect_uris.filter((u: unknown) => typeof u === "string") :
          [];
        if (!redirectUris.length) {
          oauthError(res, 400, "invalid_redirect_uri", "redirect_uris is required");
          return;
        }
        const invalid = redirectUris.find((u) => {
          try {
            const parsed = new URL(u);
            return parsed.protocol !== "https:" &&
              parsed.hostname !== "localhost" &&
              parsed.hostname !== "127.0.0.1" &&
              !parsed.protocol.match(/^[a-z][a-z0-9+.-]*:$/);
          } catch {
            return true;
          }
        });
        if (invalid) {
          oauthError(res, 400, "invalid_redirect_uri", `Unsupported redirect_uri: ${invalid}`);
          return;
        }

        const clientId = randomId();
        const client: OAuthClient = {
          client_id: clientId,
          client_name: typeof body.client_name === "string" ? body.client_name : "MCP client",
          redirect_uris: redirectUris,
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
          client_uri: typeof body.client_uri === "string" ? body.client_uri : undefined,
          logo_uri: typeof body.logo_uri === "string" ? body.logo_uri : undefined,
          scope: normalizeScope(body.scope),
          createdAt: Timestamp.now(),
        };
        await db().collection(CLIENTS).doc(clientId).set(client);
        json(res, 201, {
          client_id: clientId,
          client_id_issued_at: Math.floor(Date.now() / 1000),
          client_name: client.client_name,
          redirect_uris: client.redirect_uris,
          grant_types: client.grant_types,
          response_types: client.response_types,
          token_endpoint_auth_method: "none",
          scope: client.scope,
        });
        return;
      }

      // ---------------------------------------------------------------
      // Authorization endpoint -> redirect the browser to the consent UI
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/authorize")) {
        const q = req.query as Record<string, string>;
        const clientDoc = await db().collection(CLIENTS).doc(String(q.client_id ?? "")).get();
        if (!clientDoc.exists) {
          oauthError(res, 400, "invalid_client", "Unknown client_id");
          return;
        }
        const client = clientDoc.data() as OAuthClient;
        const redirectUri = String(q.redirect_uri ?? "");
        if (!client.redirect_uris.includes(redirectUri)) {
          oauthError(res, 400, "invalid_redirect_uri", "redirect_uri is not registered for this client");
          return;
        }
        const fail = (error: string, description: string) => {
          const url = new URL(redirectUri);
          url.searchParams.set("error", error);
          url.searchParams.set("error_description", description);
          if (q.state) url.searchParams.set("state", q.state);
          res.redirect(302, url.toString());
        };
        if (q.response_type !== "code") {
          fail("unsupported_response_type", "Only response_type=code is supported");
          return;
        }
        if (!q.code_challenge || q.code_challenge_method !== "S256") {
          fail("invalid_request", "PKCE with code_challenge_method=S256 is required");
          return;
        }

        const requestId = randomId();
        const authRequest: AuthorizationRequest = {
          clientId: client.client_id,
          redirectUri,
          state: q.state,
          scope: normalizeScope(q.scope),
          codeChallenge: String(q.code_challenge),
          codeChallengeMethod: "S256",
          resource: q.resource ? String(q.resource) : undefined,
          status: "pending",
          createdAt: Timestamp.now(),
          expiresAt: secondsFromNow(AUTH_REQUEST_TTL_SECONDS),
        };
        await db().collection(REQUESTS).doc(requestId).set(authRequest);

        const consentUrl = new URL(`${origin}${CONSENT_PATH}`);
        consentUrl.searchParams.set("authorization_id", requestId);
        res.redirect(302, consentUrl.toString());
        return;
      }

      // ---------------------------------------------------------------
      // Consent details (called by the app consent page)
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/authorization")) {
        const requestId = String((req.query as any).authorization_id ?? "");
        const snap = await db().collection(REQUESTS).doc(requestId).get();
        if (!snap.exists) {
          oauthError(res, 404, "invalid_request", "Unknown authorization request");
          return;
        }
        const authRequest = snap.data() as AuthorizationRequest;
        if (authRequest.status !== "pending" || isExpired(authRequest.expiresAt)) {
          oauthError(res, 410, "expired_request", "This authorization request has expired");
          return;
        }
        const clientDoc = await db().collection(CLIENTS).doc(authRequest.clientId).get();
        const client = clientDoc.data() as OAuthClient | undefined;
        json(res, 200, {
          client: {
            name: client?.client_name ?? "Unknown client",
            uri: client?.client_uri ?? null,
            redirect_uri: authRequest.redirectUri,
          },
          scope: authRequest.scope,
          scopes: authRequest.scope.split(" "),
        });
        return;
      }

      // ---------------------------------------------------------------
      // Consent decision (called by the app consent page, Firebase ID token)
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/decision")) {
        if (req.method !== "POST") {
          oauthError(res, 405, "invalid_request", "POST required");
          return;
        }
        const authHeader = String(req.headers.authorization ?? "");
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          oauthError(res, 401, "unauthorized", "Firebase ID token required");
          return;
        }
        let user;
        try {
          user = await resolveUser(authHeader.slice(7).trim());
        } catch {
          oauthError(res, 401, "unauthorized", "Invalid or expired session");
          return;
        }

        const { authorization_id: requestId, approve } = req.body ?? {};
        const ref = db().collection(REQUESTS).doc(String(requestId ?? ""));
        const snap = await ref.get();
        if (!snap.exists) {
          oauthError(res, 404, "invalid_request", "Unknown authorization request");
          return;
        }
        const authRequest = snap.data() as AuthorizationRequest;
        if (authRequest.status !== "pending" || isExpired(authRequest.expiresAt)) {
          oauthError(res, 410, "expired_request", "This authorization request has expired");
          return;
        }

        const redirect = new URL(authRequest.redirectUri);
        if (authRequest.state) redirect.searchParams.set("state", authRequest.state);

        if (!approve) {
          await ref.update({ status: "denied" });
          redirect.searchParams.set("error", "access_denied");
          json(res, 200, { redirect_url: redirect.toString() });
          return;
        }

        const code = randomToken("mcp_code");
        const codeRecord: AuthorizationCode = {
          clientId: authRequest.clientId,
          redirectUri: authRequest.redirectUri,
          scope: authRequest.scope,
          codeChallenge: authRequest.codeChallenge,
          uid: user.uid,
          email: user.email,
          isAdmin: user.isAdmin,
          used: false,
          expiresAt: secondsFromNow(CODE_TTL_SECONDS),
        };
        await db().collection(CODES).doc(hashToken(code)).set(codeRecord);
        await ref.update({ status: "approved" });

        redirect.searchParams.set("code", code);
        json(res, 200, { redirect_url: redirect.toString() });
        return;
      }

      // ---------------------------------------------------------------
      // Token endpoint
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/token")) {
        if (req.method !== "POST") {
          oauthError(res, 405, "invalid_request", "POST required");
          return;
        }
        const body = (req.body ?? {}) as Record<string, string>;
        const grantType = body.grant_type;

        if (grantType === "authorization_code") {
          const codeRef = db().collection(CODES).doc(hashToken(String(body.code ?? "")));
          const codeSnap = await codeRef.get();
          if (!codeSnap.exists) {
            oauthError(res, 400, "invalid_grant", "Invalid authorization code");
            return;
          }
          const record = codeSnap.data() as AuthorizationCode;
          if (record.used || isExpired(record.expiresAt)) {
            await codeRef.delete();
            oauthError(res, 400, "invalid_grant", "Authorization code expired or already used");
            return;
          }
          if (record.clientId !== body.client_id) {
            oauthError(res, 400, "invalid_grant", "client_id mismatch");
            return;
          }
          if (record.redirectUri !== body.redirect_uri) {
            oauthError(res, 400, "invalid_grant", "redirect_uri mismatch");
            return;
          }
          if (!body.code_verifier || !verifyPkce(body.code_verifier, record.codeChallenge)) {
            oauthError(res, 400, "invalid_grant", "PKCE verification failed");
            return;
          }
          await codeRef.delete();

          const tokens = await issueTokens({
            clientId: record.clientId,
            scope: record.scope,
            uid: record.uid,
            email: record.email,
          });
          json(res, 200, {
            token_type: "Bearer",
            scope: record.scope,
            ...tokens,
          });
          return;
        }

        if (grantType === "refresh_token") {
          const refreshRef = db().collection(TOKENS).doc(hashToken(String(body.refresh_token ?? "")));
          const refreshSnap = await refreshRef.get();
          if (!refreshSnap.exists) {
            oauthError(res, 400, "invalid_grant", "Invalid refresh token");
            return;
          }
          const record = refreshSnap.data() as StoredToken;
          if (record.type !== "refresh" || record.revoked || isExpired(record.expiresAt)) {
            oauthError(res, 400, "invalid_grant", "Refresh token expired or revoked");
            return;
          }
          if (record.clientId !== body.client_id) {
            oauthError(res, 400, "invalid_grant", "client_id mismatch");
            return;
          }
          await refreshRef.update({ revoked: true });

          const tokens = await issueTokens({
            clientId: record.clientId,
            scope: record.scope,
            uid: record.uid,
            email: record.email,
          });
          json(res, 200, {
            token_type: "Bearer",
            scope: record.scope,
            ...tokens,
          });
          return;
        }

        oauthError(res, 400, "unsupported_grant_type", `Unsupported grant_type: ${grantType}`);
        return;
      }

      // ---------------------------------------------------------------
      // Revocation (RFC 7009)
      // ---------------------------------------------------------------
      if (path.endsWith("/oauth/revoke")) {
        const token = String((req.body ?? {}).token ?? "");
        if (token) {
          await db().collection(TOKENS).doc(hashToken(token))
            .set({ revoked: true }, { merge: true });
        }
        json(res, 200, {});
        return;
      }

      json(res, 404, {
        error: "not_found",
        error_description: `No OAuth endpoint at ${path}`,
        resource: `${origin}${MCP_RESOURCE_PATH}`,
      });
    } catch (error) {
      logger.error("mcpOAuth failed", error);
      oauthError(res, 500, "server_error", "Unexpected authorization server error");
    }
  }
);
