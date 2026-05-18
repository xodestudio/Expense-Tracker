// app/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Galat email ya password. Try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    // Explicit background aur text color de diya hai taake global dark mode masla na kare
    <div className="flex h-screen items-center justify-center bg-gray-100 text-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Expense Tracker
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
            placeholder="admin@example.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white font-semibold p-2 rounded hover:bg-gray-800 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}
