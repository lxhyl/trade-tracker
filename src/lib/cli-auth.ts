import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const CLI_TOKEN_EXPIRY = "90d";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/** Generate a long-lived CLI token for the given user. */
export async function generateCliToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CLI_TOKEN_EXPIRY)
    .sign(getSecret());
}

/** Verify a CLI token and return the userId, or null if invalid. */
export async function verifyCliToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

/** Extract and verify Bearer token from request. Returns userId or throws. */
export async function getCliUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const userId = await verifyCliToken(token);
  if (!userId) {
    throw new Error("Invalid or expired CLI token");
  }

  return userId;
}

/** Helper to create a JSON error response. */
export function cliError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/** Wrap a CLI route handler with auth. */
export function withCliAuth(
  handler: (request: NextRequest, userId: string) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      const userId = await getCliUserId(request);
      return await handler(request, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      if (message.includes("Missing") || message.includes("Invalid") || message.includes("expired")) {
        return cliError(message, 401);
      }
      return cliError("Internal server error", 500);
    }
  };
}
