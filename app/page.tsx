import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import AddTransactionForm from "./components/AddTransactionForm";
import DeleteButton from "./components/DeleteButton";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // 1. Fetch current balances
  const accounts = await prisma.account.findMany();
  const cashAccount = Number(
    accounts.find((a) => a.name === "Cash")?.balance || 0,
  );
  const bankAccount = Number(
    accounts.find((a) => a.name === "Bank")?.balance || 0,
  );
  const totalBalance = cashAccount + bankAccount;

  // 2. Fetch recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 10,
    include: {
      account: {
        select: { name: true },
      },
    },
  });

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <span className="text-sm font-medium text-gray-600">
          {session.user?.email}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-black">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            Total Balance
          </h2>
          <p className="text-3xl font-black mt-2 text-gray-900">
            Rs {totalBalance}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-600">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            Cash in Hand
          </h2>
          <p className="text-2xl font-black mt-2 text-gray-900">
            Rs {cashAccount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            In Bank
          </h2>
          <p className="text-2xl font-black mt-2 text-gray-900">
            Rs {bankAccount}
          </p>
        </div>
      </div>

      {/* Form Component */}
      <AddTransactionForm />

      {/* Transactions Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-300 min-h-[150px]">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Recent Transactions
        </h2>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-600 text-sm font-medium">
            Abhi koi transaction nahi hui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-black">
              <thead className="text-xs text-gray-700 uppercase bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">
                    Action
                  </th>{" "}
                  {/* Naya column header */}
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600">
                      {new Date(tx.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {tx.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-800 border border-gray-300 text-xs px-2 py-1 rounded font-bold uppercase">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{tx.account.name}</td>
                    <td
                      className={`px-4 py-3 text-right font-black ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"} Rs {tx.amount}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-3 items-center">
                      <Link
                        href={`/edit/${tx.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={tx.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
