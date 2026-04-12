import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import { getAllSettings, updateSettings } from "@/lib/services/settings-service";

export const GET = withCliAuth(async (_request: NextRequest, userId: string) => {
  const settings = await getAllSettings(userId);
  return Response.json(settings);
});

export const PUT = withCliAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json();
    const settings = await updateSettings(userId, body);
    return Response.json(settings);
  } catch {
    return cliError("Invalid request body", 400);
  }
});
