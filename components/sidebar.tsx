"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  LayersIcon,
  FileTextIcon,
  GearIcon,
  ExitIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

interface Group {
  id: number;
  name: string;
}

export function Sidebar({ currentGroupId }: { currentGroupId?: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groups");
        if (res.ok) {
          const data = await res.json();
          setGroups(data);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar groups:", err);
      } finally {
        setLoading(false);
      }
    }
    if (session) {
      fetchGroups();
    }
  }, [session]);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  const menuItems = [
    {
      name: "Dashboard",
      href: "/groups",
      icon: <LayersIcon className="w-5 h-5" />,
      active: pathname === "/groups",
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-zinc-200 dark:border-zinc-900 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } h-screen`}
    >
      {/* Header / Brand */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-900">
        <Link href="/groups" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-amber-500 text-glow-primary">
            {isCollapsed ? "S" : "Spreetail"}
          </span>
        </Link>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute left-6 top-5 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapsed ThemeToggle support */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 border-b border-zinc-200 dark:border-zinc-900">
          <ThemeToggle />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                item.active
                  ? "bg-amber-600/10 text-amber-550 dark:text-amber-500 border border-amber-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
              }`}
            >
              <div className={item.active ? "text-amber-550 dark:text-amber-500" : "text-zinc-400"}>
                {item.icon}
              </div>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* Dynamic Groups list */}
        <div className="pt-6">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xxs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Your Shared Rooms
              </span>
            </div>
          )}

          <div className="space-y-1">
            {loading ? (
              !isCollapsed && (
                <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-650 animate-pulse">
                  Loading flats...
                </div>
              )
            ) : groups.length === 0 ? (
              !isCollapsed && (
                <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-600">
                  No rooms created.
                </div>
              )
            ) : (
              groups.map((group) => {
                const isActive = currentGroupId === group.id;
                return (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-zinc-150 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-250 dark:border-zinc-800 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/30 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-amber-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{group.name}</span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* User profile section */}
      <div className="border-t border-zinc-200 dark:border-zinc-900 p-4 bg-zinc-50/40 dark:bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-xs font-bold text-amber-550 dark:text-amber-500 font-serif">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 bg-emerald-500 text-glow-secondary" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {session?.user?.name || "Roommate"}
              </h2>
              <p className="text-xxs text-zinc-400 dark:text-zinc-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-900 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <ExitIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
