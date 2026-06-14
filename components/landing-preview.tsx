"use client";

import { useState } from "react";
import { DoubleArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

export function LandingPreview() {
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "settlements">("balances");

  const mockExpenses = [
    { desc: "February rent", payer: "Aisha", amount: 48000, date: "01-02" },
    { desc: "Groceries BigBasket", payer: "Priya", amount: 2340, date: "03-02" },
    { desc: "Wifi bill Feb", payer: "Rohan", amount: 1199, date: "05-02" },
  ];

  const mockBalances = [
    { name: "Aisha", net: 24850, paid: 49440, share: 24590, positive: true },
    { name: "Rohan", net: -11620, paid: 1199, share: 12819, positive: false },
    { name: "Priya", net: -11620, paid: 2340, share: 13960, positive: false },
    { name: "Meera", net: -1610, paid: 3000, share: 4610, positive: false },
  ];

  const mockSettlements = [
    { from: "Rohan", to: "Aisha", amount: 11620 },
    { from: "Priya", to: "Aisha", amount: 11620 },
    { from: "Meera", to: "Aisha", amount: 1610 },
  ];

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl animate-fade-in transition-all hover:border-zinc-300 dark:hover:border-zinc-700/80">
      <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-4 mb-6">
        <div>
          <span className="text-xxs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Live Preview</span>
          <h3 className="text-lg font-serif font-bold text-zinc-850 dark:text-zinc-100 mt-0.5">Flat 4B Ledger</h3>
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xxs">
          {(["expenses", "balances", "settlements"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-2.5 py-1.5 font-semibold capitalize transition-all cursor-pointer ${
                activeTab === tab ? "bg-amber-600 text-white shadow-sm" : "text-zinc-550 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 flex flex-col justify-between">
        {activeTab === "expenses" && (
          <div className="space-y-3 animate-slide-up">
            {mockExpenses.map((exp, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-955/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 font-mono text-xs text-zinc-500 border border-zinc-200/50 dark:border-zinc-800/40">
                    {exp.date}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">{exp.desc}</h4>
                    <p className="text-xxs text-zinc-500">Paid by {exp.payer}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">₹{exp.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "balances" && (
          <div className="space-y-3.5 animate-slide-up">
            {mockBalances.map((bal, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bal.name}</span>
                  <span className={`font-bold ${bal.positive ? "text-emerald-600 dark:text-emerald-500 text-glow-secondary animate-pulse-slow" : "text-zinc-505 dark:text-zinc-500"}`}>
                    {bal.positive ? "+" : ""}₹{bal.net.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden border border-zinc-200 dark:border-zinc-900">
                  <div
                    className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                      bal.positive ? "bg-emerald-500 left-1/2 right-0" : "bg-amber-600/60 right-1/2 left-0"
                    }`}
                    style={{
                      left: bal.positive ? "50%" : `${50 - Math.min(Math.abs(bal.net) / 50000 * 50, 45)}%`,
                      right: bal.positive ? `${50 - Math.min(bal.net / 50000 * 50, 45)}%` : "50%"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "settlements" && (
          <div className="space-y-3.5 animate-slide-up text-left">
            {mockSettlements.map((set, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-zinc-150 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-950/20 p-3">
                <div className="flex items-center gap-2.5 text-xs text-zinc-505 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{set.from}</span>
                  <DoubleArrowRightIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{set.to}</span>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-500 text-glow-primary">₹{set.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-600/5 border border-amber-500/10 p-2.5 text-xxs text-zinc-550 dark:text-zinc-400">
          <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Balances adjusted dynamically based on active join/leave dates.</span>
        </div>
      </div>
    </div>
  );
}
