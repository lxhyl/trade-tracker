import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import {
  listTransactions,
  createTransactionForUser,
  getTransactionById,
} from "@/lib/services/transaction-service";

export const GET = withCliAuth(async (_request: NextRequest, userId: string) => {
  const txs = await listTransactions(userId);
  return Response.json(txs);
});

export const POST = withCliAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json();
    const result = await createTransactionForUser(userId, body);
    if ("error" in result) {
      return cliError(result.error);
    }
    const tx = await getTransactionById(userId, result.id);
    return Response.json(tx, { status: 201 });
  } catch {
    return cliError("Invalid request body", 400);
  }
});
