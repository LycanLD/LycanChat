import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSocket } from "@/hooks/use-socket";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSelector } from "@/components/language-selector";
import { Plus, Download, Image, FileText, Upload } from "lucide-react";
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
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { 
    isConnected, 
    userCount, 
    typingUsers, 
    joinChat, 
    handleTyping, 
    stopTyping, 
    onNewMessage, 
    onUserJoined 
  } = useSocket();

  // Query for initial messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!chatState.nickname,
    refetchInterval: false,
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
      stopTyping(chatState.nickname!);
    },
    onError: (error: any) => {
      if (error.message.includes('429')) {
        setShowRateLimit(true);
        setTimeout(() => setShowRateLimit(false), 3000);
      } else {
        toast({
          title: "Error",
          description: t.errorSendMessage,
          variant: "destructive",
        });
      }
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', chatState.nickname!);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File uploaded",
        description: t.fileUploaded,
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed", 
        description: error.message || t.uploadFailed,
        variant: "destructive",
      });
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
      console.error('Username validation error:', error);
      toast({
        title: "Invalid Username",
        description: error.message || "Please check your username and try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize messages from server when nickname is set
  useEffect(() => {
    if (messages && messages.length > 0) {
      setAllMessages(messages);
    }
  }, [messages]);

  // Save nickname to localStorage for persistence
  useEffect(() => {
    const savedNickname = localStorage.getItem('chat-nickname');
    if (savedNickname && !chatState.nickname) {
      setChatState(prev => ({ ...prev, nickname: savedNickname }));
    }
  }, [chatState.nickname]);

  useEffect(() => {
    if (chatState.nickname) {
      localStorage.setItem('chat-nickname', chatState.nickname);
    } else {
      localStorage.removeItem('chat-nickname');
    }
  }, [chatState.nickname]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!chatState.nickname) return;

    const unsubscribeNewMessage = onNewMessage((message) => {
      setAllMessages(prev => [...prev, message]);
    });

    const unsubscribeUserJoined = onUserJoined((data) => {
      toast({
        title: "User Joined",
        description: `${data.username} ${t.userJoined}`,
      });
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeUserJoined();
    };
  }, [chatState.nickname, onNewMessage, onUserJoined, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Join chat when nickname is set
  useEffect(() => {
    if (chatState.nickname) {
      joinChat(chatState.nickname);
    }
  }, [chatState.nickname, joinChat]);

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

  const onMessageInput = () => {
    if (chatState.nickname) {
      handleTyping(chatState.nickname);
    }
  };

  const handleLogout = () => {
    setChatState({ nickname: null, lastMessageTime: new Date() });
    setAllMessages([]);
    localStorage.removeItem('chat-nickname');
    toast({
      title: "Logged out",
      description: "You have been logged out of the chat.",
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && chatState.nickname) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: t.fileTooLarge,
          variant: "destructive",
        });
        return;
      }
      uploadFileMutation.mutate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && chatState.nickname) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: t.fileTooLarge,
          variant: "destructive",
        });
        return;
      }
      uploadFileMutation.mutate(file);
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image' && message.fileUrl) {
      return (
        <div className="space-y-2">
          <img 
            src={message.fileUrl} 
            alt={message.fileName || 'Uploaded image'} 
            className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
            onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
            data-testid={`image-${message.id}`}
          />
          <div className="text-xs text-gray-500">
            {message.fileName} • {message.fileSize}
          </div>
        </div>
      );
    } else if (message.type === 'file' && message.fileUrl) {
      return (
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
          <FileText className="w-6 h-6 text-blue-500" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{message.fileName}</div>
            <div className="text-xs text-gray-500">{message.fileSize}</div>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              const link = document.createElement('a');
              link.href = message.fileUrl!;
              link.download = message.fileName || 'download';
              link.click();
            }}
            data-testid={`download-${message.id}`}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      );
    } else {
      return (
        <p className={`text-sm ${message.username === chatState.nickname ? '' : 'text-chat-text'}`} data-testid={`content-${message.id}`}>
          {message.content}
        </p>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-xl" style={{ background: 'var(--chat-bg)' }}>
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              🐺
            </div>
            <div>
              <h1 className="text-lg font-semibold">{t.appName}</h1>
              <p className="text-sm text-orange-200">{t.tagline}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-orange-200">{isConnected ? t.online : t.offline}</span>
            </div>
            {userCount > 0 && (
              <div className="text-sm text-orange-200" data-testid="user-count">
                {userCount} {t.userCount}
              </div>
            )}
            {chatState.nickname && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-orange-200 hover:text-white hover:bg-white/10"
                data-testid="button-logout"
              >
                {t.logout}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Nickname Setup */}
      {!chatState.nickname && (
        <div className="p-6 border-b border-chat-border bg-lycan-accent/30">
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-chat-text mb-2">{t.joinPack}</h2>
            <p className="text-sm text-gray-600 mb-4">{t.nicknamePrompt}</p>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder={t.nicknamePlaceholder}
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
                {setNicknameMutation.isPending ? t.joining : t.joinChat}
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
            <div className="bg-lycan-accent text-lycan-primary px-4 py-2 rounded-full text-sm">
              {t.welcomeMessage}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && chatState.nickname && (
            <div className="flex justify-center">
              <div className="text-gray-500 text-sm">{t.loadingMessages}</div>
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
                    {renderMessageContent(message)}
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

          {/* Typing Indicators */}
          {typingUsers.size > 0 && (
            <div className="flex items-center space-x-2 text-gray-500 text-sm" data-testid="typing-indicator">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {chatState.nickname && (
        <div 
          className={`border-t border-chat-border bg-white p-4 ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="text-center py-4 text-blue-600 border-2 border-dashed border-blue-300 rounded-lg mb-4">
              <Upload className="mx-auto w-8 h-8 mb-2" />
              <p>{t.dragDropMessage}</p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
              disabled={uploadFileMutation.isPending}
              className="p-2 text-gray-500 hover:text-gray-700"
              data-testid="button-upload-file"
            >
              <Plus className="w-5 h-5" />
            </Button>
            
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t.messagePlaceholder}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    onMessageInput();
                  }}
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
                  ⏱️ {t.rateLimitMessage}
                </div>
              )}
              
              {uploadFileMutation.isPending && (
                <div className="text-xs text-blue-600 mt-1" data-testid="upload-progress">
                  📎 {t.uploading}
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !messageInput.trim()}
              className="px-6 py-3"
              data-testid="button-send-message"
            >
              📤
              <span className="ml-2 hidden sm:inline">
                {sendMessageMutation.isPending ? t.sending : t.send}
              </span>
            </Button>
          </div>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.doc,.docx,.zip,.mp4,.mp3"
            className="hidden"
            data-testid="file-input"
          />
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-500 text-white text-center py-2 text-sm" data-testid="connection-status">
          ⚠️ Connection lost. Trying to reconnect...
        </div>
      )}
    </div>
  );
}