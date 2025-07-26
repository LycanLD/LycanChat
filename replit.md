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
- **Real-time Updates**: Polling-based message updates using React Query

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Storage Layer**: Abstracted storage interface with in-memory implementation (ready for database integration)
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
3. **Storage**: Messages are stored using the storage abstraction layer
4. **Real-time Updates**: Frontend polls for new messages using React Query
5. **Display**: Messages are rendered with user avatars and timestamps

### Authentication Flow
Currently, the application uses a simple nickname-based system without persistent authentication. Users enter a nickname to participate in chat.

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