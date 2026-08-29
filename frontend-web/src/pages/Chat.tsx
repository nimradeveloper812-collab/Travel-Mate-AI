import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}

const suggestedPrompts = [
  'What are the best cultural spots and local food in Kyoto?',
  'How should I pack for a 5-day trip to Paris with fluctuating weather?',
  'How do I find top budget hotels and hidden travel gems for a weekend trip?',
  'What are top safety tips and budget hacks for traveling in Rome?'
];

export default function Chat() {
  const { user } = useAuth();
  const { success } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'model',
      content: "Hello! I'm your TravelMate AI Assistant. Ask me anything about destinations, flights, stays, visa requirements, or packing tips. You can also select an active saved trip below for personalized advice!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get('/trips/my-trips');
        setTrips(response.data || []);
      } catch (err) {
        console.error('Error loading trips for chat context', err);
      }
    };
    fetchTrips();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const response = await api.post('/chat/message', {
        message: query,
        history,
        trip_id: selectedTripId ? Number(selectedTripId) : null
      });

      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'system',
        content: '⚠️ Failed to connect with backend AI service. Please check your network or API keys.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      setMessages([
        {
          id: 'init-fresh',
          role: 'model',
          content: 'Chat cleared! How can I assist your travel plans today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Message copied to clipboard', 'Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Top Trip Context & Controls Bar */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">TravelMate AI Assistant</h3>
            <p className="text-[11px] text-slate-400 font-medium">Ask travel questions, hacks, packing lists, and local insights</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Trip Context Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide hidden md:inline">Context:</span>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="">No Active Trip (General Mode)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  Trip to {t.destination} ({t.start_date})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        
        {/* Suggested Prompts Banner */}
        {messages.length <= 2 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100/70 mb-4 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-700">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Suggested Inspiration Queries:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white/90 hover:bg-white p-2.5 rounded-xl border border-sky-100/80 transition-all hover:shadow-xs flex items-center justify-between"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start space-x-3 max-w-[85%] sm:max-w-[75%] ${
                  isUser ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-black ${
                    isUser
                      ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                      : isSystem
                      ? 'bg-red-100 text-red-600'
                      : 'bg-sky-100 text-blue-600'
                  }`}
                >
                  {isUser ? (user?.name ? user.name.charAt(0).toUpperCase() : 'U') : isSystem ? '!' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div className="group relative space-y-1">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                        : isSystem
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none font-medium'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none font-normal shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div className={`flex items-center space-x-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-slate-600"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <div className="flex items-start space-x-3 max-w-[75%]">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 px-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200/80 flex items-center space-x-2.5">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] font-bold text-slate-400">Thinking...</span>
            </div>
          </div>
        )}


        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask TravelMate AI a travel question..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
