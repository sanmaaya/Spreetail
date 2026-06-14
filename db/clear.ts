// db/clear.ts
import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf-8");
      envFile.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  } catch (err) {
    console.error("Failed to load .env file:", err);
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is missing!");
  process.exit(1);
}

console.log("Wiping database schema...");

const sql = neon(databaseUrl);

async function main() {
  try {
    // Recreate the public schema to drop all tables, views, types, etc.
    await sql("DROP SCHEMA public CASCADE");
    await sql("CREATE SCHEMA public");
    await sql("GRANT ALL ON SCHEMA public TO public");
    console.log("Database schema successfully wiped!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to wipe database schema:", error);
    process.exit(1);
  }
}

main();
