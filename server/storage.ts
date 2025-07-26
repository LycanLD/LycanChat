import { type User, type InsertUser, type Message, type InsertMessage, users, messages } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { desc, gt, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  getMessagesAfter(timestamp: Date): Promise<Message[]>;
}

// PostgreSQL implementation
export class PgStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await this.db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    const result = await this.db.select()
      .from(messages)
      .orderBy(desc(messages.timestamp))
      .limit(limit);
    
    // Return in ascending order (oldest to newest)
    return result.reverse();
  }

  async getMessagesAfter(timestamp: Date): Promise<Message[]> {
    const result = await this.db.select()
      .from(messages)
      .where(gt(messages.timestamp, timestamp))
      .orderBy(messages.timestamp);
    
    return result;
  }
}

// In-memory implementation (fallback)
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Message[];

  constructor() {
    this.users = new Map();
    this.messages = [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      type: insertMessage.type || "text",
      fileName: insertMessage.fileName || null,
      fileSize: insertMessage.fileSize || null,
      fileUrl: insertMessage.fileUrl || null,
    };
    this.messages.push(message);
    
    // Keep only last 1000 messages to prevent memory issues
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    
    return message;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    return this.messages
      .slice(-limit)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMessagesAfter(timestamp: Date): Promise<Message[]> {
    return this.messages
      .filter(message => message.timestamp > timestamp)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// Use memory storage for simple, ephemeral chat experience
export const storage = new MemStorage();
