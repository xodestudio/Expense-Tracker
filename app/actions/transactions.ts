"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { transactionSchema, TransactionFormValues } from "@/lib/validation";

export async function createTransaction(values: TransactionFormValues) {
  try {
    const validated = transactionSchema.parse(values);

    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirstOrThrow({
        where: { name: validated.accountName },
      });

      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: validated.type,
          amount: validated.amount,
          category: validated.category,
          description: validated.description,
        },
      });

      const newBalance =
        validated.type === "INCOME"
          ? account.balance + validated.amount
          : account.balance - validated.amount;

      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
    });

    revalidatePath("/"); // Dashboard refresh karne ke liye
    return { success: true, message: "Transaction saved!" };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Transaction fail ho gayi.",
    };
  }
}
