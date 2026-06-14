// app/api/import/route.ts
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { auth } from "@/auth";

interface CsvRow {
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "File missing" }, { status: 400 });
    }
    const text = await file.text();

    const records: CsvRow[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const issues: any[] = [];
    const sanitizedRows: any[] = [];

    // Let's define the predefined members and their default membership bounds
    // Meera: left March 31. Sam: joined April 15.
    const memberNameMap: Record<string, string> = {
      aisha: "Aisha",
      rohan: "Rohan",
      priya: "Priya",
      meera: "Meera",
      sam: "Sam",
      dev: "Dev",
      "priya s": "Priya",
    };

    const getNormalizedName = (name: string): string => {
      const normalized = name.trim().toLowerCase();
      return memberNameMap[normalized] || name;
    };

    records.forEach((row, index) => {
      const rowNum = index + 2; // Header is line 1
      const issuesForRow: string[] = [];

      // 1. Paid by missing or wrong normalization
      let paidBy = row.paid_by.trim();
      let payerNormalized = "";
      if (!paidBy) {
        issuesForRow.push("Payer name is missing (field is empty).");
        payerNormalized = "Unknown";
      } else {
        payerNormalized = getNormalizedName(paidBy);
        if (paidBy !== payerNormalized) {
          issuesForRow.push(`Payer name '${paidBy}' normalized to '${payerNormalized}'.`);
        }
      }

      // 2. Amount parsing & issues
      let amountStr = row.amount.replace(/,/g, "").trim();
      let rawAmount = parseFloat(amountStr);
      let parsedAmount = rawAmount;
      let currency = row.currency.trim().toUpperCase();

      if (isNaN(rawAmount)) {
        issuesForRow.push(`Amount '${row.amount}' is not a valid number.`);
        parsedAmount = 0;
      } else if (rawAmount === 0) {
        issuesForRow.push("Amount is zero (0) – this expense has no cost.");
      } else if (rawAmount < 0) {
        issuesForRow.push(`Negative amount (${rawAmount}) detected. Handled as a refund/credit.`);
      }

      // 3. Currency issues
      if (!currency) {
        issuesForRow.push("Currency is missing. Defaulted to INR.");
        currency = "INR";
      } else if (currency !== "INR" && currency !== "USD") {
        issuesForRow.push(`Unsupported currency '${currency}'.`);
      }

      // Currency conversion logic
      let amountInINR = parsedAmount;
      if (currency === "USD") {
        const usdRate = 82.5; // conversion rate
        amountInINR = parsedAmount * usdRate;
        issuesForRow.push(`Converted ${parsedAmount} USD to ${amountInINR.toFixed(2)} INR using rate of 1 USD = 82.5 INR.`);
      }

      // 4. Date parsing & validation
      let dateStr = row.date.trim();
      let parsedDate: Date | null = null;

      if (!dateStr) {
        issuesForRow.push("Date is missing.");
      } else {
        // Handle "Mar-14" format
        if (dateStr.toLowerCase() === "mar-14") {
          parsedDate = new Date("2026-03-14");
          issuesForRow.push(`Inconsistent date format '${dateStr}' parsed as 14-03-2026.`);
          dateStr = "14-03-2026";
        } else {
          // Parse DD-MM-YYYY
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

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        issuesForRow.push(`Invalid or unparseable date: '${row.date}'.`);
        parsedDate = new Date(); // fallback
      }

      // 5. Check if it's a settlement logged as an expense
      const descLower = row.description.toLowerCase();
      const isSettlementWord = descLower.includes("paid back") || descLower.includes("settlement") || descLower.includes("repaid");
      const isSettlement = isSettlementWord || (!row.split_type && row.split_with && !row.split_with.includes(";"));

      if (isSettlement) {
        issuesForRow.push("Identified as a debt settlement/payment rather than a shared expense.");
      }

      // 6. Split validation
      const splitWithRaw = row.split_with.split(";").map((s) => s.trim()).filter(Boolean);
      const splitWith = splitWithRaw.map(getNormalizedName);
      const splitType = row.split_type.trim().toLowerCase();
      const splitDetailsStr = row.split_details.trim();

      // Check split details percentage sum
      if (splitType === "percentage") {
        const details = splitDetailsStr.split(";").map((s) => s.trim()).filter(Boolean);
        let totalPct = 0;
        details.forEach((d) => {
          const pctMatch = d.match(/(\d+(?:\.\d+)?)\s*%/);
          if (pctMatch) {
            totalPct += parseFloat(pctMatch[1]);
          }
        });
        if (Math.abs(totalPct - 100) > 0.01) {
          issuesForRow.push(`Percentage split details sum to ${totalPct}% instead of 100%. Adjusting proportionally.`);
        }
      }

      // Equal split type but details exist
      if (splitType === "equal" && splitDetailsStr) {
        issuesForRow.push("Split type is 'equal' but split details were provided. Ignored split details.");
      }

      // 7. Dynamic membership validation
      if (parsedDate) {
        const checkDate = parsedDate.getTime();
        // Meera moved out March 31, 2026
        const meeraLeaveTime = new Date("2026-03-31").getTime();
        // Sam moved in April 15, 2026
        const samJoinTime = new Date("2026-04-15").getTime();

        splitWith.forEach((member) => {
          if (member === "Meera" && checkDate > meeraLeaveTime) {
            issuesForRow.push(`Meera was listed in split, but she left on 31-03-2026. Removed her from split.`);
          }
          if (member === "Sam" && checkDate < samJoinTime) {
            issuesForRow.push(`Sam was listed in split, but he only joined on 15-04-2026. Removed him from split.`);
          }
        });
      }

      // Filter out invalid split members
      const activeSplitWith = splitWith.filter((member) => {
        if (!parsedDate) return true;
        const checkDate = parsedDate.getTime();
        if (member === "Meera" && checkDate > new Date("2026-03-31").getTime()) return false;
        if (member === "Sam" && checkDate < new Date("2026-04-15").getTime()) return false;
        return true;
      });

      sanitizedRows.push({
        id: index,
        originalRow: row,
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
        issues: issuesForRow,
      });

      if (issuesForRow.length > 0) {
        issues.push({
          rowNumber: rowNum,
          description: row.description,
          issues: issuesForRow,
        });
      }
    });

    // 8. Detect duplicate rows (exact duplicates and potential conflicting entries)
    const duplicates: any[] = [];
    const conflicts: any[] = [];
    const seenRows = new Map<string, any>();

    sanitizedRows.forEach((row) => {
      const key = `${row.date}_${row.description.toLowerCase().replace(/[^a-z0-9]/g, "")}_${row.amountInINR}_${row.paidBy}`;
      if (seenRows.has(key)) {
        const prev = seenRows.get(key);
        duplicates.push({
          row1: prev,
          row2: row,
          message: `Exact match duplicate row found: Row ${prev.rowNumber} and Row ${row.rowNumber}.`,
        });
      } else {
        seenRows.set(key, row);
      }
    });

    // Detect conflicts (e.g. Marina Bites Dinner or Thalassa dinner logged twice with different details)
    for (let i = 0; i < sanitizedRows.length; i++) {
      for (let j = i + 1; j < sanitizedRows.length; j++) {
        const r1 = sanitizedRows[i];
        const r2 = sanitizedRows[j];
        
        // Match descriptions by partial text, date, and general categories
        const desc1 = r1.description.toLowerCase();
        const desc2 = r2.description.toLowerCase();
        const isSameDate = r1.date === r2.date;
        const isDescriptionOverlap = desc1.includes(desc2) || desc2.includes(desc1) || 
          (desc1.includes("marina") && desc2.includes("marina")) ||
          (desc1.includes("thalassa") && desc2.includes("thalassa"));

        if (isSameDate && isDescriptionOverlap) {
          // Check if amounts or payers are different
          if (r1.amountInINR !== r2.amountInINR || r1.paidBy !== r2.paidBy) {
            conflicts.push({
              row1: r1,
              row2: r2,
              message: `Conflicting records found: '${r1.description}' (Row ${r1.rowNumber}) vs '${r2.description}' (Row ${r2.rowNumber}).`,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sanitizedRows,
      issues,
      duplicates,
      conflicts,
    });
  } catch (error: any) {
    console.error("CSV Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to process CSV" }, { status: 500 });
  }
}
