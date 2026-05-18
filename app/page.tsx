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
    <main className="max-w-6xl mx-auto p-2 sm:p-4 md:p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8 px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">Dashboard</h1>
        <span className="text-xs md:text-sm font-medium text-gray-600 truncate ml-4">
          {session.user?.email}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 px-2 md:px-0">
        <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border-t-4 border-black">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            Total Balance
          </h2>
          <p className="text-2xl md:text-3xl font-black mt-2 text-gray-900">
            Rs {totalBalance}
          </p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border-t-4 border-green-600">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            Cash in Hand
          </h2>
          <p className="text-xl md:text-2xl font-black mt-2 text-gray-900">
            Rs {cashAccount}
          </p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-lg shadow-md border-t-4 border-blue-600">
          <h2 className="text-gray-600 text-xs font-bold tracking-wider uppercase">
            In Bank
          </h2>
          <p className="text-xl md:text-2xl font-black mt-2 text-gray-900">
            Rs {bankAccount}
          </p>
        </div>
      </div>

      {/* Form Component */}
      <div className="px-2 md:px-0">
        <AddTransactionForm />
      </div>

      {/* Transactions Table / Cards */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-300 min-h-[150px] mx-2 md:mx-0 mt-8">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-900">
          Recent Transactions
        </h2>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-600 text-sm font-medium">
            Abhi koi transaction nahi hui.
          </p>
        ) : (
          <div className="w-full">
            <table className="w-full text-sm text-left text-black block md:table">
              {/* Thead ko mobile par hide kar diya md:table-header-group use kar ke */}
              <thead className="hidden md:table-header-group text-xs text-gray-700 uppercase bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              
              {/* Tbody row block */}
              <tbody className="block md:table-row-group">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="block md:table-row border border-gray-200 md:border-b mb-4 md:mb-0 rounded-lg md:rounded-none bg-white hover:bg-gray-50 transition-colors shadow-sm md:shadow-none"
                  >
                    {/* Date Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Date</span>
                      <span className="whitespace-nowrap font-medium text-gray-600 text-right md:text-left">
                        {new Date(tx.date).toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    
                    {/* Description Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Description</span>
                      <span className="font-semibold text-right md:text-left truncate max-w-[150px] md:max-w-none">
                        {tx.description || "-"}
                      </span>
                    </td>
                    
                    {/* Category Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Category</span>
                      <span className="text-right md:text-left">
                        <span className="bg-gray-100 text-gray-800 border border-gray-300 text-xs px-2 py-1 rounded font-bold uppercase">
                          {tx.category}
                        </span>
                      </span>
                    </td>
                    
                    {/* Account Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Account</span>
                      <span className="font-medium text-right md:text-left">{tx.account.name}</span>
                    </td>
                    
                    {/* Amount Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Amount</span>
                      <span
                        className={`text-right font-black ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"} Rs {tx.amount}
                      </span>
                    </td>
                    
                    {/* Action Cell */}
                    <td className="flex justify-between items-center md:table-cell px-4 py-3">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">Action</span>
                      <div className="flex justify-end gap-4 items-center">
                        <Link
                          href={`/edit/${tx.id}`}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={tx.id} />
                      </div>
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