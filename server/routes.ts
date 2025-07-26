import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Rate limiting map: username -> last message time
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1000; // 1 second between messages

export async function registerRoutes(app: Express): Promise<Server> {
  // Get recent messages
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages after a certain timestamp (for polling)
  app.get("/api/messages/poll", async (req, res) => {
    try {
      const after = req.query.after as string;
      if (!after) {
        return res.status(400).json({ message: "Missing 'after' timestamp parameter" });
      }
      
      const timestamp = new Date(after);
      if (isNaN(timestamp.getTime())) {
        return res.status(400).json({ message: "Invalid timestamp format" });
      }
      
      const messages = await storage.getMessagesAfter(timestamp);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new messages" });
    }
  });

  // Post a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Rate limiting check
      const now = Date.now();
      const lastMessageTime = rateLimitMap.get(messageData.username) || 0;
      
      if (now - lastMessageTime < RATE_LIMIT_MS) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before sending another message." 
        });
      }
      
      // Update rate limit tracking
      rateLimitMap.set(messageData.username, now);
      
      // Create message
      const message = await storage.createMessage(messageData);
      
      // Emit the new message to all connected clients via Socket.IO
      if ((globalThis as any).io) {
        (globalThis as any).io.emit('new_message', message);
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Validate username availability
  app.post("/api/validate-username", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      if (username.length < 2 || username.length > 20) {
        return res.status(400).json({ 
          message: "Username must be between 2 and 20 characters" 
        });
      }
      
      // Check if username contains only alphanumeric characters and underscores
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ 
          message: "Username can only contain letters, numbers, and underscores" 
        });
      }
      
      res.json({ valid: true, message: "Username is valid" });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate username" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store io instance globally for use in routes
  (globalThis as any).io = io;

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Send initial user count
    io.emit('user_count', io.engine.clientsCount);
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      io.emit('user_count', io.engine.clientsCount);
    });

    // Handle user joining chat
    socket.on('join_chat', (username) => {
      socket.data.username = username;
      socket.broadcast.emit('user_joined', { username, timestamp: new Date() });
    });

    // Handle typing indicators
    socket.on('typing_start', (username) => {
      socket.broadcast.emit('user_typing', { username, typing: true });
    });

    socket.on('typing_stop', (username) => {
      socket.broadcast.emit('user_typing', { username, typing: false });
    });
  });

  return httpServer;
}
