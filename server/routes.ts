import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Rate limiting map: username -> last message time
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1000; // 1 second between messages

// Track users who have already joined to prevent duplicate notifications
const joinedUsers = new Set<string>();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|doc|docx|zip|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, and media files are allowed!'));
    }
  }
});

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
      let { username } = req.body;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Trim whitespace
      username = username.trim();
      
      if (username.length < 1 || username.length > 20) {
        return res.status(400).json({ 
          message: "Username must be between 1 and 20 characters" 
        });
      }
      
      // Check if username contains only alphanumeric characters, underscores, and basic punctuation
      if (!/^[a-zA-Z0-9_\-\s]+$/.test(username)) {
        return res.status(400).json({ 
          message: "Username can only contain letters, numbers, spaces, underscores, and hyphens" 
        });
      }
      
      res.json({ valid: true, message: "Username is valid" });
    } catch (error) {
      console.error('Username validation error:', error);
      res.status(500).json({ message: "Failed to validate username" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Convert file to base64 for storage in memory
      const fileBase64 = req.file.buffer.toString('base64');
      const fileUrl = `data:${req.file.mimetype};base64,${fileBase64}`;
      
      // Determine message type
      const isImage = req.file.mimetype.startsWith('image/');
      const messageType = isImage ? 'image' : 'file';
      
      // Format file size
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Create message with file data
      const messageData = {
        username,
        content: req.file.originalname, // Use filename as content
        type: messageType as "text" | "image" | "file",
        fileName: req.file.originalname,
        fileSize: formatFileSize(req.file.size),
        fileUrl: fileUrl
      };

      const message = await storage.createMessage(messageData);
      
      // Emit the new message to all connected clients via Socket.IO
      if ((globalThis as any).io) {
        (globalThis as any).io.emit('new_message', message);
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload file" });
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
      
      // Clean up joined users tracking when user disconnects
      // Only remove if no other socket has this username
      if (socket.data.username) {
        const userSockets = Array.from(io.sockets.sockets.values())
          .filter(s => s.data.username === socket.data.username && s.id !== socket.id);
        
        if (userSockets.length === 0) {
          joinedUsers.delete(socket.data.username);
        }
      }
      
      io.emit('user_count', io.engine.clientsCount);
    });

    // Handle user joining chat
    socket.on('join_chat', (username) => {
      socket.data.username = username;
      
      // Only emit join notification if this is a new user
      if (!joinedUsers.has(username)) {
        joinedUsers.add(username);
        socket.broadcast.emit('user_joined', { username, timestamp: new Date() });
      }
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
