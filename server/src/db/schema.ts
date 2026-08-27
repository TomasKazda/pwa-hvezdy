import { pgTable, serial, varchar, text, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["parent", "child"]);

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
  familyId: integer("family_id").references(() => families.id),
  role: userRoleEnum("role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const childInvitations = pgTable("child_invitations", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  familyId: integer("family_id").notNull().references(() => families.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityTypes = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  name: varchar("name", { length: 100 }).notNull(),
  value: integer("value").notNull().default(1),
  direction: varchar("direction", { length: 10 }).notNull().default("plus"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishes = pgTable("wishes", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  starCost: integer("star_cost"),
  isPersistent: boolean("is_persistent").notNull().default(false),
  isSelfFulfillment: boolean("is_self_fulfillment").notNull().default(false),
  multiplier: integer("multiplier").notNull().default(1),
  webhookUrl: text("webhook_url"),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  webhookParamName: varchar("webhook_param_name", { length: 100 }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  childId: integer("child_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  wishId: integer("wish_id"),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
