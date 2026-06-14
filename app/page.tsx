import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { LandingPreview } from "@/components/landing-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  FileTextIcon,
  PieChartIcon,
  Share1Icon,
  PlayIcon,
  StarFilledIcon,
  CheckIcon,
  CardStackIcon,
  LockClosedIcon,
  DashboardIcon,
  MobileIcon,
  LightningBoltIcon,
} from "@radix-ui/react-icons";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-mesh-gradient text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 selection:bg-amber-600/30 selection:text-amber-700 dark:selection:text-amber-200">
      {/* Navigation Header */}
      <header className="mx-auto max-w-7xl px-6 lg:px-8 h-20 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900/60 sticky top-0 z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 shadow-sm">
            <Share1Icon className="w-5 h-5 animate-pulse-slow" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500 text-glow-primary">
            Spreetail
          </span>
        </div>

        {/* Desktop Nav Links - Optibiz style */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          <a href="#" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Home</a>
          <a href="#features" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Features</a>
          <a href="#about" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Our Algorithm</a>
          <a href="#stats" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Statistics</a>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <Link
              href="/groups"
              className="rounded-xl bg-amber-600 px-4.5 py-2 text-sm font-bold text-white transition-all hover:bg-amber-700 hover:scale-[1.02] shadow-md shadow-amber-600/10"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-zinc-600 dark:text-zinc-450 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 px-4.5 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-200 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-[1.02] shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Redefining Roommate Finances
            </div>
            
            <div className="space-y-5">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-zinc-900 dark:text-zinc-50">
                Settle Roommate Expenses <br />
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent text-glow-primary">
                  Without the Stress.
                </span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl font-light leading-relaxed">
                Premium, high-performance shared expense management tailored for modern roommate groups. programmatically resolve complex balances, upload roommate CSV ledger sheets, and settle debts in a click.
              </p>
            </div>

            {/* CTAs Row - Pinterest Play Button Style */}
            <div className="flex flex-wrap items-center gap-5 pt-2">
              {session ? (
                <Link
                  href="/groups"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6.5 py-3.5 text-sm font-bold text-white transition-all hover:bg-amber-700 hover:scale-[1.02] shadow-lg shadow-amber-600/10 group"
                >
                  Enter Your Dashboard
                  <ArrowRightIcon className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6.5 py-3.5 text-sm font-bold text-white transition-all hover:bg-amber-700 hover:scale-[1.02] shadow-lg shadow-amber-600/10 group"
                  >
                    Get Started Free
                    <ArrowRightIcon className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#about"
                    className="inline-flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors group"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-amber-600/10 dark:hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-zinc-500 dark:text-zinc-400 group-hover:text-amber-555 group-hover:scale-105">
                      <PlayIcon className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                    How Does It Work?
                  </a>
                </>
              )}
            </div>

            {/* Social Proof Review Widget */}
            <div className="flex items-center gap-4 border-t border-zinc-200/80 dark:border-zinc-900/80 pt-6 max-w-lg">
              {/* Overlapping Roommate Avatars */}
              <div className="flex -space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-xxs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  AI
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xxs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  RO
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xxs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  PR
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 text-xxs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  ME
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-xxs font-bold text-zinc-500 dark:text-zinc-400 ring-2 ring-white dark:ring-zinc-950">
                  +3
                </div>
              </div>
              
              <div className="space-y-0.5">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <StarFilledIcon key={i} className="w-4 h-4" />
                  ))}
                </div>
                <p className="text-xxs font-medium text-zinc-500 dark:text-zinc-400 leading-normal">
                  Trusted by roommates sharing flats in Mumbai, Delhi & Bangalore.
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Preview Column - Tilted Frame */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500 to-emerald-500 opacity-20 dark:opacity-30 blur-2xl pointer-events-none" />
            <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/20 p-2 shadow-2xl backdrop-blur-sm lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <LandingPreview />
              
              {/* Floating Badges */}
              <div className="absolute -top-6 -left-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-4 py-2.5 shadow-lg backdrop-blur-md hidden sm:flex items-center gap-2.5 animate-pulse-slow">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="text-xxs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Aisha Balances</span>
                  <p className="text-emerald-500 font-bold font-serif">+₹24,850</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-4 py-2.5 shadow-lg backdrop-blur-md hidden sm:flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-lg bg-amber-600/10 flex items-center justify-center text-amber-600 dark:text-amber-500">
                  <CheckIcon className="w-4 h-4" />
                </div>
                <div className="text-xxs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Simplified Settlement</span>
                  <p className="text-zinc-500 dark:text-zinc-450">Priya pays Aisha ₹11,620</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid Section - Consulting-Style Cards */}
        <section id="features" className="py-20 border-t border-zinc-200/80 dark:border-zinc-900/80 mt-16 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">How we help</span>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Engineered for Roommate Harmony
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              Tackle roommate balances, complex currency rates, and dynamic roommate transition dates effortlessly.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-zinc-900/10 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900/30 hover:shadow-lg dark:hover:shadow-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/10 text-amber-600 dark:text-amber-500 mb-6">
                <Share1Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-serif">Dynamic Tenancies</h3>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                Roommates joining or leaving mid-term? Spreetail tracks exact active tenancy dates so Meera only splits rent for the days she lived, and Sam is only billed after moving in.
              </p>
              <a href="#about" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                Learn More <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-zinc-900/10 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900/30 hover:shadow-lg dark:hover:shadow-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 mb-6">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-serif">Smart CSV Wizard</h3>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                Upload raw roommate spreadsheets. Our smart engine auto-sanitizes name discrepancies (e.g. "priya s" vs "Priya"), identifies duplicate rows, and flags billing conflicts.
              </p>
              <a href="#about" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                Learn More <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-zinc-900/10 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900/30 hover:shadow-lg dark:hover:shadow-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-500 mb-6">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-serif">Debt Minimization</h3>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                Uses matrix minimization algorithms to settle all roommate balances with the fewest possible transactions. No recursive bank transfers required.
              </p>
              <a href="#about" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                Learn More <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Split Section: About Spreetail / Core Engine */}
        <section id="about" className="py-20 border-t border-zinc-200/80 dark:border-zinc-900/80 space-y-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Image Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src="/roommates_collaborating.png"
                  alt="Roommates happily managing expenses in apartment"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 bg-emerald-500 text-white text-xxs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Active Roommates Ledger
                </div>
              </div>
            </div>

            {/* Right Text Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Our Core Engine</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                The Best Roommate Settlement Algorithm In Town
              </h2>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                Spreetail uses matrix minimization algorithms to optimize peer-to-peer roommate debts. Instead of multiple circular bank transfers (e.g. Priya pays Rohan, Rohan pays Aisha, Aisha pays Priya), the engine collapses all transactions to the minimum necessary flow.
              </p>

              {/* Checklist */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Dynamic Tenancy Tracking</span>
                    <p className="text-zinc-500 dark:text-zinc-450 mt-0.5">Only pay for the days you are active in the group. No more split disagreements on roommates visiting for the weekend or moving out early.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Automated Name Sanitization</span>
                    <p className="text-zinc-500 dark:text-zinc-450 mt-0.5">Resolves casing and spacing discrepancies on import, mapping "priya s", "Priya", and "Priya S" to the same registered member.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Duplicate Rows & Conflict Resolution</span>
                    <p className="text-zinc-500 dark:text-zinc-450 mt-0.5">Detects identical rows entered twice by error and flags potential payment payer discrepancies during upload.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-5 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all hover:scale-[1.02] inline-block shadow-sm"
                >
                  Explore the Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="stats" className="py-16 border-t border-zinc-200/80 dark:border-zinc-900/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-black text-amber-600 dark:text-amber-500 text-glow-primary">100%</div>
              <p className="text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Accuracy Guaranteed</p>
              <p className="text-xxs text-zinc-500 max-w-xs mx-auto font-light leading-normal">On splits and calculations.</p>
            </div>
            
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-black text-amber-600 dark:text-amber-500 text-glow-primary">3-Step</div>
              <p className="text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">CSV Import Wizard</p>
              <p className="text-xxs text-zinc-500 max-w-xs mx-auto font-light leading-normal">Upload, sanitize, and verify.</p>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-black text-amber-600 dark:text-amber-500 text-glow-primary">&lt; 1 Min</div>
              <p className="text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Debts Settlement</p>
              <p className="text-xxs text-zinc-500 max-w-xs mx-auto font-light leading-normal">Instant settlement outputs.</p>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-serif font-black text-amber-600 dark:text-amber-500 text-glow-primary">₹0 Fees</div>
              <p className="text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Completely Free</p>
              <p className="text-xxs text-zinc-500 max-w-xs mx-auto font-light leading-normal">No ads, no hidden costs.</p>
            </div>
          </div>
        </section>

        {/* Secondary Features Grid - 6 Items */}
        <section className="py-20 border-t border-zinc-200/80 dark:border-zinc-900/80 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">More Benefits</span>
            <h2 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              A Complete Roommate Financial Tool
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              Crafted with developer-grade security and modern responsive layout controls.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. PDF Reports */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <FileTextIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">PDF Ledger Export</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-light">Export complete ledger details and calculated Settlements into high-fidelity PDF documents to archive flat databases.</p>
            </div>

            {/* 2. Bcrypt Secure */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <LockClosedIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Secure Password Hashing</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-455 mt-1 leading-relaxed font-light">All roommate logins are verified utilizing secure bcrypt hashing schemes. We respect personal security protocols.</p>
            </div>

            {/* 3. Recharts Dashboard */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <DashboardIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Interactive Balance Chart</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-light">Review roommate spends and settlement balances graphically utilizing interactive Recharts elements inside the dashboard.</p>
            </div>

            {/* 4. SQLite/PostgreSQL resilience */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <CardStackIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Neon serverless DB</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-light">Hosted on modern Drizzle ORM and Neon Postgres DB, providing highly durable data retention for all roommate assets.</p>
            </div>

            {/* 5. Mobile Layout */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <MobileIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Mobile Responsive Navigation</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-light">Responsive layout featuring a collapsible desktop sidebar that adjusts cleanly on tablets and mobile screens.</p>
            </div>

            {/* 6. High-Performance */}
            <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-900/60 bg-white/30 dark:bg-zinc-900/10 p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <LightningBoltIcon className="w-5 h-5 text-amber-600 dark:text-amber-500 mb-3" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Fast Turbopack Loading</h4>
              <p className="text-xxs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-light">Built on the latest Next.js 16 frameworks, ensuring sub-second rendering times, fast page transitions, and hydration resilience.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200/80 dark:border-zinc-900/80 pt-10 pb-6 text-center text-xs text-zinc-500 dark:text-zinc-600 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <span className="font-serif font-bold text-zinc-800 dark:text-zinc-300">Spreetail</span>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <span>Accurate Roommate Expenses</span>
          </div>
          <p>© 2026 Spreetail. Crafted with pair programming excellence.</p>
        </footer>
      </main>
    </div>
  );
}
