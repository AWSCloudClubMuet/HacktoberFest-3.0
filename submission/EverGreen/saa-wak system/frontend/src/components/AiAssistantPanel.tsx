import React, { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '../types';
import { askAI, USE_BACKEND } from '../lib/api';
import { X, Bot, Send, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AiAssistantPanelProps {
  currentUser: User;
  cropId?: string;
  marketId?: string;
  listingId?: string;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'Compare onion prices across available markets.',
  'Explain the last 14 days of tomato prices.',
  'Help me write a produce listing.',
  'Help me draft a message to a farmer.',
  'Explain how the profit calculator works.',
  'Which market currently has the highest wheat price?',
];

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  currentUser,
  cropId,
  marketId,
  listingId,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Salaam ${currentUser.displayName}! 🌱 I'm the saa-wak AI Market Assistant. I can help you understand crop prices, market trends, and farming decisions.\n\n⚠️ All prices I reference are **sample demo data** — not live market quotations. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await askAI(text.trim(), { cropId, marketId, listingId });
      const aiMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', text: response, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errMsg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, cropId, marketId, listingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatText = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E7DF] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EEF2E8] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#4A6B42]" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#2D452B] flex items-center gap-1.5">
              AI Market Assistant
              <Sparkles className="w-3 h-3 text-[#4A6B42]" />
            </div>
            <div className="text-[11px] text-[#767B70]">
              {USE_BACKEND ? 'Powered by Gemini · Sample data only' : 'Backend required'}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#767B70] hover:bg-[#FAF9F5] hover:text-[#2F332C] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Demo data banner */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-700 flex items-center gap-1.5 shrink-0">
        <AlertCircle className="w-3 h-3 shrink-0" />
        <span>AI responses use <strong>sample demo prices only</strong> — not live market data.</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2D452B] text-white rounded-br-md'
                  : 'bg-white border border-[#E8E7DF] text-[#2F332C] rounded-bl-md shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
              ) : (
                msg.text
              )}
              <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-[#767B70]'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E8E7DF] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#767B70]">
                <RefreshCw className="w-3 h-3 animate-spin text-[#4A6B42]" />
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-md px-3 py-2.5 max-w-[85%]">
              <p className="text-xs text-red-700">⚠️ {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[11px] text-red-600 underline mt-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] text-[#767B70] mb-2 font-medium uppercase tracking-wider">Suggested questions</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-[11px] bg-white border border-[#E8E7DF] text-[#4A6B42] px-2.5 py-1.5 rounded-xl hover:bg-[#EEF2E8] hover:border-[#DCE8D3] transition-colors cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-[#E8E7DF] shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about prices, markets, listings..."
            rows={1}
            className="flex-1 resize-none text-xs border border-[#E8E7DF] rounded-xl px-3 py-2.5 text-[#2F332C] placeholder-[#9CA0A0] focus:outline-none focus:ring-2 focus:ring-[#4A6B42] focus:border-transparent bg-[#FAF9F5] min-h-[40px] max-h-[120px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#2D452B] text-white hover:bg-[#1e3320] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#9CA0A0] mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};
