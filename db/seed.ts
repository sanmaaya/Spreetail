import "./load-env";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { db } from "./drizzle";
import { users, groups, groupMemberships, expenses, expenseItems, settlements } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding default roommate sample data...");

  // 1. Ensure the group "Flat 4B Roommates" exists
  let groupId: number;
  const groupList = await db
    .select()
    .from(groups)
    .where(eq(groups.name, "Flat 4B Roommates"))
    .limit(1);

  if (groupList.length > 0) {
    groupId = groupList[0].id;
    console.log(`Found existing group 'Flat 4B Roommates' (ID: ${groupId})`);
  } else {
    const [newGroup] = await db
      .insert(groups)
      .values({ name: "Flat 4B Roommates" })
      .returning({ id: groups.id });
    groupId = newGroup.id;
    console.log(`Created new group 'Flat 4B Roommates' (ID: ${groupId})`);
  }

  // 2. Read and parse CSV
  const csvPath = path.resolve(process.cwd(), "expenses.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`expenses.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const memberNameMap: Record<string, string> = {
    aisha: "Aisha",
    rohan: "Rohan",
    priya: "Priya",
    meera: "Meera",
    sam: "Sam",
    dev: "Dev",
    "priya s": "Priya",
    "dev's friend kabir": "Kabir",
    kabir: "Kabir",
  };

  const getNormalizedName = (name: string): string => {
    const normalized = name.trim().toLowerCase();
    return memberNameMap[normalized] || name;
  };

  const sanitizedRows: any[] = [];

  records.forEach((row: any, index: number) => {
    const rowNum = index + 2;

    let paidBy = row.paid_by.trim();
    let payerNormalized = "Unknown";
    if (paidBy) {
      payerNormalized = getNormalizedName(paidBy);
    }

    let amountStr = row.amount.replace(/,/g, "").trim();
    let rawAmount = parseFloat(amountStr);
    let parsedAmount = isNaN(rawAmount) ? 0 : rawAmount;
    let currency = row.currency.trim().toUpperCase() || "INR";

    let amountInINR = parsedAmount;
    if (currency === "USD") {
      amountInINR = parsedAmount * 82.5;
    }

    let dateStr = row.date.trim();
    let parsedDate = new Date();
    if (dateStr) {
      if (dateStr.toLowerCase() === "mar-14") {
        parsedDate = new Date("2026-03-14");
      } else {
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthStr = parts[1];
          const year = parseInt(parts[2], 10);
          let month = parseInt(monthStr, 10);
          if (isNaN(month)) {
            const months: Record<string, number> = {
              jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
            };
            month = months[monthStr.toLowerCase().slice(0, 3)] || 0;
          }
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            parsedDate = new Date(year, month - 1, day);
          }
        }
      }
    }

    const descLower = row.description.toLowerCase();
    const isSettlement = descLower.includes("paid back") || descLower.includes("settlement") || descLower.includes("repaid");

    const splitWithRaw = row.split_with.split(";").map((s: string) => s.trim()).filter(Boolean);
    const splitWith = splitWithRaw.map(getNormalizedName);
    const splitType = row.split_type.trim().toLowerCase();
    const splitDetailsStr = row.split_details.trim();

    const checkDate = parsedDate.getTime();
    const meeraLeaveTime = new Date("2026-03-31").getTime();
    const samJoinTime = new Date("2026-04-15").getTime();

    const activeSplitWith = splitWith.filter((member: string) => {
      if (member === "Meera" && checkDate > meeraLeaveTime) return false;
      if (member === "Sam" && checkDate < samJoinTime) return false;
      return true;
    });

    sanitizedRows.push({
      rowNumber: rowNum,
      date: parsedDate.toISOString().split("T")[0],
      description: row.description.trim(),
      paidBy: payerNormalized,
      amount: parsedAmount,
      currency,
      amountInINR,
      splitType: isSettlement ? "settlement" : (splitType || "equal"),
      splitWith: activeSplitWith,
      splitDetails: splitDetailsStr,
      isSettlement,
    });
  });

  // Programmatic resolutions: discard duplicate row 6 and conflicting row 24
  const rowsToSave = sanitizedRows.filter((row) => {
    if (row.rowNumber === 6) return false;
    if (row.rowNumber === 24) return false;
    return true;
  });

  // Ensure all users exist
  const allNames = new Set<string>();
  rowsToSave.forEach((row) => {
    if (row.paidBy && row.paidBy !== "Unknown") allNames.add(row.paidBy);
    row.splitWith.forEach((name: string) => allNames.add(name));
  });

  // Add default testing account 'Alice' to names to ensure it maps correctly
  allNames.add("Alice");

  const userMap = new Map<string, number>();
  const existingUsers = await db.select().from(users);
  existingUsers.forEach((u) => {
    userMap.set(u.name.toLowerCase(), u.id);
  });

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  for (const name of allNames) {
    const nameKey = name.toLowerCase();
    if (!userMap.has(nameKey)) {
      const email = nameKey === "alice" ? "alice@example.com" : `${nameKey}@spreetail.com`;
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          hashedPassword: defaultPasswordHash,
        })
        .returning({ id: users.id });
      userMap.set(nameKey, newUser.id);
      console.log(`Seeded user: '${name}' with email '${email}'`);
    }
  }

  // Ensure all users are added as group members
  const existingMemberships = await db
    .select()
    .from(groupMemberships)
    .where(eq(groupMemberships.groupId, groupId));
  const memberUserIds = new Set(existingMemberships.map((m) => m.userId));

  for (const [nameKey, userId] of userMap.entries()) {
    if (!memberUserIds.has(userId)) {
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
      console.log(`Joined user '${nameKey}' to group ${groupId}`);
    }
  }

  // Clear previous group transaction logs to enable clean re-seeding
  console.log("Cleaning up previous transactions in group...");
  const groupExpenses = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.groupId, groupId));
  const groupExpenseIds = groupExpenses.map((e) => e.id);
  
  if (groupExpenseIds.length > 0) {
    for (const expId of groupExpenseIds) {
      await db.delete(expenseItems).where(eq(expenseItems.expenseId, expId));
    }
    await db.delete(expenses).where(eq(expenses.groupId, groupId));
  }
  
  const memberIdsList = Array.from(userMap.values());
  if (memberIdsList.length > 0) {
    for (const mId of memberIdsList) {
      await db.delete(settlements).where(eq(settlements.fromUserId, mId));
      await db.delete(settlements).where(eq(settlements.toUserId, mId));
    }
  }

  // Insert records
  console.log("Inserting seeded roommate ledger...");
  const freshUsers = await db.select().from(users);
  
  for (const row of rowsToSave) {
    const payerId = userMap.get(row.paidBy.toLowerCase()) || userMap.get("aisha")!;
    const dateVal = new Date(row.date);

    if (row.isSettlement || row.splitType === "settlement") {
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

      const participants = row.splitWith.map((name: string) => userMap.get(name.toLowerCase())!).filter(Boolean);
      if (participants.length === 0) continue;

      const shares: { userId: number; share: number }[] = [];

      if (row.splitType === "percentage") {
        const details = row.splitDetails.split(";").map((s: string) => s.trim()).filter(Boolean);
        let sumPercentages = 0;
        const percentagesMap = new Map<string, number>();
        
        details.forEach((d: string) => {
          const match = d.match(/^([^\d%]+)\s+(\d+(?:\.\d+)?)\s*%/);
          if (match) {
            const name = match[1].trim().toLowerCase();
            const pct = parseFloat(match[2]);
            percentagesMap.set(name, pct);
            sumPercentages += pct;
          }
        });

        participants.forEach((pId: number) => {
          const dbUser = freshUsers.find((u) => u.id === pId) || { name: "" };
          const userName = dbUser.name.toLowerCase() || "";
          let pct = percentagesMap.get(userName) || 0;
          if (sumPercentages > 0 && Math.abs(sumPercentages - 100) > 0.1) {
            pct = (pct / sumPercentages) * 100;
          }
          const share = (row.amountInINR * pct) / 100;
          shares.push({ userId: pId, share });
        });
      } else if (row.splitType === "share" || row.splitType === "unequal") {
        const details = row.splitDetails.split(";").map((s: string) => s.trim()).filter(Boolean);
        let totalShares = 0;
        const sharesMap = new Map<string, number>();

        details.forEach((d: string) => {
          const parts = d.split(/\s+/);
          const val = parseFloat(parts.pop() || "0");
          const name = parts.join(" ").trim().toLowerCase();
          sharesMap.set(name, val);
          totalShares += val;
        });

        if (row.splitType === "share") {
          participants.forEach((pId: number) => {
            const dbUser = freshUsers.find((u) => u.id === pId) || { name: "" };
            const userName = dbUser.name.toLowerCase() || "";
            const coeff = sharesMap.get(userName) || 1;
            const share = (row.amountInINR * coeff) / (totalShares || 1);
            shares.push({ userId: pId, share });
          });
        } else {
          participants.forEach((pId: number) => {
            const dbUser = freshUsers.find((u) => u.id === pId) || { name: "" };
            const userName = dbUser.name.toLowerCase() || "";
            const amt = sharesMap.get(userName) || 0;
            shares.push({ userId: pId, share: amt });
          });
        }
      } else {
        const share = row.amountInINR / participants.length;
        participants.forEach((pId: number) => {
          shares.push({ userId: pId, share });
        });
      }

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

  console.log("Roommate sample database seeding complete successfully!");
}

main().catch((err) => {
  console.error("Database seed command failed:", err);
  process.exit(1);
});
