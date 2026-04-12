import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import {
  getDepositById,
  updateDepositForUser,
  deleteDepositForUser,
} from "@/lib/services/deposit-service";

export const GET = withCliAuth(async (request: NextRequest, userId: string) => {
  const id = parseInt(request.nextUrl.pathname.split("/").pop()!);
  const dep = await getDepositById(userId, id);
  if (!dep) return cliError("Deposit not found", 404);
  return Response.json(dep);
});

export const PUT = withCliAuth(async (request: NextRequest, userId: string) => {
  const id = parseInt(request.nextUrl.pathname.split("/").pop()!);
  try {
    const body = await request.json();

    const existing = await getDepositById(userId, id);
    if (!existing) return cliError("Deposit not found", 404);

    const merged = {
      symbol: body.symbol ?? existing.symbol,
      name: body.name ?? existing.name ?? "",
      principal: body.principal ?? parseFloat(existing.principal),
      interestRate: body.interestRate ?? parseFloat(existing.interestRate),
      currency: body.currency ?? existing.currency,
      startDate: body.startDate ?? (existing.startDate instanceof Date
        ? existing.startDate.toISOString().split("T")[0]
        : String(existing.startDate).split("T")[0]),
      maturityDate: body.maturityDate ?? (existing.maturityDate
        ? (existing.maturityDate instanceof Date
          ? existing.maturityDate.toISOString().split("T")[0]
          : String(existing.maturityDate).split("T")[0])
        : undefined),
      notes: body.notes ?? existing.notes ?? "",
    };

    const result = await updateDepositForUser(userId, id, merged);
    if ("error" in result) return cliError(result.error);

    const updated = await getDepositById(userId, id);
    return Response.json(updated);
  } catch {
    return cliError("Invalid request body", 400);
  }
});

export const DELETE = withCliAuth(async (request: NextRequest, userId: string) => {
  const id = parseInt(request.nextUrl.pathname.split("/").pop()!);
  const existing = await getDepositById(userId, id);
  if (!existing) return cliError("Deposit not found", 404);

  await deleteDepositForUser(userId, id);
  return Response.json({ success: true });
});
