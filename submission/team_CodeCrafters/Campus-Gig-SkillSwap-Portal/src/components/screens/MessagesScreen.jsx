import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export function MessagesScreen() {
  const { conversations = [], currentUser, sendMessage } = useApp();
  const [activeConvId, setActiveConvId] = useState(() => conversations[0]?.id || 'conv_1');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Helper to safely get conversation participant details
  const getParticipant = (conv) => {
    if (!conv) return { name: 'Student', avatar: '', major: 'Campus Peer', online: true };
    return {
      id: conv.participant_id || conv.user?.id || 'unknown',
      name: conv.participant_name || conv.user?.name || 'Campus Student',
      avatar: conv.participant_avatar || conv.user?.avatar || '',
      major: conv.participant_major || conv.user?.major || 'University Peer',
      online: conv.online !== undefined ? conv.online : true
    };
  };

  const activeConversation = conversations.find(c => c.id === activeConvId) || conversations[0] || null;
  const activeParticipant = getParticipant(activeConversation);

  const filteredConversations = (conversations || []).filter(c => {
    const p = getParticipant(c);
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.major.toLowerCase().includes(q) ||
      (c.last_message || '').toLowerCase().includes(q)
    );
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(activeConversation.id, text);
  };

  const handleSelectConv = (convId) => {
    setActiveConvId(convId);
    setMobileShowChat(true);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle overflow-hidden h-[calc(100vh-10rem)] min-h-[540px] flex flex-col md:flex-row mb-12 transition-colors duration-200">
      
      {/* Conversations List Panel */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-surface-secondary)] ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-[var(--text-primary)] text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--primary-emerald)]" />
              Messages
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)]">
              {conversations.length} Active
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-input)] border border-[var(--border-color)] focus:bg-[var(--bg-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(conv => {
              const p = getParticipant(conv);
              const isSelected = activeConversation && conv.id === activeConversation.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[var(--primary-emerald-light)] border-l-4 border-[var(--primary-emerald)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="relative shrink-0">
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt={p.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[var(--border-color)]"
                      />
                    ) : null}
                    <div
                      style={{ display: p.avatar ? 'none' : 'flex' }}
                      className="w-11 h-11 rounded-2xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] font-bold text-xs items-center justify-center ring-1 ring-[var(--border-color)]"
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    {p.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--primary-emerald)] ring-2 ring-[var(--bg-surface)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {conv.last_message_time || ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] truncate mb-1">
                      {p.major}
                    </p>

                    <p className="text-xs text-[var(--text-muted)] truncate leading-snug">
                      {conv.last_message || 'Start collaborating...'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 stroke-1 text-[var(--text-muted)]" />
              <span>No conversations found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-[var(--bg-surface)] ${
          !mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="p-1.5 -ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden rounded-lg hover:bg-[var(--bg-hover)]"
                  aria-label="Back to messages list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  {activeParticipant.avatar ? (
                    <img
                      src={activeParticipant.avatar}
                      alt={activeParticipant.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      className="w-10 h-10 rounded-2xl object-cover ring-1 ring-[var(--border-color)]"
                    />
                  ) : null}
                  <div
                    style={{ display: activeParticipant.avatar ? 'none' : 'flex' }}
                    className="w-10 h-10 rounded-2xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] font-bold text-xs items-center justify-center ring-1 ring-[var(--border-color)]"
                  >
                    {activeParticipant.name.slice(0, 2).toUpperCase()}
                  </div>
                  {activeParticipant.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--primary-emerald)] ring-2 ring-[var(--bg-surface)]" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    {activeParticipant.name}
                  </h3>
                  <span className="text-[11px] text-[var(--primary-emerald)] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-emerald)] inline-block" />
                    {activeParticipant.major}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-indigo)]" />
                <span>Active Collaboration</span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[var(--bg-page)]">
              {(activeConversation.messages || []).length > 0 ? (
                activeConversation.messages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-[var(--primary-emerald)] text-white rounded-br-xs'
                            : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                  <MessageSquare className="w-10 h-10 stroke-1 mb-2 text-[var(--text-muted)] opacity-50" />
                  <p className="text-xs font-medium">No messages yet with {activeParticipant.name}.</p>
                  <p className="text-[11px] mt-1 text-[var(--text-secondary)]">Discuss gig requirements, project deliverables, and milestones here!</p>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeParticipant.name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)] placeholder:text-[var(--text-muted)] transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs p-8 gap-3">
            <MessageSquare className="w-12 h-12 stroke-1 text-[var(--text-muted)] opacity-40" />
            <p className="font-semibold text-sm text-[var(--text-primary)]">Your Campus Inbox</p>
            <p className="text-center max-w-xs text-[var(--text-secondary)]">Select a peer conversation from the left to start messaging and coordinating gig deliverables.</p>
          </div>
        )}
      </div>

    </div>
  );
}
