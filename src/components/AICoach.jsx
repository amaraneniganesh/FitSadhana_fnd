import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';

const SUGGESTIONS = [
  "What should I eat today for my goal?",
  "Give me a better workout plan",
  "How can I lose weight faster?",
  "How many calories should I eat?",
  "What's my ideal workout frequency?",
  "Tips for muscle recovery?",
];

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center mr-2 flex-shrink-0 mt-1">
          <Sparkles className="w-3.5 h-3.5 text-foreground" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-secondary text-foreground rounded-bl-sm border border-border'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center mr-2 flex-shrink-0 mt-1">
      <Sparkles className="w-3.5 h-3.5 text-foreground" />
    </div>
    <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const AICoach = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm your FitSadhana Coach 🏋️ I know your goals, workout history, and stats - ask me anything!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setNoKey(false);

    try {
      const { data } = await api.post('/chat', {
        message: msg,
        history: messages.slice(-8)
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong.';
      if (errMsg.includes('API Key')) setNoKey(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: noKey
          ? "⚠️ Gemini API key missing. Add it to backend/.env file as GEMINI_API_KEY=your_key"
          : errMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! What would you like to know? 💪"
    }]);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/30"
        style={{ boxShadow: '0 0 30px var(--accent)' }}
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="text-foreground w-6 h-6" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sparkles className="text-foreground w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 w-[340px] md:w-[400px] z-50 flex flex-col overflow-hidden rounded-3xl"
            style={{
              height: '520px',
              maxHeight: '80vh',
              background: 'rgba(14, 14, 20, 0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Coach</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online · Knows your plan
                  </p>
                </div>
              </div>
              <button onClick={clearChat} className="text-text-secondary hover:text-text-secondary transition-colors p-1">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 px-4 py-4 overflow-y-auto space-y-0">
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length < 3 && !loading && (
              <div className="px-4 pb-3">
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl bgbg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex gap-2 bg-secondary rounded-2xl border border-border p-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask your coach anything..."
                  className="flex-1 bg-transparent text-foreground text-sm px-3 py-1.5 focus:outline-none placeholder:text-text-secondary"
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 flex items-center justify-center bg-accent rounded-xl text-foreground transition-all disabled:opacity-40 hover:opacity-90 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICoach;
