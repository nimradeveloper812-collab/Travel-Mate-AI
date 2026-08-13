import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import api from '../lib/api';

interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
}

const formatMessageContent = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Remove markdown heading hashes
    .replace(/\*\*/g, '')    // Remove markdown bold double asterisks
    .replace(/\*/g, '•');    // Convert single asterisks to bullets (if any remain)
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to TravelMate AI. Ask me about flight hacks, hotel recommendations, packing lists, or local customs!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    // Push user message
    const updatedMessages = [...messages, { role: 'user', content: query } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map history for Gemini API. Exclude first system message
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await api.post('/chat/message', {
        message: query,
        history: history
      });

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: response.data.response }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'system', 
          content: 'Error: Failed to reach backend chat provider. Please verify Gemini configuration.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] border border-slate-200/60 bg-white rounded-2xl overflow-hidden shadow-sm">
      
      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              key={index}
              className={`flex items-start max-w-[75%] space-x-3.5 ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : msg.role === 'system' && msg.content.startsWith('Error')
                  ? 'bg-red-50 text-red-500'
                  : 'bg-sky-50 text-sky-600'
              }`}>
                {msg.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                  : msg.role === 'system' && msg.content.startsWith('Error')
                  ? 'bg-red-50 border-red-100 text-red-700'
                  : 'bg-slate-50 border-slate-100/80 text-slate-700 rounded-tl-none'
              }`}>
                {formatMessageContent(msg.content)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-start space-x-3.5 max-w-[75%]">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-2xl rounded-tl-none flex items-center space-x-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="bg-slate-50 border-t border-slate-100 p-4 flex space-x-4">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about flights, destinations, tips..."
          className="flex-1 px-4 py-3 border border-slate-200 bg-white rounded-xl outline-none text-sm focus:border-blue-500 transition-colors"
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="px-5 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer interactive disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
