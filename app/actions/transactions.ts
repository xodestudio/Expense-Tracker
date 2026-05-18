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

export async function deleteTransaction(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Transaction aur Account fetch karo
      const transaction = await tx.transaction.findUniqueOrThrow({
        where: { id },
      });
      const account = await tx.account.findUniqueOrThrow({
        where: { id: transaction.accountId },
      });

      // 2. Reversal Math Logic
      let newBalance = account.balance;

      if (transaction.type === "EXPENSE") {
        // Expense delete ho raha hai, yani account mein paise wapis aayenge
        newBalance += transaction.amount;
      } else if (transaction.type === "INCOME") {
        // Income delete ho rahi hai, yani account se paise wapis niklenge
        newBalance -= transaction.amount;
      }

      // 3. Updated balance save karo
      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });

      // 4. Record permanently delete karo
      await tx.transaction.delete({
        where: { id },
      });
    });

    // 5. Cache clear karo taake dashboard refresh ho
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: "Delete fail ho gaya" };
  }
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
) {
  try {
    const validated = transactionSchema.parse(values);

    await prisma.$transaction(async (tx) => {
      // 1. Purani transaction aur uska account dhoondo
      const oldTx = await tx.transaction.findUniqueOrThrow({ where: { id } });
      const oldAccount = await tx.account.findUniqueOrThrow({
        where: { id: oldTx.accountId },
      });

      // 2. Naya account dhoondo (agar user ne dropdown se change kiya ho)
      const newAccount = await tx.account.findFirstOrThrow({
        where: { name: validated.accountName },
      });

      // 3. STEP A: Purani transaction ka effect khatam karo (Reversal)
      let adjustedOldBalance = oldAccount.balance;
      if (oldTx.type === "EXPENSE") adjustedOldBalance += oldTx.amount;
      else if (oldTx.type === "INCOME") adjustedOldBalance -= oldTx.amount;

      // 4. STEP B: Nayi values apply karo
      if (oldAccount.id === newAccount.id) {
        // Agar account wahi hai (e.g. Cash pehle tha, Cash ab bhi hai)
        if (validated.type === "EXPENSE")
          adjustedOldBalance -= validated.amount;
        else if (validated.type === "INCOME")
          adjustedOldBalance += validated.amount;

        await tx.account.update({
          where: { id: oldAccount.id },
          data: { balance: adjustedOldBalance },
        });
      } else {
        // Agar account change ho gaya (e.g. Cash se Bank ho gaya)
        // Pehle purane account ko reversed balance ke sath save karo
        await tx.account.update({
          where: { id: oldAccount.id },
          data: { balance: adjustedOldBalance },
        });

        // Ab naye account ka balance uthao aur us par nayi math apply karo
        let adjustedNewBalance = newAccount.balance;
        if (validated.type === "EXPENSE")
          adjustedNewBalance -= validated.amount;
        else if (validated.type === "INCOME")
          adjustedNewBalance += validated.amount;

        await tx.account.update({
          where: { id: newAccount.id },
          data: { balance: adjustedNewBalance },
        });
      }

      // 5. Transaction ka record update karo
      await tx.transaction.update({
        where: { id },
        data: {
          accountId: newAccount.id,
          type: validated.type,
          amount: validated.amount,
          category: validated.category,
          description: validated.description,
        },
      });
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: "Update fail ho gaya" };
  }
}
