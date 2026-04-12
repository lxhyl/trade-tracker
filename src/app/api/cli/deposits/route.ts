import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import {
  listDeposits,
  createDepositForUser,
  getDepositById,
} from "@/lib/services/deposit-service";

export const GET = withCliAuth(async (_request: NextRequest, userId: string) => {
  const deps = await listDeposits(userId);
  return Response.json(deps);
});

export const POST = withCliAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json();
    const result = await createDepositForUser(userId, body);
    if ("error" in result) {
      return cliError(result.error);
    }
    const dep = await getDepositById(userId, result.id);
    return Response.json(dep, { status: 201 });
  } catch {
    return cliError("Invalid request body", 400);
  }
});
