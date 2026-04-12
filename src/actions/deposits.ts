"use server";

import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-utils";
import { parseDepositFormData } from "@/lib/validation";
import {
  listDeposits as listDeps,
  getDepositById,
  createDepositForUser,
  updateDepositForUser,
  deleteDepositForUser,
  withdrawFromDepositForUser,
} from "@/lib/services/deposit-service";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/deposits");
  revalidatePath("/analysis");
}

export async function getDeposits() {
  const userId = await getUserId();
  return await listDeps(userId);
}

export async function getDeposit(id: number) {
  const userId = await getUserId();
  return await getDepositById(userId, id);
}

export async function createDeposit(formData: FormData): Promise<{ error: string } | void> {
  const userId = await getUserId();

  const parsed = parseDepositFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const result = await createDepositForUser(userId, parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAll();
}

export async function updateDeposit(id: number, formData: FormData): Promise<{ error: string } | void> {
  const userId = await getUserId();

  const parsed = parseDepositFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const result = await updateDepositForUser(userId, id, parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAll();
}

export async function withdrawFromDeposit(id: number, amount: number): Promise<{ error: string } | void> {
  const userId = await getUserId();

  const result = await withdrawFromDepositForUser(userId, id, amount);
  if (result && "error" in result) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deposits");
  revalidatePath("/transactions");
  revalidatePath("/analysis");
}

export async function deleteDeposit(id: number) {
  const userId = await getUserId();
  await deleteDepositForUser(userId, id);
  revalidateAll();
}
