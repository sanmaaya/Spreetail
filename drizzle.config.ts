// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    // Vercel will inject DATABASE_URL at runtime
    url: process.env.DATABASE_URL!,
  },
});
