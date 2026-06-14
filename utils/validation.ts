// utils/validation.ts
import { parse } from "csv-parse/sync";
import { convertToINR } from "@/utils/currency";

export interface ValidationResult {
  isValid: boolean;
  column?: string;
  message?: string;
  severity?: "error" | "warning";
}

/**
 * Common settlement keywords used to identify rows that are actually payments/settlements.
 */
const SETTLEMENT_KEYWORDS = ["settlement", "payment", "repaid", "settled", "paid back", "refund"];

/**
 * Validate a single CSV row according to the policies defined in the implementation plan.
 * Returns a ValidationResult indicating whether the row is acceptable or describing the issue.
 */
export function validateRow(row: Record<string, string>, rowNumber: number): ValidationResult {
  // Trim all values
  const trimmed = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, (v ?? "").trim()]));

  // 1️⃣ Date validation – accept multiple formats (DD-MM-YYYY or DD-MMM-YYYY)
  const rawDate = trimmed["date"];
  if (!rawDate) {
    return { isValid: false, column: "date", message: "Missing date", severity: "error" };
  }
  // Normalize month names to numbers
  const dateParts = rawDate.split(/[-/]/);
  if (dateParts.length !== 3) {
    return { isValid: false, column: "date", message: `Unrecognised date format: ${rawDate}`, severity: "error" };
  }
  let day = parseInt(dateParts[0], 10);
  let monthStr = dateParts[1];
  let year = parseInt(dateParts[2], 10);
  const monthNames: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  let month: number;
  if (isNaN(parseInt(monthStr, 10))) {
    const m = monthNames[monthStr.toLowerCase().slice(0, 3)];
    if (!m) {
      return { isValid: false, column: "date", message: `Invalid month token: ${monthStr}`, severity: "error" };
    }
    month = m;
  } else {
    month = parseInt(monthStr, 10);
  }
  // Basic range check (no exhaustive validation needed here)
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return { isValid: false, column: "date", message: `Invalid day or month: ${rawDate}`, severity: "error" };
  }

  // 2️⃣ Paid_by validation – must have a name
  if (!trimmed["paid_by"]) {
    return { isValid: false, column: "paid_by", message: "Payer missing", severity: "error" };
  }

  // 3️⃣ Amount parsing – remove commas and possible currency symbols
  const rawAmount = trimmed["amount"]?.replace(/,/g, "");
  if (!rawAmount) {
    return { isValid: false, column: "amount", message: "Amount missing", severity: "error" };
  }
  const amountNum = Number(rawAmount);
  if (isNaN(amountNum)) {
    return { isValid: false, column: "amount", message: `Cannot parse amount: ${trimmed["amount"]}`, severity: "error" };
  }

  // 4️⃣ Currency handling – default to INR if empty
  let currency = trimmed["currency"]?.toUpperCase() || "INR";
  if (currency !== "INR" && currency !== "USD") {
    return { isValid: false, column: "currency", message: `Unsupported currency ${currency}`, severity: "warning" };
  }

  // 5️⃣ Negative amount policy – treat as refund/credit unless marked as settlement
  if (amountNum < 0) {
    const isSettlement = SETTLEMENT_KEYWORDS.some((kw) => trimmed["description"].toLowerCase().includes(kw));
    if (!isSettlement) {
      // Refund/credit is allowed, just flag as warning for review
      return { isValid: true, column: "amount", message: "Negative amount treated as refund/credit", severity: "warning" };
    }
  }

  // 6️⃣ Split type validation
  const splitType = trimmed["split_type"]?.toLowerCase();
  const participants = trimmed["split_with"]?.split(";").map((s) => s.trim()).filter(Boolean) || [];
  if (!participants.length) {
    return { isValid: false, column: "split_with", message: "No participants listed", severity: "error" };
  }
  if (!splitType || splitType === "") {
    // Empty split_type is acceptable for settlements – we will treat later
    // If not a settlement, flag as warning
    const maybeSettlement = SETTLEMENT_KEYWORDS.some((kw) => trimmed["description"].toLowerCase().includes(kw));
    if (!maybeSettlement) {
      return { isValid: true, column: "split_type", message: "Empty split_type – assuming settlement", severity: "warning" };
    }
  } else if (splitType === "equal") {
    // No further validation needed – each participant gets equal share
  } else if (splitType === "percentage") {
    const details = trimmed["split_details"]?.split(";").map((s) => s.trim()) || [];
    let total = 0;
    for (const d of details) {
      const match = d.match(/^(.*)\s+(\d+(?:\.\d+)?)%$/);
      if (!match) {
        return { isValid: false, column: "split_details", message: `Invalid percentage detail: ${d}`, severity: "error" };
      }
      total += parseFloat(match[2]);
    }
    if (Math.abs(total - 100) > 0.5) {
      return { isValid: false, column: "split_details", message: `Percentages do not sum to 100 (sum=${total})`, severity: "error" };
    }
  } else if (splitType === "share" || splitType === "unequal") {
    const details = trimmed["split_details"]?.split(";").map((s) => s.trim()) || [];
    if (details.length !== participants.length) {
      return { isValid: false, column: "split_details", message: "Number of share entries does not match participants", severity: "error" };
    }
    // Ensure each entry looks like "Name amount"
    for (const d of details) {
      const parts = d.split(" ");
      if (parts.length < 2) {
        return { isValid: false, column: "split_details", message: `Invalid share entry: ${d}`, severity: "error" };
      }
    }
  } else {
    return { isValid: false, column: "split_type", message: `Unsupported split_type ${splitType}`, severity: "error" };
  }

  // 7️⃣ Membership date bounds – this requires access to group members which we don't have here.
  // The import controller will later cross‑check dates against stored memberships.

  // 8️⃣ Settlement detection – flag rows that look like settlements so the controller can store them differently.
  const description = trimmed["description"].toLowerCase();
  const isSettlement = SETTLEMENT_KEYWORDS.some((kw) => description.includes(kw));
  if (isSettlement && splitType && splitType !== "") {
    // Warn that a settlement row also has a split – we will treat it as settlement anyway.
    return { isValid: true, column: "description", message: "Row identified as settlement", severity: "warning" };
  }

  // All checks passed
  return { isValid: true };
}
