import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import {
  getTransactionById,
  updateTransactionForUser,
  deleteTransactionForUser,
} from "@/lib/services/transaction-service";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withCliAuth(async (request: NextRequest, userId: string) => {
  const { id } = await (request as unknown as { context: RouteContext }).context?.params
    ?? { id: request.nextUrl.pathname.split("/").pop()! };
  const tx = await getTransactionById(userId, parseInt(id));
  if (!tx) return cliError("Transaction not found", 404);
  return Response.json(tx);
});

export const PUT = withCliAuth(async (request: NextRequest, userId: string) => {
  const id = parseInt(request.nextUrl.pathname.split("/").pop()!);
  try {
    const body = await request.json();

    // For update, we need the full object. First get existing to merge.
    const existing = await getTransactionById(userId, id);
    if (!existing) return cliError("Transaction not found", 404);

    const merged = {
      symbol: body.symbol ?? existing.symbol,
      name: body.name ?? existing.name ?? "",
      assetType: body.assetType ?? existing.assetType,
      tradeType: body.tradeType ?? existing.tradeType,
      quantity: body.quantity ?? parseFloat(existing.quantity),
      price: body.price ?? parseFloat(existing.price),
      fee: body.fee ?? parseFloat(existing.fee || "0"),
      currency: body.currency ?? existing.currency,
      tradeDate: body.tradeDate ?? (existing.tradeDate instanceof Date
        ? existing.tradeDate.toISOString().split("T")[0]
        : String(existing.tradeDate).split("T")[0]),
      notes: body.notes ?? existing.notes ?? "",
    };

    const result = await updateTransactionForUser(userId, id, merged);
    if ("error" in result) return cliError(result.error);

    const updated = await getTransactionById(userId, id);
    return Response.json(updated);
  } catch {
    return cliError("Invalid request body", 400);
  }
});

export const DELETE = withCliAuth(async (request: NextRequest, userId: string) => {
  const id = parseInt(request.nextUrl.pathname.split("/").pop()!);
  const existing = await getTransactionById(userId, id);
  if (!existing) return cliError("Transaction not found", 404);

  await deleteTransactionForUser(userId, id);
  return Response.json({ success: true });
});
