import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
  ConversationSummary,
  MessageData,
  USE_BACKEND,
} from '../lib/api';
import { getAuthToken } from '../lib/api';
import {
  ArrowLeft, Send, RefreshCw, MessageCircle, User as UserIcon
} from 'lucide-react';

interface MessagingPanelProps {
  currentUser: User;
  initialConversationId?: string;
  onClose?: () => void;
}

export const MessagingPanel: React.FC<MessagingPanelProps> = ({
  currentUser,
  initialConversationId,
  onClose,
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvo, setActiveConvo] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for new messages when active conversation is open
  useEffect(() => {
    if (!USE_BACKEND || !activeConvo) return;
    const interval = setInterval(async () => {
      try {
        const full = await getConversation(activeConvo.id);
        if (full && full.messages) {
          setMessages(full.messages);
        }
      } catch {
        // Silent background poll error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConvo?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!USE_BACKEND) return;
    setIsLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Open initial conversation if provided
  useEffect(() => {
    if (initialConversationId) {
      openConversation(initialConversationId);
    }
  }, [initialConversationId]);

  const openConversation = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const convo = await getConversation(id);
      if (convo) {
        setActiveConvo(convo);
        setMessages(convo.messages || []);
        await markConversationRead(id);
        // Update unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvo || isSending) return;
    const text = input.trim();
    setInput('');
    setIsSending(true);
    try {
      const msg = await sendMessage(activeConvo.id, text);
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherUser = (convo: ConversationSummary) => {
    if (convo.user1Id === currentUser.id) return convo.user2;
    return convo.user1;
  };

  if (!USE_BACKEND) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-12 h-12 text-[#C5C4BA] mb-4" />
        <h3 className="font-semibold text-[#2D452B] mb-2">Messaging requires backend</h3>
        <p className="text-sm text-[#767B70]">
          Configure <code className="bg-[#EEF2E8] px-1 rounded">VITE_API_BASE_URL</code> to enable real-time messaging.
        </p>
      </div>
    );
  }

  // Conversation list view
  if (!activeConvo) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-[#E8E7DF] flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-sm text-[#2D452B]">Messages</h2>
          <button
            onClick={loadConversations}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[#767B70] hover:bg-[#FAF9F5] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
          )}
          {conversations.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-10 h-10 text-[#C5C4BA] mb-3" />
              <p className="text-sm text-[#767B70]">No conversations yet.</p>
              <p className="text-xs text-[#9CA0A0] mt-1">Start a conversation from a listing.</p>
            </div>
          )}
          {conversations.map((convo) => {
            const other = getOtherUser(convo);
            const lastMsg = convo.messages?.[0];
            return (
              <button
                key={convo.id}
                onClick={() => openConversation(convo.id)}
                className="w-full text-left px-4 py-3 border-b border-[#E8E7DF] hover:bg-[#FAF9F5] transition-colors cursor-pointer flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-[#DCE8D3] text-[#2D452B] font-bold flex items-center justify-center text-sm shrink-0">
                  {other?.displayName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#2F332C] truncate">{other?.displayName || 'Unknown'}</span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-[#4A6B42] text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold ml-1 shrink-0">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#4A6B42] capitalize">{other?.role}</div>
                  {lastMsg && (
                    <div className="text-[11px] text-[#767B70] truncate mt-0.5">{lastMsg.text}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Active conversation view
  const other = getOtherUser(activeConvo);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E8E7DF] flex items-center gap-3 shrink-0 bg-white">
        <button
          onClick={() => { setActiveConvo(null); setMessages([]); }}
          className="p-1.5 rounded-lg text-[#767B70] hover:bg-[#FAF9F5] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#DCE8D3] text-[#2D452B] font-bold flex items-center justify-center text-sm">
          {other?.displayName?.charAt(0) || '?'}
        </div>
        <div>
          <div className="font-semibold text-xs text-[#2F332C]">{other?.displayName}</div>
          <div className="text-[11px] text-[#4A6B42] capitalize">{other?.role}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-xs text-[#767B70] py-8">No messages yet. Say hello!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-[#2D452B] text-white rounded-br-md'
                    : 'bg-white border border-[#E8E7DF] text-[#2F332C] rounded-bl-md shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <div className={`text-[10px] mt-0.5 ${isMe ? 'text-white/60 text-right' : 'text-[#767B70]'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && msg.readAt && <span className="ml-1">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        {error && (
          <div className="text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[#E8E7DF] shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Type a message..."
            className="flex-1 text-xs border border-[#E8E7DF] rounded-xl px-3 py-2.5 text-[#2F332C] placeholder-[#9CA0A0] focus:outline-none focus:ring-2 focus:ring-[#4A6B42] focus:border-transparent bg-[#FAF9F5]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="p-2.5 rounded-xl bg-[#2D452B] text-white hover:bg-[#1e3320] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
