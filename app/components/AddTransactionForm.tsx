"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { transactionSchema, TransactionFormValues } from "../../lib/validation";
import { createTransaction } from "../actions/transactions";

export default function AddTransactionForm() {
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      category: "",
      accountName: "Cash",
      description: "",
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    setStatus(null);
    const result = await createTransaction(values);
    if (result.success) {
      setStatus({ type: "success", message: result.message! });
      form.reset();
    } else {
      setStatus({ type: "error", message: result.error! });
    }
  };

  return (
    // Har cheez ko explicitly bg-white aur text-black kar diya hai
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-300 mb-8 text-black">
      <h2 className="text-xl font-bold mb-4 text-gray-900">New Transaction</h2>

      {status && (
        <p
          className={`p-2 rounded mb-4 text-sm font-medium ${status.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
        >
          {status.message}
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Type
            </label>
            <select
              {...form.register("type")}
              className="w-full border p-2 rounded bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
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
              className="w-full border p-2 rounded bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="Cash">Cash in Hand</option>
              <option value="Bank">Bank Account</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-800">
              Amount (Rs)
            </label>
            <input
              type="number"
              step="any"
              {...form.register("amount", { valueAsNumber: true })}
              className="w-full border p-2 rounded bg-white text-black border-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="1500"
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
              className="w-full border p-2 rounded bg-white text-black border-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Food, Salary, Bills..."
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
            Description (Optional)
          </label>
          <input
            type="text"
            {...form.register("description")}
            className="w-full border p-2 rounded bg-white text-black border-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Details..."
          />
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-black text-white p-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {form.formState.isSubmitting ? "Saving..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
}
