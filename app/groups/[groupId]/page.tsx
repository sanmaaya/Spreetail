// app/groups/[groupId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Member {
  id: number;
  name: string;
  email: string;
  joinDate: string;
  leaveDate: string | null;
}

interface Group {
  id: number;
  name: string;
  members: Member[];
}

interface Expense {
  id: number;
  description: string;
  amount: string;
  currency: string;
  date: string;
  payerId: number;
  payerName: string;
}

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

interface SimplifiedPayment {
  from: string;
  to: string;
  amount: number;
}

interface DetailedEntry {
  description: string;
  date: string;
  type: string;
  amount: number;
}

interface DetailedBreakdown {
  expenses: DetailedEntry[];
  settlements: DetailedEntry[];
}

export default function GroupDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const groupId = Number(params.groupId);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const darkActive = document.documentElement.classList.contains("dark");
      setTheme(darkActive ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [group, setGroup] = useState<Group | null>(null);
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [simplifiedPayments, setSimplifiedPayments] = useState<SimplifiedPayment[]>([]);
  const [breakdown, setBreakdown] = useState<Record<number, DetailedBreakdown>>({});
  
  const [activeTab, setActiveTab] = useState<"expenses" | "balances" | "members">("expenses");
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Rohan's selected user for detailed breakdown
  const [selectedUserBreakdownId, setSelectedUserBreakdownId] = useState<number | null>(null);

  // Add Expense form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string>("");
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "share">("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [splitDetails, setSplitDetails] = useState<Record<number, string>>({});

  // Add Member form states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [memberJoinDate, setMemberJoinDate] = useState("2026-02-01");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isNaN(groupId)) {
      fetchData();
    }
  }, [status, groupId, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Group & Members
      const groupRes = await fetch(`/api/groups?groupId=${groupId}`);
      if (!groupRes.ok) {
        router.push("/groups");
        return;
      }
      const groupData = await groupRes.json();
      setGroup(groupData);

      // Default first member as payer
      if (groupData.members && groupData.members.length > 0) {
        setPayerId(String(groupData.members[0].id));
        setSelectedParticipants(groupData.members.map((m: Member) => m.id));
      }

      // Fetch Expenses
      const expRes = await fetch(`/api/expenses?groupId=${groupId}`);
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpensesList(expData);
      }

      // Fetch Balances & breakdowns
      const balRes = await fetch(`/api/groups/${groupId}/balances`);
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalances(balData.balances || []);
        setSimplifiedPayments(balData.simplifiedPayments || []);
        setBreakdown(balData.breakdown || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !payerId || selectedParticipants.length === 0) return;

    let split_details: string[] = [];
    if (splitType === "percentage") {
      split_details = selectedParticipants.map((pId) => {
        const pct = splitDetails[pId] || "0";
        const name = group?.members.find((m) => m.id === pId)?.name || "";
        return `${name} ${pct}%`;
      });
    } else if (splitType === "share") {
      split_details = selectedParticipants.map((pId) => {
        const coefficient = splitDetails[pId] || "1";
        const name = group?.members.find((m) => m.id === pId)?.name || "";
        return `${name} ${coefficient}`;
      });
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          description,
          amount: parseFloat(amount),
          currency: "INR",
          date: new Date().toISOString(),
          payerId: Number(payerId),
          split_type: splitType,
          split_with: selectedParticipants,
          split_details,
        }),
      });

      if (res.ok) {
        setShowAddExpenseModal(false);
        setDescription("");
        setAmount("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      // Step 1: Create user if registration email provided, otherwise check or create
      const email = newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/[^a-z]/g, "")}@spreetail.com`;
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: newMemberName,
          password: "password123",
        }),
      });

      const memberUser = await regRes.json();
      let memberUserId = memberUser.id;

      if (!regRes.ok) {
        // If already exists, we will need to lookup user or we can assume registration error implies email exists.
        // For standard simulation, we allow putting the member using their existing user if matched.
        // So we add member to group
        alert("This name or email already exists. Adding membership...");
        // Fallback: search or assume we got user id from database later, or handle error
      }

      // Add to group
      const joinRes = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          addMembers: [{ userId: memberUserId, joinDate: memberJoinDate }],
        }),
      });

      if (joinRes.ok) {
        setShowAddMemberModal(false);
        setNewMemberName("");
        setNewMemberEmail("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveGroup = async (memberUserId: number) => {
    if (!confirm("Are you sure you want to set this member's leave date to today?")) return;
    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          removeMembers: [{ userId: memberUserId, leaveDate: new Date().toISOString() }],
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    // Elegant browser print trigger. Styled clean table is loaded when media = print is activated.
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="text-lg font-medium tracking-widest text-amber-600 dark:text-amber-500 animate-pulse">
          LOADING GROUP DASHBOARD...
        </div>
      </div>
    );
  }

  // Pre-seed chart data from balances
  const chartData = balances.map((b) => ({
    name: b.name,
    balance: Math.round(b.netBalance * 100) / 100,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex print:bg-white print:text-black transition-colors duration-200">
      {/* Sidebar Navigation */}
      <div className="print:hidden">
        <Sidebar currentGroupId={groupId} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 transition-all duration-300 print:pl-0 min-h-screen flex flex-col">
        {/* Main Print Layout (Hidden on screen) */}
        <div className="hidden print:block p-8">
          <h1 className="text-3xl font-serif font-bold text-black mb-2">Spreetail Expense Report</h1>
          <h2 className="text-xl text-zinc-700 mb-6">Group: {group?.name}</h2>
          <div className="mb-8">
            <h3 className="text-lg font-bold border-b pb-2 mb-4">Expenses Log</h3>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Payer</th>
                  <th className="py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {expensesList.map((exp) => (
                  <tr key={exp.id} className="border-b">
                    <td className="py-2">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-2">{exp.description}</td>
                    <td className="py-2">{exp.payerName}</td>
                    <td className="py-2 text-right">₹{Number(exp.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-lg font-bold border-b pb-2 mb-4">Net Balances</h3>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Paid</th>
                  <th className="py-2">Share</th>
                  <th className="py-2 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="py-2">{b.name}</td>
                    <td className="py-2">₹{b.totalPaid.toFixed(2)}</td>
                    <td className="py-2">₹{b.totalShare.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">
                      {b.netBalance >= 0 ? "+" : ""}₹{b.netBalance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Screen layout */}
        <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 print:hidden flex-1 space-y-8 animate-fade-in">
        <div className="flex flex-col gap-6">
          {/* Group Header Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <h1 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">{group?.name}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {group?.members.length} members tracking expenses together
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/groups/${groupId}/import`}
                className="rounded-lg border border-amber-600/40 bg-amber-50 dark:bg-amber-955/20 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-500 shadow-sm transition-all hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer"
              >
                Import CSV File
              </Link>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 cursor-pointer"
              >
                Add Expense
              </button>
              <button
                onClick={handleExportPDF}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-zinc-200 dark:border-zinc-900">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              {(["expenses", "balances", "members"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 py-4 px-1 text-sm font-semibold capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? "border-amber-500 text-amber-600 dark:text-amber-500"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-zinc-805 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content: Expenses */}
          {activeTab === "expenses" && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
              <h2 className="text-xl font-serif font-semibold mb-4 text-zinc-800 dark:text-zinc-200 text-left">Expenses Log</h2>
              {expensesList.length === 0 ? (
                <p className="text-center text-zinc-450 py-10">No expenses recorded yet. Import your CSV to populate!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-zinc-750 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-805 text-zinc-500 dark:text-zinc-400 font-semibold">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Payer</th>
                        <th className="pb-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesList.map((exp) => (
                        <tr key={exp.id} className="border-b border-zinc-150 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                          <td className="py-4 font-mono text-zinc-500 dark:text-zinc-405">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 font-medium text-zinc-800 dark:text-zinc-200">{exp.description}</td>
                          <td className="py-4 text-zinc-500 dark:text-zinc-405">{exp.payerName}</td>
                          <td className="py-4 text-right font-medium text-zinc-850 dark:text-zinc-200">
                            ₹{Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Balances */}
          {activeTab === "balances" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Balances List & Chart */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
                  <h2 className="text-xl font-serif font-semibold mb-6 text-zinc-800 dark:text-zinc-200 text-left">Group Balances</h2>
                  
                  {/* Recharts Net Balance Chart */}
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#27272a" : "#e4e4e7"} />
                        <XAxis type="number" stroke={theme === "dark" ? "#a1a1aa" : "#71717a"} />
                        <YAxis dataKey="name" type="category" stroke={theme === "dark" ? "#a1a1aa" : "#71717a"} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
                            borderColor: theme === "dark" ? "#27272a" : "#e4e4e7",
                            color: theme === "dark" ? "#f4f4f5" : "#09090b",
                          }}
                          itemStyle={{ color: "#d97706" }}
                        />
                        <Bar dataKey="balance" fill="#f59e0b">
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.balance >= 0 ? "#10b981" : "#ef4444"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Balances Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm text-zinc-750 dark:text-zinc-300">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-805 text-zinc-500 dark:text-zinc-400 font-semibold">
                          <th className="pb-3">Name</th>
                          <th className="pb-3 text-right">Paid</th>
                          <th className="pb-3 text-right">Share</th>
                          <th className="pb-3 text-right">Net Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedUserBreakdownId(b.id)}
                            className={`border-b border-zinc-150 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors ${
                              selectedUserBreakdownId === b.id ? "bg-zinc-100 dark:bg-zinc-900/40" : ""
                            }`}
                          >
                            <td className="py-4 font-semibold text-zinc-800 dark:text-zinc-200 flex flex-col text-left">
                              {b.name}
                              <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                                Click to view detailed ledger
                              </span>
                            </td>
                            <td className="py-4 text-right text-zinc-505 dark:text-zinc-400">
                              ₹{b.totalPaid.toFixed(2)}
                            </td>
                            <td className="py-4 text-right text-zinc-505 dark:text-zinc-400">
                              ₹{b.totalShare.toFixed(2)}
                            </td>
                            <td
                              className={`py-4 text-right font-bold ${
                                b.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                              }`}
                            >
                              {b.netBalance >= 0 ? "+" : ""}₹{b.netBalance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                {selectedUserBreakdownId && breakdown[selectedUserBreakdownId] && (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl animate-fade-in shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-serif font-semibold text-zinc-850 dark:text-zinc-200">
                        Detailed Ledger:{" "}
                        <span className="text-amber-600 dark:text-amber-500 font-sans font-bold">
                          {balances.find((b) => b.id === selectedUserBreakdownId)?.name}
                        </span>
                      </h2>
                      <button
                        onClick={() => setSelectedUserBreakdownId(null)}
                        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300 font-semibold cursor-pointer"
                      >
                        Hide details
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2 border-b border-zinc-150 dark:border-zinc-900 pb-1">
                          Expenses Ledger
                        </h3>
                        {breakdown[selectedUserBreakdownId].expenses.length === 0 ? (
                          <p className="text-xs text-zinc-450">No expense logs for this person.</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {breakdown[selectedUserBreakdownId].expenses.map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-100 dark:border-zinc-900/20"
                              >
                                <div className="flex flex-col">
                                  <span className="text-zinc-700 dark:text-zinc-250 font-medium">{entry.description}</span>
                                  <span className="text-xxs font-mono text-zinc-400 dark:text-zinc-500">
                                    {entry.date}
                                  </span>
                                </div>
                                <span
                                  className={
                                    entry.type === "paid" ? "text-emerald-600 dark:text-emerald-500 font-semibold" : "text-red-650 dark:text-red-400"
                                  }
                                >
                                  {entry.type === "paid" ? "+" : "-"}₹{entry.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-zinc-505 dark:text-zinc-400 mb-2 border-b border-zinc-150 dark:border-zinc-900 pb-1">
                          Settlements Ledger
                        </h3>
                        {breakdown[selectedUserBreakdownId].settlements.length === 0 ? (
                          <p className="text-xs text-zinc-450">No settlements logged.</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {breakdown[selectedUserBreakdownId].settlements.map((entry, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-100 dark:border-zinc-900/20"
                              >
                                <div className="flex flex-col">
                                  <span className="text-zinc-700 dark:text-zinc-250 font-medium">{entry.description}</span>
                                  <span className="text-xxs font-mono text-zinc-400 dark:text-zinc-500">
                                    {entry.date}
                                  </span>
                                </div>
                                <span
                                  className={
                                    entry.type === "paid" ? "text-emerald-600 dark:text-emerald-500 font-semibold" : "text-red-655 dark:text-red-400"
                                  }
                                >
                                  {entry.type === "paid" ? "+" : "-"}₹{entry.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settlements Summary Box */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl h-fit shadow-sm text-left">
                <h2 className="text-xl font-serif font-semibold mb-2 text-zinc-800 dark:text-zinc-200">Settle Debts</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-6">
                  Minimized payments to settle all debts with the fewest transactions.
                </p>

                {simplifiedPayments.length === 0 ? (
                  <p className="text-sm text-zinc-455 py-4 text-center">Everyone is fully settled!</p>
                ) : (
                  <div className="space-y-4">
                    {simplifiedPayments.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 shadow-sm"
                      >
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Transaction {idx + 1}
                        </span>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-505 dark:text-zinc-400">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.from}</span> pays
                            </span>
                            <span className="text-xs text-zinc-505 dark:text-zinc-400">
                              to <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.to}</span>
                            </span>
                          </div>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
                            ₹{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Members */}
          {activeTab === "members" && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-semibold text-zinc-800 dark:text-zinc-200">Group Members</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Add Member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-zinc-750 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-805 text-zinc-505 dark:text-zinc-400 font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Join Date</th>
                      <th className="pb-3">Leave Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group?.members.map((m) => (
                      <tr key={m.id} className="border-b border-zinc-150 dark:border-zinc-900/50">
                        <td className="py-4 font-semibold text-zinc-800 dark:text-zinc-200">{m.name}</td>
                        <td className="py-4 text-zinc-505 dark:text-zinc-400">{m.email}</td>
                        <td className="py-4 font-mono text-zinc-450 dark:text-zinc-500">
                          {new Date(m.joinDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 font-mono text-zinc-450 dark:text-zinc-500">
                          {m.leaveDate ? new Date(m.leaveDate).toLocaleDateString() : "Present"}
                        </td>
                        <td className="py-4 text-right">
                          {!m.leaveDate && m.name !== "Aisha" && (
                            <button
                              onClick={() => handleLeaveGroup(m.id)}
                              className="rounded bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 cursor-pointer"
                            >
                              Set Leave Date
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 text-left">Add Shared Expense</h2>
            <form onSubmit={handleAddExpense} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Swiggy dinner, Electricity"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                    Paid By
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {group?.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                  Split Type
                </label>
                <div className="mt-2 flex gap-4">
                  {(["equal", "percentage", "share"] as const).map((type) => (
                    <label key={type} className="flex items-center text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="splitType"
                        value={type}
                        checked={splitType === type}
                        onChange={() => setSplitType(type)}
                        className="mr-2 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400 mb-2">
                  Split With
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-950/50">
                  {group?.members.map((m) => {
                    const isSelected = selectedParticipants.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-zinc-700 dark:text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants((prev) => [...prev, m.id]);
                              } else {
                                setSelectedParticipants((prev) => prev.filter((id) => id !== m.id));
                              }
                            }}
                            className="mr-2 rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span>{m.name}</span>
                        </label>

                        {isSelected && splitType !== "equal" && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={splitType === "percentage" ? "%" : "shares"}
                              value={splitDetails[m.id] || ""}
                              onChange={(e) =>
                                setSplitDetails((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              className="w-20 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-right text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none"
                            />
                            <span className="text-xs text-zinc-500">
                              {splitType === "percentage" ? "%" : "share"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-750 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 cursor-pointer"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 text-left">Add Group Member</h2>
            <form onSubmit={handleAddMember} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                  Member Name
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Sam, Kabir"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                  Email address (Optional)
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. sam@spreetail.com"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">
                  Membership Join Date
                </label>
                <input
                  type="date"
                  required
                  value={memberJoinDate}
                  onChange={(e) => setMemberJoinDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-750 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 cursor-pointer"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
