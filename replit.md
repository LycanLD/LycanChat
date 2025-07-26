# Chat Application

## Overview

This is a real-time chat application built with a modern full-stack architecture. The application features a React frontend with TypeScript, an Express.js backend, and uses PostgreSQL as the database with Drizzle ORM for database operations. The frontend is styled with Tailwind CSS and uses shadcn/ui components for a polished user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, Vite for building and development
- **Backend**: Express.js with TypeScript, serving both API endpoints and static assets
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state management

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for lightweight routing
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query for API calls and caching
- **Real-time Updates**: Socket.IO for instant message delivery and live features

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Socket.IO Integration**: Real-time bidirectional communication for instant messaging
- **Storage Layer**: PostgreSQL database with Drizzle ORM for persistent data storage
- **Rate Limiting**: Simple in-memory rate limiting for message posting
- **Development Setup**: Vite integration for development with HMR support

### Database Schema
The application defines two main entities:
- **Users**: Basic user accounts with username and password
- **Messages**: Chat messages with username, content, and timestamp
- **Schema Management**: Drizzle migrations in the `/migrations` directory

## Data Flow

1. **Message Creation**: Users post messages through the frontend form
2. **API Processing**: Backend validates message data and applies rate limiting
3. **Database Storage**: Messages are persisted to PostgreSQL database via Drizzle ORM
4. **Real-time Broadcasting**: Socket.IO instantly broadcasts new messages to all connected clients
5. **Display**: Messages are rendered with user avatars and timestamps
6. **Persistence**: Chat history is preserved across sessions and browser refreshes

### Authentication Flow
The application uses a simple nickname-based system with local storage persistence. Users enter a nickname which is saved locally for future sessions. Key features:
- **Session Persistence**: Nicknames are remembered across browser sessions
- **Logout Functionality**: Users can explicitly log out to change nicknames
- **Real-time Presence**: Live user count showing currently connected users

### File Sharing Features
The chat application supports rich media sharing with the following capabilities:
- **Image Upload**: Direct image sharing with thumbnail previews and full-size viewing
- **File Upload**: Support for documents, media files, and archives up to 10MB
- **Drag & Drop**: Intuitive drag-and-drop interface for file sharing
- **Base64 Storage**: Files are stored as base64 data URLs for simple memory-based persistence
- **Download Support**: One-click download functionality for shared files
- **File Type Validation**: Security filtering for allowed file types (images, documents, media)
- **Real-time Delivery**: Instant file sharing via Socket.IO broadcasting

## External Dependencies

### Core Libraries
- **React**: UI framework with hooks and context
- **Express**: Web framework for the backend API
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation for API inputs

### UI Dependencies
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities

### Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL)
- **Neon Database**: Serverless PostgreSQL driver for connection

## Deployment Strategy

### Development
- **Vite Dev Server**: Frontend development with HMR
- **Express Server**: Backend API serving on the same port
- **Environment**: Uses NODE_ENV=development for development-specific features

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets in production
- **Database**: Drizzle migrations can be applied with `npm run db:push`

### Key Configuration Files
- **drizzle.config.ts**: Database connection and migration settings
- **vite.config.ts**: Frontend build configuration with path aliases
- **tsconfig.json**: TypeScript configuration with monorepo paths
- **tailwind.config.ts**: Styling configuration with custom theme

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific configuration for development tools

The application is designed to be easily deployable on platforms like Replit, with automatic database provisioning and development tool integration.