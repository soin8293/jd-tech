import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthorizationDetails {
  client: { name: string; uri: string | null; redirect_uri: string };
  scope: string;
  scopes: string[];
}

const SCOPE_LABELS: Record<string, string> = {
  "mcp:read": "Read rooms, availability and your bookings",
  "mcp:write": "Manage bookings, availability and room details (admin accounts only)",
};

/**
 * OAuth consent screen for AI assistants connecting to the JD Suites MCP server.
 * Mounted at /oauth/consent; the authorization server redirects here with an
 * authorization_id, and we approve or deny it as the signed-in Firebase user.
 */
export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const { currentUser, isLoading, authInitialized, signInWithGoogle } = useAuth();

  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!authorizationId) {
      setError("This link is missing an authorization request id.");
      return;
    }
    (async () => {
      try {
        const response = await fetch(
          `/oauth/authorization?authorization_id=${encodeURIComponent(authorizationId)}`
        );
        const data = await response.json();
        if (!active) return;
        if (!response.ok) {
          setError(data?.error_description ?? "This authorization request is no longer valid.");
          return;
        }
        setDetails(data);
      } catch {
        if (active) setError("Could not reach the authorization server. Please try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = useCallback(
    async (approve: boolean) => {
      if (!currentUser) return;
      setBusy(true);
      setError(null);
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch("/oauth/decision", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ authorization_id: authorizationId, approve }),
        });
        const data = await response.json();
        if (!response.ok || !data?.redirect_url) {
          setError(data?.error_description ?? "The authorization server rejected this request.");
          setBusy(false);
          return;
        }
        window.location.href = data.redirect_url;
      } catch {
        setError("Something went wrong completing the authorization.");
        setBusy(false);
      }
    },
    [authorizationId, currentUser]
  );

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-16">
      <Card className="w-full max-w-md">{children}</Card>
    </main>
  );

  if (error && !details) {
    return shell(
      <>
        <CardHeader>
          <CardTitle>Authorization unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start the connection again from the app you were connecting.
          </p>
        </CardContent>
      </>
    );
  }

  if (!details || (isLoading && !authInitialized)) {
    return shell(
      <CardContent className="flex items-center gap-3 py-10">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Loading authorization request…</span>
      </CardContent>
    );
  }

  if (!currentUser) {
    return shell(
      <>
        <CardHeader>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            {details.client.name} wants to connect to your JD Suites account. Sign in to review
            the request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => signInWithGoogle()}>
            Sign in with Google
          </Button>
        </CardContent>
      </>
    );
  }

  return shell(
    <>
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wide">Authorize access</span>
        </div>
        <CardTitle>Connect {details.client.name} to JD Suites</CardTitle>
        <CardDescription>
          This lets {details.client.name} use JD Suites as you, signed in as{" "}
          <span className="font-medium text-foreground">{currentUser.email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">It will be able to</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {details.scopes.map((scope) => (
              <li key={scope}>• {SCOPE_LABELS[scope] ?? `Additional permission: ${scope}`}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground break-all">
          Redirects to {details.client.redirect_uri}
        </p>
        <p className="text-xs text-muted-foreground">
          This does not bypass JD Suites permissions — admin-only tools still require an admin
          account.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => decide(false)}
          >
            Cancel connection
          </Button>
        </div>
      </CardContent>
    </>
  );
}
