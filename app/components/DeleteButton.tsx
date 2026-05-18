"use client";

import { useState } from "react";
import { deleteTransaction } from "../actions/transactions";

export default function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this transaction? Balance will be adjusted.",
      )
    )
      return;

    setLoading(true);
    const result = await deleteTransaction(id);
    if (!result.success) {
      alert(result.error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-800 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
