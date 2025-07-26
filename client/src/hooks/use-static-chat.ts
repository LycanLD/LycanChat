import { useState, useEffect } from 'react';
import type { Message } from '@shared/schema';

interface StaticChatState {
  messages: Message[];
  isConnected: boolean;
  userCount: number;
}

export function useStaticChat() {
  const [state, setState] = useState<StaticChatState>({
    messages: [],
    isConnected: false,
    userCount: 1
  });

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('lycanchat-messages');
    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages);
        setState(prev => ({ ...prev, messages }));
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }
  }, []);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setState(prev => {
      const updatedMessages = [...prev.messages, newMessage];
      // Keep only last 100 messages for performance
      const trimmedMessages = updatedMessages.slice(-100);
      
      // Save to localStorage
      localStorage.setItem('lycanchat-messages', JSON.stringify(trimmedMessages));
      
      return { ...prev, messages: trimmedMessages };
    });

    return newMessage;
  };

  const clearMessages = () => {
    setState(prev => ({ ...prev, messages: [] }));
    localStorage.removeItem('lycanchat-messages');
  };

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    userCount: state.userCount,
    addMessage,
    clearMessages,
  };
}