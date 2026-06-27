import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import AddTransactionForm from "./components/AddTransactionForm";
import DeleteButton from "./components/DeleteButton";
import Link from "next/link";
import { Prisma } from "@/prisma/generated/client";

type DashboardSearchParams = {
  vault?: string;
  q?: string;
  type?: string;
  account?: string;
  category?: string;
  from?: string;
  to?: string;
};

function toDateAtBoundary(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // 1. Vault State check karo URL se
  const resolvedParams = await searchParams;
  const isVaultUnlocked = resolvedParams.vault === "unlocked";
  const baseHref = isVaultUnlocked ? "/?vault=unlocked" : "/";
  const query = resolvedParams.q?.trim() || "";
  const selectedType =
    resolvedParams.type === "INCOME" || resolvedParams.type === "EXPENSE"
      ? resolvedParams.type
      : "ALL";
  const selectedAccount =
    resolvedParams.account && resolvedParams.account !== "ALL"
      ? resolvedParams.account
      : "ALL";
  const selectedCategory =
    resolvedParams.category && resolvedParams.category !== "ALL"
      ? resolvedParams.category
      : "ALL";
  const fromDate = toDateAtBoundary(resolvedParams.from, "start");
  const toDate = toDateAtBoundary(resolvedParams.to, "end");

  // 2. Fetch all balances
  const accounts = await prisma.account.findMany();
  const visibleAccounts = isVaultUnlocked
    ? accounts
    : accounts.filter((account) => !account.name.startsWith("Secret"));

  // Normal Accounts
  const cashAccount = Number(
    accounts.find((a) => a.name === "Cash")?.balance || 0,
  );
  const bankAccount = Number(
    accounts.find((a) => a.name === "Bank")?.balance || 0,
  );
  const totalBalance = cashAccount + bankAccount;

  // Secret Accounts
  const secretCashAccount = Number(
    accounts.find((a) => a.name === "Secret Cash")?.balance || 0,
  );
  const secretBankAccount = Number(
    accounts.find((a) => a.name === "Secret Bank")?.balance || 0,
  );
  const secretTotal = secretCashAccount + secretBankAccount;

  const categoryRows = await prisma.transaction.findMany({
    where: isVaultUnlocked
      ? undefined
      : {
          account: {
            NOT: {
              name: { startsWith: "Secret" },
            },
          },
        },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  const transactionFilters: Prisma.TransactionWhereInput[] = [];

  if (!isVaultUnlocked) {
    transactionFilters.push({
      account: {
        NOT: {
          name: { startsWith: "Secret" },
        },
      },
    });
  }

  if (selectedType !== "ALL") {
    transactionFilters.push({ type: selectedType });
  }

  if (selectedAccount !== "ALL") {
    transactionFilters.push({ account: { name: selectedAccount } });
  }

  if (selectedCategory !== "ALL") {
    transactionFilters.push({ category: selectedCategory });
  }

  if (query) {
    transactionFilters.push({
      OR: [
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (fromDate || toDate) {
    transactionFilters.push({
      date: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      },
    });
  }

  const whereFilters: Prisma.TransactionWhereInput =
    transactionFilters.length > 0 ? { AND: transactionFilters } : {};

  // 3. Fetch recent transactions (Filtered based on Vault state + dashboard filters)
  const recentTransactions = await prisma.transaction.findMany({
    where: whereFilters,
    orderBy: { date: "desc" },
    take: 20,
    include: {
      account: { select: { name: true } },
    },
  });

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      AND: [
        ...(!isVaultUnlocked
          ? [
              {
                account: {
                  NOT: {
                    name: { startsWith: "Secret" },
                  },
                },
              },
            ]
          : []),
        { date: { gte: currentMonthStart } },
      ],
    },
    select: { type: true, amount: true },
  });

  const monthIncome = monthlyTransactions
    .filter((item) => item.type === "INCOME")
    .reduce((total, item) => total + Number(item.amount), 0);
  const monthExpense = monthlyTransactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((total, item) => total + Number(item.amount), 0);
  const monthNet = monthIncome - monthExpense;
  const savingsRate =
    monthIncome > 0 ? Math.max(0, (monthNet / monthIncome) * 100) : 0;

  const filteredIncome = recentTransactions
    .filter((item) => item.type === "INCOME")
    .reduce((total, item) => total + Number(item.amount), 0);
  const filteredExpense = recentTransactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((total, item) => total + Number(item.amount), 0);

  const expenseByCategory = recentTransactions
    .filter((item) => item.type === "EXPENSE")
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

  const topCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const activeFiltersCount = [
    Boolean(query),
    selectedType !== "ALL",
    selectedAccount !== "ALL",
    selectedCategory !== "ALL",
    Boolean(fromDate),
    Boolean(toDate),
  ].filter(Boolean).length;

  return (
    <main className="max-w-6xl mx-auto p-2 sm:p-4 md:p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8 px-2 md:px-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            Dashboard
          </h1>
          {/* Secret Vault Toggle Button */}
          <Link
            href={isVaultUnlocked ? "/" : "/?vault=unlocked"}
            className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
              isVaultUnlocked
                ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                : "bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-300"
            }`}
          >
            {isVaultUnlocked ? "🔒 Close Vault" : "👁️"}
          </Link>
        </div>
        <span className="text-xs md:text-sm font-medium text-gray-600 truncate ml-4">
          {session.user?.email}
        </span>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 md:p-5 mb-6 mx-2 md:mx-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wide text-gray-800">
            Analytics & Filters
          </h2>
          <div className="text-xs font-bold px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700">
            Active Filters: {activeFiltersCount}
          </div>
        </div>

        <form method="get" className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isVaultUnlocked && <input type="hidden" name="vault" value="unlocked" />}

          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search category/description"
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          />

          <select
            name="type"
            defaultValue={selectedType}
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select
            name="account"
            defaultValue={selectedAccount}
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          >
            <option value="ALL">All Accounts</option>
            {visibleAccounts.map((account) => (
              <option key={account.id} value={account.name}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            name="category"
            defaultValue={selectedCategory}
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          >
            <option value="ALL">All Categories</option>
            {categoryRows.map((row) => (
              <option key={row.category} value={row.category}>
                {row.category}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="from"
            defaultValue={resolvedParams.from || ""}
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          />
          <input
            type="date"
            name="to"
            defaultValue={resolvedParams.to || ""}
            className="border border-gray-400 rounded p-2 text-sm bg-white"
          />

          <div className="md:col-span-3 flex flex-col md:flex-row gap-2">
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded font-bold text-sm hover:bg-gray-800"
            >
              Apply Filters
            </button>
            <Link
              href={baseHref}
              className="bg-gray-200 text-gray-800 border border-gray-300 px-4 py-2 rounded font-bold text-sm text-center hover:bg-gray-300"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 px-2 md:px-0">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8 px-2 md:px-0">
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <p className="text-xs uppercase font-bold text-gray-500">Month Income</p>
          <p className="text-xl font-black text-green-700 mt-1">Rs {monthIncome}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <p className="text-xs uppercase font-bold text-gray-500">Month Expense</p>
          <p className="text-xl font-black text-red-700 mt-1">Rs {monthExpense}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <p className="text-xs uppercase font-bold text-gray-500">Month Net</p>
          <p
            className={`text-xl font-black mt-1 ${monthNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}
          >
            Rs {monthNet}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <p className="text-xs uppercase font-bold text-gray-500">Savings Rate</p>
          <p className="text-xl font-black mt-1 text-indigo-700">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 px-2 md:px-0">
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
            Filtered Summary
          </h3>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="font-semibold text-gray-600">Income</span>
              <span className="font-black text-green-700">Rs {filteredIncome}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold text-gray-600">Expense</span>
              <span className="font-black text-red-700">Rs {filteredExpense}</span>
            </p>
            <p className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-semibold text-gray-700">Net</span>
              <span
                className={`font-black ${filteredIncome - filteredExpense >= 0 ? "text-emerald-700" : "text-rose-700"}`}
              >
                Rs {filteredIncome - filteredExpense}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
            Top Expense Categories
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-gray-500">No expense data in current filters.</p>
          ) : (
            <div className="space-y-2">
              {topCategories.map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">{name}</span>
                  <span className="font-black text-red-700">Rs {amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secret Vault Stats (Only visible when unlocked) */}
      {isVaultUnlocked && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 px-2 md:px-0 opacity-90">
          <div className="bg-red-50 p-5 md:p-6 rounded-lg shadow-inner border border-red-200">
            <h2 className="text-red-800 text-xs font-bold tracking-wider uppercase">
              Vault Total
            </h2>
            <p className="text-2xl md:text-3xl font-black mt-2 text-red-900">
              Rs {secretTotal}
            </p>
          </div>
          <div className="bg-red-50 p-5 md:p-6 rounded-lg shadow-inner border border-red-200">
            <h2 className="text-red-800 text-xs font-bold tracking-wider uppercase">
              Vault Cash
            </h2>
            <p className="text-xl md:text-2xl font-black mt-2 text-red-900">
              Rs {secretCashAccount}
            </p>
          </div>
          <div className="bg-red-50 p-5 md:p-6 rounded-lg shadow-inner border border-red-200">
            <h2 className="text-red-800 text-xs font-bold tracking-wider uppercase">
              Vault Bank
            </h2>
            <p className="text-xl md:text-2xl font-black mt-2 text-red-900">
              Rs {secretBankAccount}
            </p>
          </div>
        </div>
      )}

      {/* Form Component */}
      <div className="px-2 md:px-0">
        <AddTransactionForm />
      </div>

      {/* Transactions Table / Cards */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-300 min-h-[150px] mx-2 md:mx-0 mt-8">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-900">
          {isVaultUnlocked
            ? "All Transactions (Including Vault)"
            : "Recent Transactions"}
        </h2>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-600 text-sm font-medium">
            Abhi koi transaction nahi hui.
          </p>
        ) : (
          <div className="w-full">
            <table className="w-full text-sm text-left text-black block md:table">
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
              <tbody className="block md:table-row-group">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`block md:table-row border border-gray-200 md:border-b mb-4 md:mb-0 rounded-lg md:rounded-none transition-colors shadow-sm md:shadow-none ${
                      tx.account.name.startsWith("Secret")
                        ? "bg-red-50 hover:bg-red-100"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Date
                      </span>
                      <span className="whitespace-nowrap font-medium text-gray-600 text-right md:text-left">
                        {new Date(tx.date).toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Description
                      </span>
                      <span className="font-semibold text-right md:text-left truncate max-w-[150px] md:max-w-none">
                        {tx.description || "-"}
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Category
                      </span>
                      <span className="text-right md:text-left">
                        <span
                          className={`border text-xs px-2 py-1 rounded font-bold uppercase ${
                            tx.account.name.startsWith("Secret")
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                          }`}
                        >
                          {tx.category}
                        </span>
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Account
                      </span>
                      <span
                        className={`font-medium text-right md:text-left ${tx.account.name.startsWith("Secret") ? "text-red-700" : ""}`}
                      >
                        {tx.account.name}
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3 border-b border-gray-100 md:border-none">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Amount
                      </span>
                      <span
                        className={`text-right font-black ${tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"} Rs {tx.amount}
                      </span>
                    </td>
                    <td className="flex justify-between items-center md:table-cell px-4 py-3">
                      <span className="font-bold text-gray-500 md:hidden uppercase text-xs">
                        Action
                      </span>
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
