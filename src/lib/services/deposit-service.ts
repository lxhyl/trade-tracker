import { db } from "@/lib/db";
import { deposits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { depositSchema } from "@/lib/validation";

export interface DepositInput {
  symbol: string;
  name?: string;
  principal: number;
  interestRate: number;
  currency: string;
  startDate: string;
  maturityDate?: string;
  notes?: string;
}

export async function listDeposits(userId: string) {
  return await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, userId));
}

export async function getDepositById(userId: string, id: number) {
  const result = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)));
  return result[0] || null;
}

export async function createDepositForUser(
  userId: string,
  input: DepositInput
): Promise<{ error: string } | { id: number }> {
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const result = await db
    .insert(deposits)
    .values({
      userId,
      symbol: v.symbol.trim().toUpperCase(),
      name: v.name || null,
      principal: v.principal.toFixed(2),
      interestRate: v.interestRate.toFixed(4),
      currency: v.currency,
      startDate: new Date(v.startDate),
      maturityDate: v.maturityDate ? new Date(v.maturityDate) : null,
      notes: v.notes || null,
    })
    .returning({ id: deposits.id });

  return { id: result[0].id };
}

export async function updateDepositForUser(
  userId: string,
  id: number,
  input: DepositInput
): Promise<{ error: string } | { id: number }> {
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  await db
    .update(deposits)
    .set({
      symbol: v.symbol.trim().toUpperCase(),
      name: v.name || null,
      principal: v.principal.toFixed(2),
      interestRate: v.interestRate.toFixed(4),
      currency: v.currency,
      startDate: new Date(v.startDate),
      maturityDate: v.maturityDate ? new Date(v.maturityDate) : null,
      notes: v.notes || null,
    })
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)));

  return { id };
}

export async function deleteDepositForUser(userId: string, id: number) {
  await db
    .delete(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)));
}

export async function withdrawFromDepositForUser(
  userId: string,
  id: number,
  amount: number
): Promise<{ error: string } | void> {
  if (amount <= 0) {
    return { error: "Withdraw amount must be greater than 0" };
  }

  const deposit = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)));

  if (deposit.length === 0) {
    return { error: "Deposit not found" };
  }

  const d = deposit[0];
  const principal = parseFloat(d.principal);
  const withdrawn = parseFloat(d.withdrawnAmount || "0");
  const remaining = principal - withdrawn;

  if (amount > remaining + 0.001) {
    return {
      error: `Cannot withdraw more than remaining principal (${remaining.toFixed(2)})`,
    };
  }

  const newWithdrawn = (withdrawn + amount).toFixed(2);

  await db
    .update(deposits)
    .set({ withdrawnAmount: newWithdrawn })
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)));
}
