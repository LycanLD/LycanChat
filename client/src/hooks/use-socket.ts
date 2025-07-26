import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '@shared/schema';

interface SocketEvents {
  new_message: (message: Message) => void;
  user_count: (count: number) => void;
  user_joined: (data: { username: string; timestamp: Date }) => void;
  user_typing: (data: { username: string; typing: boolean }) => void;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socketInstance = io({
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('user_count', (count: number) => {
      setUserCount(count);
    });

    socketInstance.on('user_typing', (data: { username: string; typing: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.typing) {
          newSet.add(data.username);
        } else {
          newSet.delete(data.username);
        }
        return newSet;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinChat = (username: string) => {
    socket?.emit('join_chat', username);
  };

  const startTyping = (username: string) => {
    socket?.emit('typing_start', username);
  };

  const stopTyping = (username: string) => {
    socket?.emit('typing_stop', username);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (username: string) => {
    startTyping(username);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(username);
    }, 2000);
  };

  const onNewMessage = (callback: (message: Message) => void) => {
    socket?.on('new_message', callback);
    return () => socket?.off('new_message', callback);
  };

  const onUserJoined = (callback: (data: { username: string; timestamp: Date }) => void) => {
    socket?.on('user_joined', callback);
    return () => socket?.off('user_joined', callback);
  };

  return {
    socket,
    isConnected,
    userCount,
    typingUsers,
    joinChat,
    handleTyping,
    stopTyping,
    onNewMessage,
    onUserJoined,
  };
}