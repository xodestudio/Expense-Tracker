import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import EditTransactionForm from "../../components/EditTransactionForm";

export default async function EditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: { account: true },
  });

  if (!transaction) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <EditTransactionForm transaction={transaction} />
    </main>
  );
}
