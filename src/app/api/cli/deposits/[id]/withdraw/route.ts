import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import {
  getDepositById,
  withdrawFromDepositForUser,
} from "@/lib/services/deposit-service";

export const POST = withCliAuth(async (request: NextRequest, userId: string) => {
  const segments = request.nextUrl.pathname.split("/");
  const id = parseInt(segments[segments.length - 2]); // /api/cli/deposits/[id]/withdraw

  try {
    const body = await request.json();
    const amount = body.amount;

    if (typeof amount !== "number" || amount <= 0) {
      return cliError("Amount must be a positive number");
    }

    const result = await withdrawFromDepositForUser(userId, id, amount);
    if (result && "error" in result) {
      return cliError(result.error);
    }

    const dep = await getDepositById(userId, id);
    return Response.json(dep);
  } catch {
    return cliError("Invalid request body", 400);
  }
});
