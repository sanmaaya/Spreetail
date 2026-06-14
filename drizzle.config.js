// drizzle.config.js
module.exports = {
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    // Vercel will provide DATABASE_URL at runtime
    url: process.env.DATABASE_URL,
  },
};
