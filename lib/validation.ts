import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount positive honi chahye"),
  category: z.string().min(1, "Category zaroori hai"),
  accountName: z.enum(["Cash", "Bank", "Secret Cash", "Secret Bank"], {
    message: "Account select karna zaroori hai",
  }),
  description: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
