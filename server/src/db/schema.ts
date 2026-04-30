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
  usedBy: integer("used_by").references(() => users.id),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityTypes = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  name: varchar("name", { length: 100 }).notNull(),
  defaultStars: integer("default_stars").notNull().default(1),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  childId: integer("child_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => activityTypes.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishes = pgTable("wishes", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  starCost: integer("star_cost"),
  isPersistent: boolean("is_persistent").notNull().default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  fulfilledAt: timestamp("fulfilled_at"),
  fulfilledForChildId: integer("fulfilled_for_child_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
