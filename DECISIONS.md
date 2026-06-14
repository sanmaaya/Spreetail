# DECISIONS.md — Spreetail Decision Log

This document tracks the key engineering and design decisions made during the development of Spreetail, the options considered, and the rationales.

---

## 1. Dynamic Roommate Membership Bounds

### Problem Context
In roommate situations, members join and leave at different times (e.g., Meera moved out March 31, 2026; Sam joined April 8, 2026). Charging a roommate for expenses incurred when they were not living in the house leads to unfair splits and social friction.

### Options Considered
- **Option A: Static Group Composition**
  - All group members are split on all expenses. Any roommate who leaves must be deleted from the group, which breaks history, or left in the group, which charges them forever.
- **Option B: Date-Aware Dynamic Membership (Selected)**
  - Store a `joinDate` and a nullable `leaveDate` on a `group_memberships` joining table. When an expense is added or imported, the system computes the split only among roommates whose residency overlaps with the transaction date.

### Rationale
Option B represents the correct real-world behavior. It prevents invalid splits automatically and preserves historical ledger integrity when roommates move.

---

## 2. Interactive CSV Import Ingestion Workflow

### Problem Context
CSV logs recorded by roommates are notoriously messy, containing duplicates, missing details, multiple currencies, and conflicting logs (e.g., Aisha claiming a Thalassa dinner cost ₹2400, while Rohan claims it was ₹2450).

### Options Considered
- **Option A: Fail-Fast Validation**
  - Reject the entire CSV if a single syntax error, duplicate, or missing field is found.
- **Option B: Silent Auto-Correction**
  - Import everything and silently fix minor errors (like comma numbers), while guessing resolutions for duplicates or conflicts.
- **Option C: Interactive Resolution Wizard (Selected)**
  - Parse the file, apply sanitization logic, and return a report listing Warnings, Duplicates, and Conflicts. Allow the user to check duplicates to keep or choose which conflict claim (Row A vs. Row B) is correct before saving.

### Rationale
Option C ensures maximum data integrity. Direct cash splits are sensitive; roommates must have clear oversight of how their ledger resolves data conflicts rather than letting an algorithm make silent guesses.

---

## 3. Tech Stack: Next.js + Drizzle ORM + Tailwind CSS v4

### Problem Context
The application needs a modern web framework, an interactive frontend, dynamic charts, database connectivity, and session-secured authentication.

### Options Considered
- **Option A: Next.js + Drizzle ORM + Tailwind CSS (Selected)**
  - Next.js (App Router) for server rendering and API endpoints. Drizzle ORM for TypeScript-first, fast database querying. Tailwind CSS v4 for clean, utility-first styling.
- **Option B: Next.js + Prisma ORM + Tailwind CSS**
  - Prisma is robust but creates a heavier client bundle and slower cold-start query executions compared to Drizzle's direct SQL-like queries.

### Rationale
Option A provides the best developer experience, high performance, type safety, and compiles rapidly, meeting Next.js App Router guidelines.

---

## 4. Theme System: Glassmorphism White Theme Default

### Problem Context
The user requested a premium, white-theme-first landing page and dashboard matching a Pinterest visual style, with support for dark mode toggling.

### Options Considered
- **Option A: Exclusive White Theme**
  - Build only light-mode styles, removing dark mode classes entirely.
- **Option B: Theme-Aware Variable System (Selected)**
  - Configure default CSS variables mapping to off-whites and slate grays, with `.dark` overrides. Implement a mutation observer on the dashboard page to dynamically adjust Recharts canvas fill colors.

### Rationale
Option B keeps the system flexible (as requested by the user during pair-programming interviews) while guaranteeing that the default load is a beautiful, high-contrast light theme.
