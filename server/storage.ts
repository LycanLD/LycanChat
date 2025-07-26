import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  getMessagesAfter(timestamp: Date): Promise<Message[]>;
}

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

export const storage = new MemStorage();
