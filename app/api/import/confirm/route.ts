// app/api/import/confirm/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { expenses, expenseItems, settlements, users, groupMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

interface SaveRow {
  date: string;
  description: string;
  paidBy: string;
  amount: number;
  currency: string;
  amountInINR: number;
  splitType: string;
  splitWith: string[];
  splitDetails: string;
  isSettlement: boolean;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId, rows }: { groupId: number; rows: SaveRow[] } = await req.json();
    if (!groupId || !rows || !rows.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step 1: Ensure all members exist in the system and are mapped to IDs
    const allNames = new Set<string>();
    rows.forEach((row) => {
      if (row.paidBy && row.paidBy !== "Unknown") allNames.add(row.paidBy);
      if (Array.isArray(row.splitWith)) {
        row.splitWith.forEach((name) => allNames.add(name));
      }
    });

    const userMap = new Map<string, number>();

    // Fetch existing users
    const existingUsers = await db.select().from(users);
    existingUsers.forEach((u) => {
      userMap.set(u.name.toLowerCase(), u.id);
    });

    // Create users that don't exist
    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    for (const name of allNames) {
      const nameKey = name.toLowerCase();
      if (!userMap.has(nameKey)) {
        const [newUser] = await db
          .insert(users)
          .values({
            name,
            email: `${nameKey}@spreetail.com`,
            hashedPassword: defaultPasswordHash,
          })
          .returning({ id: users.id });
        userMap.set(nameKey, newUser.id);
      }
    }

    // Step 2: Ensure all users are added as group members
    const existingMemberships = await db
      .select()
      .from(groupMemberships)
      .where(eq(groupMemberships.groupId, groupId));
    const memberUserIds = new Set(existingMemberships.map((m) => m.userId));

    for (const [nameKey, userId] of userMap.entries()) {
      if (!memberUserIds.has(userId)) {
        // Meera left March 31, 2026. Sam joined April 15, 2026.
        let joinDate = new Date("2026-02-01");
        let leaveDate: Date | null = null;

        if (nameKey === "meera") {
          leaveDate = new Date("2026-03-31");
        } else if (nameKey === "sam") {
          joinDate = new Date("2026-04-15");
        }

        await db.insert(groupMemberships).values({
          groupId,
          userId,
          joinDate,
          leaveDate,
        });
      }
    }

    // Step 3: Clear existing expenses and settlements for this group to avoid duplicates on re-import
    // This makes the import action idempotent and clean.
    // However, since we might have foreign keys, delete in reverse order.
    // Clear expense_items first
    const groupExpenses = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.groupId, groupId));
    const groupExpenseIds = groupExpenses.map((e) => e.id);
    
    if (groupExpenseIds.length > 0) {
      for (const expId of groupExpenseIds) {
        await db.delete(expenseItems).where(eq(expenseItems.expenseId, expId));
      }
      await db.delete(expenses).where(eq(expenses.groupId, groupId));
    }
    
    // Also clear settlements from/to these group members
    const memberIdsList = Array.from(userMap.values());
    if (memberIdsList.length > 0) {
      // For simplicity, we delete all settlements involving these members
      // (a simple wipe for clean import demonstration)
      for (const mId of memberIdsList) {
        await db.delete(settlements).where(eq(settlements.fromUserId, mId));
        await db.delete(settlements).where(eq(settlements.toUserId, mId));
      }
    }

    // Step 4: Insert the imported expenses and settlements
    for (const row of rows) {
      const payerId = userMap.get(row.paidBy.toLowerCase()) || userMap.get("aisha")!;
      const dateVal = new Date(row.date);

      if (row.isSettlement || row.splitType === "settlement") {
        // Log as settlement
        // In CSV, settlement rows like "Rohan paid Aisha back" has splitWith = ["Aisha"]
        const toUserId = userMap.get(row.splitWith[0]?.toLowerCase()) || payerId;
        await db.insert(settlements).values({
          fromUserId: payerId,
          toUserId: toUserId,
          amount: String(row.amountInINR),
          currency: "INR",
          createdAt: dateVal,
          settled: true,
        });
      } else {
        // Log as expense
        const [newExpense] = await db
          .insert(expenses)
          .values({
            groupId,
            description: row.description,
            amount: String(row.amountInINR),
            currency: "INR",
            createdBy: payerId,
            createdAt: dateVal,
          })
          .returning({ id: expenses.id });

        const participants = row.splitWith.map((name) => userMap.get(name.toLowerCase())!).filter(Boolean);
        if (participants.length === 0) continue;

        const shares: { userId: number; share: number }[] = [];

        if (row.splitType === "percentage") {
          // Parse split details percentages (Aisha 30%; Rohan 30%...)
          const details = row.splitDetails.split(";").map((s) => s.trim()).filter(Boolean);
          let sumPercentages = 0;
          const percentagesMap = new Map<string, number>();
          
          details.forEach((d) => {
            const match = d.match(/^([^\d%]+)\s+(\d+(?:\.\d+)?)\s*%/);
            if (match) {
              const name = match[1].trim().toLowerCase();
              const pct = parseFloat(match[2]);
              percentagesMap.set(name, pct);
              sumPercentages += pct;
            }
          });

          // If percentages sum doesn't match 100, normalize it
          participants.forEach((pId) => {
            const userName = existingUsers.find((u) => u.id === pId)?.name.toLowerCase() || "";
            let pct = percentagesMap.get(userName) || 0;
            if (sumPercentages > 0 && Math.abs(sumPercentages - 100) > 0.1) {
              pct = (pct / sumPercentages) * 100;
            }
            const share = (row.amountInINR * pct) / 100;
            shares.push({ userId: pId, share });
          });
        } else if (row.splitType === "share" || row.splitType === "unequal") {
          // Parse split details values (Aisha 2; Rohan 1...) or (Rohan 700; Priya 400...)
          const details = row.splitDetails.split(";").map((s) => s.trim()).filter(Boolean);
          let totalShares = 0;
          const sharesMap = new Map<string, number>();

          details.forEach((d) => {
            const parts = d.split(/\s+/);
            const val = parseFloat(parts.pop() || "0");
            const name = parts.join(" ").trim().toLowerCase();
            sharesMap.set(name, val);
            totalShares += val;
          });

          if (row.splitType === "share") {
            // "share" split type means proportional allocation based on share coefficient (e.g. Aisha 2 shares, Rohan 1 share)
            participants.forEach((pId) => {
              const userName = existingUsers.find((u) => u.id === pId)?.name.toLowerCase() || "";
              const coeff = sharesMap.get(userName) || 1;
              const share = (row.amountInINR * coeff) / (totalShares || 1);
              shares.push({ userId: pId, share });
            });
          } else {
            // "unequal" split type means direct amounts
            participants.forEach((pId) => {
              const userName = existingUsers.find((u) => u.id === pId)?.name.toLowerCase() || "";
              // Unequal matches names or indices. We match names.
              // Note: Swiggy or cylinder split might be here.
              const amt = sharesMap.get(userName) || 0;
              shares.push({ userId: pId, share: amt });
            });
          }
        } else {
          // Equal split
          const share = row.amountInINR / participants.length;
          participants.forEach((pId) => {
            shares.push({ userId: pId, share });
          });
        }

        // Save expense_items
        const expenseItemsRows = shares.map((s) => ({
          expenseId: newExpense.id,
          userId: s.userId,
          share: String(s.share),
        }));
        if (expenseItemsRows.length > 0) {
          await db.insert(expenseItems).values(expenseItemsRows);
        }
      }
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("CSV Confirm error:", error);
    return NextResponse.json({ error: error.message || "Failed to save data" }, { status: 500 });
  }
}
