// app/api/groups/[groupId]/balances/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { expenses, expenseItems, settlements, users, groupMemberships } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { auth } from "@/auth";

interface UserBalance {
  id: number;
  name: string;
  email: string;
  totalPaid: number;
  totalShare: number;
  totalSettledPaid: number;
  totalSettledReceived: number;
  netBalance: number;
}

export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const groupId = Number(resolvedParams.groupId);
    if (isNaN(groupId)) return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });

    // Fetch all members of the group
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .innerJoin(groupMemberships, eq(users.id, groupMemberships.userId))
      .where(eq(groupMemberships.groupId, groupId));

    const memberIds = members.map((m) => m.id);
    if (memberIds.length === 0) {
      return NextResponse.json({ members: [], balances: [], settlements: [], breakdown: {} });
    }

    // Initialize balance structures
    const balancesMap = new Map<number, UserBalance>();
    members.forEach((m) => {
      balancesMap.set(m.id, {
        id: m.id,
        name: m.name,
        email: m.email,
        totalPaid: 0,
        totalShare: 0,
        totalSettledPaid: 0,
        totalSettledReceived: 0,
        netBalance: 0,
      });
    });

    // 1. Fetch all expenses in the group
    const groupExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    const expenseIds = groupExpenses.map((e) => e.id);

    // Fetch all expense items (shares)
    const shares = expenseIds.length > 0 
      ? await db.select().from(expenseItems).where(inArray(expenseItems.expenseId, expenseIds))
      : [];

    // Aggregate paid amounts for expenses
    groupExpenses.forEach((exp) => {
      const payerId = exp.createdBy;
      if (balancesMap.has(payerId)) {
        const bal = balancesMap.get(payerId)!;
        bal.totalPaid += Number(exp.amount);
      }
    });

    // Aggregate share amounts for expenses
    shares.forEach((share) => {
      const uId = share.userId;
      if (balancesMap.has(uId)) {
        const bal = balancesMap.get(uId)!;
        bal.totalShare += Number(share.share);
      }
    });

    // 2. Fetch all settlements between members of the group
    const groupSettlements = await db
      .select()
      .from(settlements)
      .where(
        and(
          inArray(settlements.fromUserId, memberIds),
          inArray(settlements.toUserId, memberIds)
        )
      );

    groupSettlements.forEach((set) => {
      const fromId = set.fromUserId;
      const toId = set.toUserId;
      const amt = Number(set.amount);

      if (balancesMap.has(fromId)) {
        balancesMap.get(fromId)!.totalSettledPaid += amt;
      }
      if (balancesMap.has(toId)) {
        balancesMap.get(toId)!.totalSettledReceived += amt;
      }
    });

    // Calculate final Net Balance for each user:
    // Net Balance = (What you paid - What you spent) + (What you paid in settlements - What you received in settlements)
    // Wait, let's verify the sign.
    // If you paid ₹1000 and your share was ₹300, net balance is +₹700 (you are owed ₹700).
    // If you paid ₹500 in settlement to clear a debt, you paid more, so net balance is +₹500.
    // If you received ₹500, net balance decreases by ₹500.
    // So: netBalance = (totalPaid - totalShare) + (totalSettledPaid - totalSettledReceived)
    const balancesList: UserBalance[] = [];
    balancesMap.forEach((bal) => {
      bal.netBalance = (bal.totalPaid - bal.totalShare) + (bal.totalSettledPaid - bal.totalSettledReceived);
      balancesList.push(bal);
    });

    // 3. Simplified debts (Aisha: "Who pays whom, how much, done.")
    // Greedy min-cash-flow algorithm
    const debtors: { id: number; name: string; amount: number }[] = [];
    const creditors: { id: number; name: string; amount: number }[] = [];

    balancesList.forEach((b) => {
      // Round to 2 decimals to prevent precision issues
      const net = Math.round(b.netBalance * 100) / 100;
      if (net < -0.01) {
        debtors.push({ id: b.id, name: b.name, amount: -net });
      } else if (net > 0.01) {
        creditors.push({ id: b.id, name: b.name, amount: net });
      }
    });

    // Sort descending to settle largest debts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedPayments: { from: string; to: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmount = Math.min(debtor.amount, creditor.amount);
      simplifiedPayments.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    // 4. Detailed Breakdown (Rohan: "No magic numbers... exactly which expenses make that up.")
    const detailedBreakdowns: Record<number, {
      expenses: { description: string; date: string; type: "paid" | "share"; amount: number }[];
      settlements: { description: string; date: string; type: "paid" | "received"; amount: number }[];
    }> = {};

    members.forEach((m) => {
      detailedBreakdowns[m.id] = { expenses: [], settlements: [] };
    });

    groupExpenses.forEach((exp) => {
      const expDate = exp.createdAt.toISOString().split("T")[0];
      const amt = Number(exp.amount);
      const payerId = exp.createdBy;

      // Payer entry
      if (detailedBreakdowns[payerId]) {
        detailedBreakdowns[payerId].expenses.push({
          description: `Paid for: ${exp.description}`,
          date: expDate,
          type: "paid",
          amount: amt,
        });
      }

      // Participant entry
      const expShares = shares.filter((s) => s.expenseId === exp.id);
      expShares.forEach((share) => {
        if (detailedBreakdowns[share.userId]) {
          detailedBreakdowns[share.userId].expenses.push({
            description: `Share of: ${exp.description}`,
            date: expDate,
            type: "share",
            amount: Number(share.share),
          });
        }
      });
    });

    groupSettlements.forEach((set) => {
      const setDate = set.createdAt.toISOString().split("T")[0];
      const amt = Number(set.amount);

      if (detailedBreakdowns[set.fromUserId]) {
        detailedBreakdowns[set.fromUserId].settlements.push({
          description: `Settlement to ${balancesMap.get(set.toUserId)?.name}`,
          date: setDate,
          type: "paid",
          amount: amt,
        });
      }

      if (detailedBreakdowns[set.toUserId]) {
        detailedBreakdowns[set.toUserId].settlements.push({
          description: `Settlement from ${balancesMap.get(set.fromUserId)?.name}`,
          date: setDate,
          type: "received",
          amount: amt,
        });
      }
    });

    return NextResponse.json({
      members,
      balances: balancesList,
      simplifiedPayments,
      breakdown: detailedBreakdowns,
    });
  } catch (error: any) {
    console.error("Balances error:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate balances" }, { status: 500 });
  }
}
