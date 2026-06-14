// db/schema.ts
import { pgTable, serial, varchar, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Memberships allow join/leave dates for dynamic group composition
export const groupMemberships = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinDate: timestamp("join_date").notNull(),
  leaveDate: timestamp("leave_date"), // nullable means still a member
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenseItems = pgTable("expense_items", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").references(() => expenses.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  share: numeric("share", { precision: 12, scale: 2 }).notNull(),
});

export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settled: boolean("settled").default(false).notNull(),
});

// Import tracking tables
export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
});

export const importErrors = pgTable("import_errors", {
  id: serial("id").primaryKey(),
  importId: integer("import_id").references(() => imports.id).notNull(),
  rowNumber: integer("row_number").notNull(),
  columnName: varchar("column_name", { length: 50 }).notNull(),
  message: varchar("message", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 10 }).notNull().default("warning"),
});

// Optional table to store currency conversion rates (future feature)
export const currencyRates = pgTable("currency_rates", {
  currency: varchar("currency", { length: 10 }).primaryKey(),
  rateToINR: numeric("rate_to_inr", { precision: 12, scale: 6 }).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});
