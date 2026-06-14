// utils/currency.ts
/**
 * Convert an amount from the given currency to INR.
 * Currently supports INR (no conversion) and USD (using a fixed rate).
 * The conversion rate is taken from the environment variable USD_TO_INR.
 */
export function convertToINR(amount: number, currency: string): number {
  const cur = currency.toUpperCase();
  if (cur === "INR") return amount;
  if (cur === "USD") {
    const rateStr = process.env.USD_TO_INR || "82.5"; // fallback rate
    const rate = Number(rateStr);
    if (isNaN(rate) || rate <= 0) {
      console.warn("Invalid USD_TO_INR rate, falling back to 82.5");
      return amount * 82.5;
    }
    return amount * rate;
  }
  // Unsupported currency – return amount unchanged and log warning
  console.warn(`Unsupported currency ${currency}, returning original amount`);
  return amount;
}
