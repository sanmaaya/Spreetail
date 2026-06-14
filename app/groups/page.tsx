// app/groups/page.tsx
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import {
  PlusIcon,
  DashboardIcon,
  ActivityLogIcon,
  ChevronRightIcon,
  GroupIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

interface Group {
  id: number;
  name: string;
  createdAt: string;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchGroups();
    }
  }, [status, router]);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        setGroups((prev) => [...prev, newGroup]);
        setNewGroupName("");
        setShowModal(false);
        router.push(`/groups/${newGroup.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="text-sm font-semibold tracking-widest text-amber-600 dark:text-amber-500 animate-pulse uppercase">
          Initializing Spreetail Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex selection:bg-amber-600/30 selection:text-amber-700 dark:selection:text-amber-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 transition-all duration-300 min-h-screen flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 space-y-10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-900 pb-8">
            <div className="space-y-1.5 text-left">
              <h1 className="text-3xl font-serif font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Your Shared Rooms
              </h1>
              <p className="text-xs text-zinc-505 dark:text-zinc-400 font-light max-w-2xl">
                Choose a flat workspace to manage roommates' shared ledgers, settle pending cash balances, or upload new raw log files.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] transition-all self-start sm:self-auto cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Create New Group
            </button>
          </div>

          {/* Quick Statistics Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-5 backdrop-blur-md flex items-center gap-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                <DashboardIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-zinc-500 dark:text-zinc-450 font-medium">Active Shared Rooms</div>
                <div className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-200 mt-0.5">{groups.length}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-5 backdrop-blur-md flex items-center gap-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                <ActivityLogIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-zinc-500 dark:text-zinc-450 font-medium">System Ledger Status</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-500 text-glow-secondary font-serif mt-0.5">Secure & Active</div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-5 backdrop-blur-md flex items-center gap-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                <InfoCircledIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-zinc-500 dark:text-zinc-450 font-medium">Roommate Operations</div>
                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-1">Join/Leave boundaries ready</div>
              </div>
            </div>
          </div>

          {/* Groups List */}
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-250 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 py-20 text-center space-y-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-650 shadow-sm">
                <DashboardIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No rooms tracked yet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 font-light font-sans">
                  Create a dedicated workspace group for your flat-mates, household bills, or group trips to get started.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Initialize First Group
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const groupInitials = group.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    href={`/groups/${group.id}`}
                    key={group.id}
                    className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-md shadow-sm dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 flex flex-col justify-between h-44 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 font-serif font-bold text-lg text-glow-primary animate-pulse-slow">
                        {groupInitials}
                      </div>
                      <span className="text-xxs text-zinc-500 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/40 px-2.5 py-1 rounded-lg font-mono">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-left pt-4">
                      <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors flex items-center gap-1.5 leading-tight">
                        {group.name}
                        <ChevronRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-600 dark:text-amber-500" />
                      </h2>
                      <p className="text-xxs text-zinc-500 dark:text-zinc-450 font-light truncate">
                        Click to view roommate logs, split metrics, and settlement paths
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8 border-t border-zinc-200 dark:border-zinc-900/60 text-center text-xs text-zinc-500 mt-10">
          <p>© 2026 Spreetail room manager. Encrypted session-secured database.</p>
        </footer>
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-2xl animate-slide-up space-y-4">
            <div className="space-y-1 text-left">
              <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">Initialize shared room</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 font-light">
                Give your flat group a descriptive name. You can add your flatmates immediately afterwards.
              </p>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-5">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Flat 4B, Goa Trip 2026"
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
