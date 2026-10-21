import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  Bot,
  ArrowRight
} from 'lucide-react';

export function AiAssistantModal() {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    currentUser,
    gigs,
    applications,
    viewGig,
    setCurrentScreen
  } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm_init',
      sender: 'bot',
      text: `Hi ${currentUser.name}! I'm your CampusLoop AI Assistant. I can help you find gigs, answer questions about skill swapping, prepare application pitches, and guide you through your dashboard. What would you like to do?`,
      chips: [
        "Find me programming gigs",
        "How do I apply to a gig?",
        "Where are my applications?",
        "Show high-paying gigs",
        "How does Skill Swap work?"
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAiAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiAssistantOpen]);

  if (!isAiAssistantOpen) {
    return (
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] hover:scale-105 active:scale-95 text-white shadow-xl shadow-emerald-950/20 flex items-center gap-2.5 transition-all group focus:outline-none"
        aria-label="Open AI Campus Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-tight hidden sm:inline">
          AI Campus Assistant
        </span>
      </button>
    );
  }

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Add user message
    const userMsg = { id: `usr_${Date.now()}`, sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      // Query backend database AI assistant endpoint
      const aiRes = await api.queryAiAssistant(query);
      const botResponse = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: aiRes.text,
        suggestedGigs: aiRes.suggestedGigs || [],
        chips: aiRes.chips || [],
        action: aiRes.action || null
      };
      setMessages(prev => [...prev, botResponse]);
    } catch {
      // Graceful client-side fallback if server offline
      const q = query.toLowerCase();
      let botResponse = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: "",
        suggestedGigs: [],
        chips: []
      };

      if (q.includes('programming') || q.includes('coding') || q.includes('react') || q.includes('python')) {
        const matchingGigs = gigs.filter(g => g.category === 'Programming' && g.status === 'Open').slice(0, 3);
        botResponse.text = `Here are active programming gigs currently open on CampusLoop:`;
        botResponse.suggestedGigs = matchingGigs;
        botResponse.chips = ["Show high-paying gigs", "How do I apply to a gig?"];
      } else if (q.includes('apply') || q.includes('how to apply')) {
        botResponse.text = `To apply to a gig:
1. Open any gig from Explore or Recommendations.
2. Click the emerald "Apply Now" button.
3. Write a customized pitch detailing your coursework and relevant skills.
4. When the gig poster accepts your pitch, the gig status moves to 'In Progress' and you can begin collaborating!`;
        botResponse.chips = ["Find me programming gigs", "Where are my applications?"];
      } else if (q.includes('my applications') || q.includes('where are my applications')) {
        const myApps = applications.filter(a => a.applicant_id === currentUser.id);
        botResponse.text = `You currently have ${myApps.length} submitted application(s). You can view their real-time review status on your Student Dashboard or click below:`;
        botResponse.action = { label: "Go to Dashboard", screen: "dashboard" };
        botResponse.chips = ["Find me programming gigs", "How does Skill Swap work?"];
      } else if (q.includes('high-paying') || q.includes('budget') || q.includes('paid')) {
        const paidGigs = gigs
          .filter(g => g.payment_type === 'Paid' && g.status === 'Open')
          .sort((a, b) => (b.budget || 0) - (a.budget || 0))
          .slice(0, 3);
        botResponse.text = `Here are the highest paying campus gigs currently open:`;
        botResponse.suggestedGigs = paidGigs;
        botResponse.chips = ["Find me programming gigs", "How do I apply to a gig?"];
      } else if (q.includes('skill swap') || q.includes('swap') || q.includes('barter')) {
        botResponse.text = `Skill Swap allows students to exchange services without money! For example, a Computer Science student can build a web portfolio in exchange for a Design student creating a logo or an English student proofreading their thesis. Both students review each other after completion!`;
        botResponse.chips = ["Show high-paying gigs", "Find me programming gigs"];
      } else {
        const matched = gigs.filter(g =>
          g.status === 'Open' &&
          (g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
        ).slice(0, 3);

        if (matched.length > 0) {
          botResponse.text = `I found ${matched.length} campus opportunities matching "${query}":`;
          botResponse.suggestedGigs = matched;
        } else {
          botResponse.text = `I couldn't find exact matches for "${query}", but you can explore all categories, post a new gig, or check your dashboard.`;
          botResponse.chips = ["Find me programming gigs", "Show high-paying gigs", "How does Skill Swap work?"];
        }
      }

      setMessages(prev => [...prev, botResponse]);
    }
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-end justify-center sm:block">
      
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden"
        onClick={() => setIsAiAssistantOpen(false)}
      />

      {/* Assistant Modal Window */}
      <div className="relative w-full sm:w-[420px] h-[90vh] sm:h-[600px] max-h-[720px] bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden animate-fade-in z-10 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[var(--bg-surface-secondary)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-indigo-light)] border border-[var(--accent-indigo)]/30 text-[var(--accent-indigo)] flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-[var(--accent-indigo)]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">AI Campus Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-[var(--primary-emerald)]" />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Context-Aware Campus Helper</p>
            </div>
          </div>

          <button
            onClick={() => setIsAiAssistantOpen(false)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[var(--bg-page)]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[var(--primary-emerald)] text-white rounded-br-xs'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Suggested Gig Cards inside chat */}
                {msg.suggestedGigs && msg.suggestedGigs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.suggestedGigs.map(g => (
                      <div
                        key={g.id}
                        onClick={() => {
                          viewGig(g.id);
                          setIsAiAssistantOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:border-[var(--primary-emerald)] cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-[var(--text-primary)] text-xs line-clamp-1">{g.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1">
                          <span className="text-[var(--primary-emerald)] font-semibold">
                            {g.payment_type === 'Paid' ? `₹${g.budget}` : g.payment_type}
                          </span>
                          <span className="flex items-center gap-1 text-[var(--accent-indigo)] font-medium">
                            View Gig <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action button if any */}
                {msg.action && (
                  <button
                    onClick={() => {
                      setCurrentScreen(msg.action.screen);
                      setIsAiAssistantOpen(false);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>{msg.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Quick Prompt Chips */}
              {msg.chips && msg.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-indigo-light)] hover:opacity-90 border border-[var(--accent-indigo)]/30 text-[var(--accent-indigo-text)] text-[11px] font-medium transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about gigs, skills, rules..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-emerald)] focus:ring-1 focus:ring-[var(--primary-emerald)]"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
