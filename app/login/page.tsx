// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckIcon, QuoteIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
      } else {
        router.push("/groups");
        router.refresh();
      }
    } else {
      // Register logic
      try {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await regRes.json();
        if (!regRes.ok) {
          setError(data.error || "Registration failed.");
          setLoading(false);
          return;
        }

        // Auto login after signup
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          setError("Registration successful, but login failed. Please sign in manually.");
          setIsLogin(true);
          setLoading(false);
        } else {
          router.push("/groups");
          router.refresh();
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen bg-mesh-gradient text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 selection:bg-amber-600/30 selection:text-amber-700 dark:selection:text-amber-200">
      
      {/* Floating Header with back link and theme toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-550 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Left Pane (Visual Benefits Showcase - Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-zinc-200/50 dark:border-zinc-900/60 z-10">
        <div>
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500 text-glow-primary">
              Spreetail
            </span>
          </Link>
        </div>

        <div className="max-w-md space-y-6 text-left">
          <h2 className="font-serif text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Designed for shared spaces and roommates.
          </h2>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm font-light leading-relaxed">
            Spreetail brings transparency and elegance to roommate finances, turning complex spreadsheets into simple, beautiful balance sheets.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              "Sanitize unstructured CSV imports in seconds",
              "Minimize cash transfers with simplified settlements",
              "Enforce dynamic roommate join and leave bounds",
              "Verify data anomalies & duplicate entries",
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-light">
                <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-pulse-slow" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-900 bg-white/70 dark:bg-zinc-900/10 p-5 backdrop-blur-md shadow-sm">
          <QuoteIcon className="w-6 h-6 text-amber-600/40 dark:text-amber-500/40 mb-2" />
          <p className="text-xs italic text-zinc-650 dark:text-zinc-300 leading-relaxed font-light text-left">
            "Spreetail saved our flat's relationships. No more arguments over who paid for groceries or bills. The CSV import wizard is absolute magic."
          </p>
          <span className="block mt-2 text-xxs font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-450 text-left">
            Aisha, Roommate at Flat 4B
          </span>
        </div>
      </div>

      {/* Right Pane (Form Box) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-block">
              <span className="font-serif text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500 text-glow-primary">
                Spreetail
              </span>
            </Link>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white/80 dark:bg-zinc-900/40 p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="space-y-1 text-left">
              <h2 className="font-serif text-2xl font-bold text-zinc-850 dark:text-zinc-100 leading-tight">
                {isLogin ? "Welcome back" : "Create flat account"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 font-light">
                {isLogin ? "Enter your credentials to enter the flat workspace" : "Register a new account to begin tracking expenses"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/15 p-4.5 text-xs text-red-650 dark:text-red-400 font-light">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {!isLogin && (
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="e.g. Aisha"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-655 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 px-3.5 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-655 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-200 dark:border-zinc-900/60">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-xs text-zinc-550 dark:text-zinc-400 hover:text-amber-655 dark:hover:text-amber-500 transition-colors font-semibold cursor-pointer"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
