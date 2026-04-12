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
      // Store callback_port before redirecting to OAuth
      if (callbackPort) {
        sessionStorage.setItem("cli_callback_port", callbackPort);
      }
      signIn(undefined, { callbackUrl: "/cli/login" });
      return;
    }

    // Authenticated — generate token and redirect to CLI
    if (status === "authenticated" && !redirected.current) {
      redirected.current = true;

      const port = callbackPort || sessionStorage.getItem("cli_callback_port");
      if (!port) {
        setError("Missing callback port. Please run the CLI login command again.");
        return;
      }

      // Validate port is a number
      const portNum = parseInt(port, 10);
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
          sessionStorage.removeItem("cli_callback_port");
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
