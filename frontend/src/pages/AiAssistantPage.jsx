import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, AlertCircle, MessageSquare } from 'lucide-react';
import { askAiAssistant } from '../services/api';
import PageShell from '../components/dashboard/PageShell';
import PageHeader from '../components/dashboard/PageHeader';
import DashPanel from '../components/dashboard/DashPanel';

const AiAssistantPage = ({ publicMode = false }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm the MedMx help guide. Ask how to search medicines, upload prescriptions, use reminders, or read lab reports.",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAiAssistant(userMessage.text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: response.text, sender: 'ai' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
          sender: 'ai',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell className="max-w-4xl flex flex-col min-h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Help Assistant"
        subtitle="Quick answers about MedMx features — informational only, not medical advice."
        icon={MessageSquare}
        lightSurface={publicMode}
      />

      <DashPanel
        lightSurface={publicMode}
        className={`flex-1 flex flex-col min-h-[28rem] lg:min-h-[32rem]${publicMode ? ' dna-pattern border-violet/15' : ''}`}
        noPadding
        bodyClassName="flex flex-col flex-1 min-h-0 p-0"
      >
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0 ${
            publicMode ? 'bg-slate-50/50' : 'bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-navy text-white' : 'bg-brand-gradient text-white shadow-sm'
                }`}
              >
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-navy text-white rounded-tr-md'
                    : msg.isError
                      ? publicMode
                        ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-md'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900 rounded-tl-md'
                      : 'dash-surface dash-text rounded-tl-md shadow-sm'
                }`}
              >
                {msg.isError && <AlertCircle size={14} className="inline mr-1.5 -mt-0.5" />}
                <span className="whitespace-pre-wrap">{msg.text}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl dash-surface rounded-tl-md flex gap-1.5">
                <span className="w-2 h-2 bg-teal/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-teal/50 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-teal/50 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          className={`p-4 sm:p-5 border-t dash-surface shrink-0 ${
            publicMode ? 'border-slate-100' : 'border-slate-100 dark:border-slate-700'
          }`}
        >
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medicines, doses, or lab terms…"
              className={`dash-input py-3.5 pl-4 pr-14 ${
                publicMode ? 'bg-slate-50' : 'bg-slate-50 dark:bg-slate-900/50'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 bg-brand-gradient text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-center text-xs dash-muted mt-2">AI can make mistakes. Consult a doctor for medical decisions.</p>
        </div>
      </DashPanel>
    </PageShell>
  );
};

export default AiAssistantPage;
