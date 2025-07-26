"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, Users, Image, File } from "lucide-react";
import useUpload from "@/utils/useUpload";

export default function ChatApp() {
  const [nickname, setNickname] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [lastMessageId, setLastMessageId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  const [upload, { loading: uploadLoading }] = useUpload();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat?lastId=${lastMessageId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();

      if (data.messages.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
        setLastMessageId(data.messages[data.messages.length - 1].id);
        setTimeout(scrollToBottom, 100);
      }

      setUserCount(data.userCount);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [lastMessageId, scrollToBottom]);

  const joinChat = useCallback(async () => {
    if (!nickname.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "join",
          nickname: nickname.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to join chat");

      setHasJoined(true);
      // Start polling for messages
      intervalRef.current = setInterval(fetchMessages, 1000);
      fetchMessages();
    } catch (error) {
      console.error("Error joining chat:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nickname, fetchMessages]);

  const leaveChat = useCallback(async () => {
    if (!hasJoined || !nickname) return;

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "leave",
          nickname,
        }),
      });
    } catch (error) {
      console.error("Error leaving chat:", error);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [nickname, hasJoined]);

  const sendMessage = useCallback(
    async (messageText = null, fileData = null) => {
      const messageToSend = messageText || newMessage.trim();
      if (!messageToSend && !fileData) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "message",
            nickname,
            message: messageToSend,
            ...fileData,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        if (!fileData) {
          setNewMessage("");
        }
        fetchMessages();
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [newMessage, nickname, fetchMessages],
  );

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const { url, mimeType, error } = await upload({ file });
      if (error) {
        console.error("Upload error:", error);
        return;
      }

      const fileData = {
        fileUrl: url,
        fileName: file.name,
        fileType: mimeType,
      };

      await sendMessage("", fileData);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload, sendMessage],
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  useEffect(() => {
    // Handle page unload - mark user as left
    const handleBeforeUnload = () => {
      if (hasJoined && nickname) {
        // Use sendBeacon for reliable delivery during page unload
        const data = JSON.stringify({
          type: "leave",
          nickname,
        });

        navigator.sendBeacon("/api/chat", data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasJoined && nickname) {
        // User switched tabs or minimized browser
        const data = JSON.stringify({
          type: "leave",
          nickname,
        });
        navigator.sendBeacon("/api/chat", data);
      }
    };

    if (hasJoined) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (hasJoined) {
        leaveChat();
      }
    };
  }, [hasJoined, leaveChat, nickname]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderFileMessage = (msg) => {
    const isImage = msg.fileType?.startsWith("image/");

    return (
      <div className="mt-2">
        {isImage ? (
          <img
            src={msg.fileUrl}
            alt={msg.fileName}
            className="max-w-xs rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          />
        ) : (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors"
          >
            <File size={16} className="text-orange-600" />
            <span className="text-orange-800 text-sm">{msg.fileName}</span>
          </a>
        )}
      </div>
    );
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Join Public Chat
            </h1>
            <p className="text-gray-600">
              Enter your nickname to start chatting
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinChat()}
              className="w-full px-4 py-3 rounded-2xl border-2 border-orange-200 focus:border-orange-500 focus:outline-none transition-colors"
              maxLength={20}
            />

            <button
              onClick={joinChat}
              disabled={!nickname.trim() || isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-2xl transition-colors"
            >
              {isLoading ? "Joining..." : "Join Chat"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-orange-500 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Public Chat Room</h1>
            <p className="text-orange-100 text-sm">Welcome, {nickname}!</p>
          </div>
          <div className="flex items-center gap-2 bg-orange-600 px-3 py-1 rounded-full">
            <Users size={16} />
            <span className="text-sm font-medium">{userCount} online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "system" ? "justify-center" : "justify-start"}`}
          >
            {msg.type === "system" ? (
              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                {msg.message}
              </div>
            ) : (
              <div className="max-w-xs lg:max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-orange-600 text-sm">
                      {msg.nickname}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {msg.message && (
                    <p className="text-gray-800 break-words">{msg.message}</p>
                  )}

                  {msg.fileUrl && renderFileMessage(msg)}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none resize-none transition-colors"
              rows="1"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="absolute right-3 top-3 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Paperclip size={20} />
            </button>
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white p-3 rounded-2xl transition-colors"
          >
            <Send size={20} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,*"
        />
      </div>
    </div>
  );
}
