// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { expenses, expenseItems, users, groups, groupMemberships } from "@/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { auth } from "@/auth";
import { convertToINR } from "@/utils/currency";

/**
 * POST – create a new expense.
 * Body expects:
 *   {
 *     groupId: number,
 *     description: string,
 *     amount: number,
 *     currency: string,
 *     date: string (ISO or DD-MM-YYYY),
 *     payerId: number,
 *     split_type: string,
 *     split_with: string[],
 *     split_details?: string[] // depending on split_type
 *   }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const {
    groupId,
    description,
    amount,
    currency = "INR",
    date,
    payerId,
    split_type,
    split_with,
    split_details,
  } = data;

  if (!groupId || !description || !amount || !payerId || !split_type || !split_with) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Convert amount to INR for storage (store as numeric in INR)
  const amountInINR = convertToINR(Number(amount), currency);

  // Insert expense record
  const [newExpense] = await db
    .insert(expenses)
    .values({
      groupId: Number(groupId),
      description: String(description),
      amount: String(amountInINR),
      currency: String(currency),
      createdBy: Number(payerId),
      createdAt: new Date(date),
    })
    .returning({ id: expenses.id });

  // Compute shares based on split_type
  const participants = split_with.map((id: any) => Number(id));
  const shares: { userId: number; share: number }[] = [];

  if (split_type === "equal") {
    const share = Number(amountInINR) / participants.length;
    participants.forEach((uid: number) => shares.push({ userId: uid, share }));
  } else if (split_type === "percentage") {
    // split_details like ["Aisha 30%", "Rohan 30%", ...]
    let totalPercent = 0;
    split_details?.forEach((detail: string) => {
      const match = detail.match(/^(.*)\s+(\d+(?:\.\d+)?)%$/);
      if (match) {
        const name = match[1].trim();
        const percent = parseFloat(match[2]);
        const user = participants.find((u: number) => u === Number(name) || name.toLowerCase() === name);
        // For simplicity we assume split_with contains IDs already, so use index lookup
        const uid = participants[split_details?.indexOf(detail) ?? 0];
        const share = (amountInINR * percent) / 100;
        shares.push({ userId: uid, share });
        totalPercent += percent;
      }
    });
    if (Math.abs(totalPercent - 100) > 0.5) {
      return NextResponse.json({ error: "Percentages do not sum to 100" }, { status: 400 });
    }
  } else if (split_type === "share" || split_type === "unequal") {
    // split_details like ["Aisha 2000", "Rohan 1500", ...]
    split_details?.forEach((detail: string) => {
      const parts = detail.trim().split(/\s+/);
      const amountStr = parts.pop();
      const name = parts.join(" ");
      const uid = participants[split_details?.indexOf(detail) ?? 0]; // simplistic mapping
      const share = convertToINR(Number(amountStr), currency);
      shares.push({ userId: uid, share });
    });
  } else {
    return NextResponse.json({ error: "Unsupported split_type" }, { status: 400 });
  }

  // Insert expense_items rows
  const expenseItemsRows = shares.map((s) => ({
    expenseId: newExpense.id,
    userId: s.userId,
    share: s.share,
  }));
  await db.insert(expenseItems).values(expenseItemsRows as any);

  return NextResponse.json({ expenseId: newExpense.id }, { status: 201 });
}

/**
 * GET – list expenses for a group with optional date range.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const groupId = Number(url.searchParams.get("groupId"));
  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  const rows = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      currency: expenses.currency,
      date: expenses.createdAt,
      payerId: expenses.createdBy,
      payerName: users.name,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.createdBy, users.id))
    .where(eq(expenses.groupId, groupId));

  return NextResponse.json(rows);
}
