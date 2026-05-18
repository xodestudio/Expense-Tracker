"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { transactionSchema, TransactionFormValues } from "../../lib/validation";
import { updateTransaction } from "../actions/transactions";

export default function EditTransactionForm({
  transaction,
}: {
  transaction: any;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      accountName: transaction.account.name as "Cash" | "Bank",
      description: transaction.description || "",
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    setStatus(null);
    const result = await updateTransaction(transaction.id, values);
    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setStatus({ type: "error", message: result.error! });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-300 text-black max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Transaction</h2>

      {status && (
        <p
          className={`p-2 rounded mb-4 text-sm font-medium ${status.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
        >
          {status.message}
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Type
            </label>
            <select
              {...form.register("type")}
              className="w-full border p-2 rounded bg-white text-black border-gray-400"
            >
              <option value="INCOME">Income (+)</option>
              <option value="EXPENSE">Expense (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Account
            </label>
            <select
              {...form.register("accountName")}
              className="w-full border p-2 rounded bg-white text-black border-gray-400"
            >
              <option value="Cash">Cash in Hand</option>
              <option value="Bank">Bank Account</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Amount (Rs)
            </label>
            <input
              type="number"
              step="any"
              {...form.register("amount", { valueAsNumber: true })}
              className="w-full border p-2 rounded bg-white text-black border-gray-400"
            />
            {form.formState.errors.amount && (
              <p className="text-red-600 text-xs mt-1 font-semibold">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Category
            </label>
            <input
              type="text"
              {...form.register("category")}
              className="w-full border p-2 rounded bg-white text-black border-gray-400"
            />
            {form.formState.errors.category && (
              <p className="text-red-600 text-xs mt-1 font-semibold">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-800">
            Description
          </label>
          <input
            type="text"
            {...form.register("description")}
            className="w-full border p-2 rounded bg-white text-black border-gray-400"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-black text-white p-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {form.formState.isSubmitting ? "Saving..." : "Update Transaction"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full bg-gray-200 text-black p-2 rounded font-bold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
