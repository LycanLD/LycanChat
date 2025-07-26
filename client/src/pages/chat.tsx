import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface ChatState {
  nickname: string | null;
  lastMessageTime: Date;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function generateAvatar(username: string): { letter: string; color: string } {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-orange-400 to-orange-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-pink-400 to-pink-600',
    'from-teal-400 to-teal-600'
  ];
  
  const colorIndex = username.charCodeAt(0) % colors.length;
  return {
    letter: username.charAt(0).toUpperCase(),
    color: colors[colorIndex]
  };
}

export default function Chat() {
  const [chatState, setChatState] = useState<ChatState>({
    nickname: null,
    lastMessageTime: new Date()
  });
  const [nicknameInput, setNicknameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [showRateLimit, setShowRateLimit] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for initial messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!chatState.nickname,
    refetchInterval: false,
  });

  // Polling query for new messages
  const { data: newMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages/poll', chatState.lastMessageTime.toISOString()],
    enabled: !!chatState.nickname && messages.length > 0,
    refetchInterval: 2000, // Poll every 2 seconds
    select: (data) => data || [],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/messages', {
        username: chatState.nickname,
        content: content.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      if (error.message.includes('429')) {
        setShowRateLimit(true);
        setTimeout(() => setShowRateLimit(false), 3000);
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Set nickname mutation
  const setNicknameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest('POST', '/api/validate-username', {
        username: username.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      setChatState({
        nickname: nicknameInput.trim(),
        lastMessageTime: new Date()
      });
      setNicknameInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Username",
        description: error.message || "Please choose a different username.",
        variant: "destructive",
      });
    },
  });

  // Update last message time when new messages arrive
  useEffect(() => {
    if (newMessages.length > 0) {
      const latestMessage = newMessages[newMessages.length - 1];
      setChatState(prev => ({
        ...prev,
        lastMessageTime: new Date(latestMessage.timestamp)
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  }, [newMessages, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Combine and sort all messages
  const allMessages = [...messages];

  const handleSetNickname = () => {
    const nickname = nicknameInput.trim();
    if (!nickname) return;
    
    if (nickname.length < 2 || nickname.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must be between 2 and 20 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores.",
        variant: "destructive",
      });
      return;
    }
    
    setNicknameMutation.mutate(nickname);
  };

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content || !chatState.nickname) return;
    
    if (content.length > 500) {
      toast({
        title: "Message Too Long",
        description: "Messages cannot exceed 500 characters.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatState.nickname) {
        handleSendMessage();
      } else {
        handleSetNickname();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-xl">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-comments text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold">FreeChat</h1>
              <p className="text-sm text-indigo-200">Public Chat Room</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-indigo-200">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Nickname Setup */}
      {!chatState.nickname && (
        <div className="p-6 border-b border-chat-border bg-blue-50/50">
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-chat-text mb-2">Choose Your Nickname</h2>
            <p className="text-sm text-gray-600 mb-4">Enter a nickname to start chatting with everyone!</p>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter your nickname..."
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={20}
                className="flex-1"
                data-testid="input-nickname"
              />
              <Button
                onClick={handleSetNickname}
                disabled={setNicknameMutation.isPending || !nicknameInput.trim()}
                className="px-4 py-2"
                data-testid="button-join-chat"
              >
                {setNicknameMutation.isPending ? "Joining..." : "Join Chat"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-container">
          {/* Welcome Message */}
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
              Welcome to FreeChat! Start a conversation with anyone.
            </div>
          </div>

          {/* Loading State */}
          {isLoading && chatState.nickname && (
            <div className="flex justify-center">
              <div className="text-gray-500 text-sm">Loading messages...</div>
            </div>
          )}

          {/* Messages */}
          {allMessages.map((message) => {
            const isOwnMessage = message.username === chatState.nickname;
            const avatar = generateAvatar(message.username);
            
            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : ''}`}
                data-testid={`message-${message.id}`}
              >
                {!isOwnMessage && (
                  <div className={`w-8 h-8 bg-gradient-to-br ${avatar.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {avatar.letter}
                  </div>
                )}
                
                <div className="flex-1 max-w-xs lg:max-w-md">
                  <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                    {!isOwnMessage && (
                      <span className="text-sm font-medium text-chat-text" data-testid={`username-${message.id}`}>
                        {message.username}
                      </span>
                    )}
                    <span className="text-xs text-gray-500" data-testid={`timestamp-${message.id}`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwnMessage && (
                      <span className="text-sm font-medium text-chat-text">You</span>
                    )}
                  </div>
                  <div className={`${
                    isOwnMessage 
                      ? 'bg-chat-sent text-white rounded-lg rounded-tr-sm ml-auto' 
                      : 'bg-chat-bubble border border-chat-border rounded-lg rounded-tl-sm'
                  } px-3 py-2 shadow-sm`}>
                    <p className={`text-sm ${isOwnMessage ? '' : 'text-chat-text'}`} data-testid={`content-${message.id}`}>
                      {message.content}
                    </p>
                  </div>
                </div>

                {isOwnMessage && (
                  <div className={`w-8 h-8 bg-gradient-to-br ${avatar.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {avatar.letter}
                  </div>
                )}
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {chatState.nickname && (
        <div className="border-t border-chat-border bg-white p-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={500}
                  className="w-full pr-12"
                  data-testid="input-message"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  <span data-testid="char-count">{messageInput.length}</span>/500
                </div>
              </div>
              
              {showRateLimit && (
                <div className="text-xs text-orange-600 mt-1" data-testid="rate-limit-warning">
                  <i className="fas fa-clock mr-1"></i>
                  Please wait a moment before sending another message.
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !messageInput.trim()}
              className="px-6 py-3"
              data-testid="button-send-message"
            >
              <i className="fas fa-paper-plane"></i>
              <span className="ml-2 hidden sm:inline">
                {sendMessageMutation.isPending ? "Sending..." : "Send"}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-500 text-white text-center py-2 text-sm" data-testid="connection-status">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Connection lost. Trying to reconnect...
        </div>
      )}
    </div>
  );
}
