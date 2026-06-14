import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

let _db: any = null;

function getDbInstance() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Please set the environment variable."
      );
    }
    const sql = neon(connectionString);
    _db = drizzle(sql as any);
  }
  return _db;
}

// Export a lazy-loaded proxy for the database client to prevent Neon from
// throwing errors during Next.js build-time static page generation / module evaluation
// when DATABASE_URL is not defined in the environment.
export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
