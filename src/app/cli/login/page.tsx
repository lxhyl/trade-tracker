"use client";

import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Suspense } from "react";

function LoginFlow() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackPort = searchParams.get("callback_port");
  const redirected = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Redirect directly to Google OAuth, passing callback_port through the callbackUrl
      // so it survives the OAuth redirect without relying on sessionStorage
      const callbackUrl = callbackPort
        ? `/cli/login?callback_port=${callbackPort}`
        : "/cli/login";
      signIn("google", { callbackUrl });
      return;
    }

    // Authenticated — generate token and redirect to CLI
    if (status === "authenticated" && !redirected.current) {
      redirected.current = true;

      if (!callbackPort) {
        setError("Missing callback port. Please run the CLI login command again.");
        return;
      }

      // Validate port is a number
      const portNum = parseInt(callbackPort, 10);
      if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
        setError("Invalid callback port.");
        return;
      }

      // Generate CLI token
      fetch("/api/cli/token", { method: "POST" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to generate token");
          return res.json();
        })
        .then((data) => {
          // Redirect to CLI's local callback server
          window.location.href = `http://127.0.0.1:${portNum}/callback?token=${encodeURIComponent(data.token)}`;
          setDone(true);
        })
        .catch((err) => {
          setError(err.message || "Failed to generate CLI token");
        });
    }
  }, [status, callbackPort, session]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#f8fafc",
      color: "#0f172a",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 400,
        padding: "2rem",
      }}>
        {error ? (
          <>
            <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Login Failed</h1>
            <p style={{ color: "#64748b" }}>{error}</p>
          </>
        ) : done ? (
          <>
            <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Redirecting to CLI...</h1>
            <p style={{ color: "#64748b" }}>You can close this tab once the CLI confirms login.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Signing in...</h1>
            <p style={{ color: "#64748b" }}>Please wait while we authenticate you.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function CliLoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        Loading...
      </div>
    }>
      <LoginFlow />
    </Suspense>
  );
}
