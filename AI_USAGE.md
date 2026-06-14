# AI_USAGE.md — Spreetail AI Usage Log

This document details the AI tools utilized during the construction of Spreetail, the key prompts, and three concrete instances of AI hallucination/errors, how they were caught, and their resolutions.

---

## 1. AI Tools & Key Prompts

### AI Tools Used
- **Antigravity Pairing Assistant**: Designed by Google DeepMind, utilizing advanced Gemini architectures. Used for workspace analysis, database design, TypeScript implementation, and browser-driven visual layout verification.
- **Imagen 3**: Used for generating graphics assets (e.g., `roommates_collaborating.png`).

### Key Prompts
- *"Create a dynamic roommate split dashboard that supports dynamic join/leave dates, CSV ledger uploads, and debt simplification."*
- *"Make the landing page look exactly like this Pinterest pin UI (Optibiz) with play buttons, overlapping rating avatars, tilted preview cards, and roommate stats."*
- *"Ensure the entire website defaults to a premium white/light theme with a glassmorphism style, while keeping a theme toggle for users who prefer dark mode."*

---

## 2. Concrete Cases of AI Failures & Resolutions

### Case 1: NextAuth Edge Route Handlers TypeScript Error
- **The Error**: The AI generated a NextAuth API handler in `app/api/auth/[...nextauth]/route.ts` that exported routes via a spread operator:
  ```typescript
  export const { GET, POST } = handlers;
  ```
  In Next.js App Router API edge setups, this triggered a TypeScript compilation error because NextAuth's type definitions for REST handlers were mismatched with the spread operator signatures.
- **How Caught**: Caught during automated typechecking (`npx tsc --noEmit`) which reported:
  `Type error: Route handler exports must be valid HTTP methods.`
- **Resolution**: Changed the code to explicitly map and export the handlers:
  ```typescript
  export const GET = handlers.GET;
  export const POST = handlers.POST;
  ```
  This resolved the signature compiler mismatch.

### Case 2: Recharts Styling Theme-Sync Lag
- **The Error**: The AI initially set up static color parameters for the Recharts BarChart axes and grids (e.g., `#27272a` for lines). However, when the user clicked the global `ThemeToggle` button in the header, only the Tailwind classes on HTML elements shifted. The canvas-drawn SVG elements inside the Recharts wrapper remained stuck in their initial color mode, causing invisible grid lines and axis text.
- **How Caught**: Visual review via browser subagent screenshotting, revealing white axis texts against white backgrounds in light mode.
- **Resolution**: Implemented a `MutationObserver` in the dashboard mounting cycle:
  ```typescript
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  ```
  And bound chart styles to the reactive `theme` state.

### Case 3: Duplicate Closing Tags in Component Replacements
- **The Error**: During contiguous file content replacements on `components/landing-preview.tsx` and `app/login/page.tsx`, the AI replaced code but miscalculated line ranges, leaving trailing duplicate brackets and syntactical fragments (e.g., `);/div> }`).
- **How Caught**: Detected by the Next.js bundler compiler during background run commands (`npm run build`) which failed with parse syntax warnings.
- **Resolution**: Inspected the end of the files using `view_file` and ran a clean, targeted regex replacement to prune the trailing tags.

### Case 4: Neon Serverless Client and Drizzle Connection Failures on Build/Vercel
- **The Error**: The AI initialized Drizzle ORM and Neon client at the module's top level in `db/drizzle.ts`. This caused two compile-time failures:
  1. Under strict production dependency builds, TypeScript failed because `NeonQueryFunction<false, false>` was not assignable to `NeonClient`.
  2. Next.js static page evaluation during `next build` executed top-level server imports without environment variables present. Because `DATABASE_URL` was missing, calling `neon(undefined)` threw a runtime exception at import time: *"Error: No database connection string was provided to neon()."*
- **How Caught**: Identified via the Vercel/Netlify build log details:
  - `Type error: Argument of type 'NeonQueryFunction<false, false>' is not assignable to parameter of type 'NeonClient'.`
  - `"Error: No database connection string was provided to neon(). Perhaps an environment variable has not been set?"`
- **Resolution**: 
  1. Wrapped the database connection logic inside a lazy-getter function (`getDbInstance`).
  2. Exported a lazy-loaded ES6 `Proxy` wrapper: `export const db = new Proxy({} as any, { get(target, prop, receiver) { ... } })`. This intercepts Drizzle property access at query-time rather than import-time, bypassing build-time crashes.
  3. Added an explicit `as any` typecast for Neon queries within the lazy loader to circumvent client-declaration compatibility issues.
