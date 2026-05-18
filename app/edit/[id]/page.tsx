import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import EditTransactionForm from "../../components/EditTransactionForm";

// 1. Types update ki hain: params ab strictly Promise hai
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 2. Next.js 16 rule: params ko use karne se pehle AWAIT karna lazmi hai
  const resolvedParams = await params;
  const targetId = resolvedParams.id;

  // 3. Ab Prisma ko undefined nahi, actual string ID milegi
  const transaction = await prisma.transaction.findUnique({
    where: { id: targetId },
    include: { account: true },
  });

  if (!transaction) {
    redirect("/");
  }

  // 4. Aik choti si fix aur: Prisma ka date object client component mein pass
  // karte waqt error de sakta hai, is liye hum strict mapping kar ke bhej rahe hain.
  const serializedTransaction = {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    account: {
      name: transaction.account.name,
    },
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 text-black">
      <EditTransactionForm transaction={serializedTransaction} />
    </main>
  );
}
