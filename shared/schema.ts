import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull().default("text"), // "text", "image", "file"
  fileName: text("file_name"),
  fileSize: text("file_size"),
  fileUrl: text("file_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  username: true,
  content: true,
  type: true,
  fileName: true,
  fileSize: true,
  fileUrl: true,
}).extend({
  content: z.string().min(0, "").max(500, "Message too long"),
  username: z.string().min(2, "Username must be at least 2 characters").max(20, "Username too long"),
  type: z.enum(["text", "image", "file"]).default("text"),
  fileName: z.string().optional(),
  fileSize: z.string().optional(),
  fileUrl: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
