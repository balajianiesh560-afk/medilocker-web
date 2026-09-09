import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Copy,
  Check,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface AIAssistantViewProps {
  geminiConfigured: boolean;
  onNavigateToPatient?: (patientId: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  geminiConfigured,
  onNavigateToPatient,
}) => {
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessages: ChatMessage[] = [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello, MediLocker staff member. I am your clinical information-organizing assistant powered by Gemini. 

I can query the hospital database for:
• **Unidentified trauma patients** awaiting identification
• **Detailed summaries** of any patient (e.g. *PID-1042*)
• **Recent emergency cases** and triage arrival notes
• **Physical remarks matching** (such as tattoos, scars, clothing, or jewelry)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const promptSuggestions = [
    'Which patients are still unidentified?',
    'Summarize patient PID-1042',
    'Which emergency cases happened today?',
    'Find patients with tattoos or specific remarks',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await api.askAIAssistant(text, messages);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error contacting AI Assistant: ${err?.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('info', 'Copied to Clipboard', 'Assistant answer copied to clipboard.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    showToast('info', 'Chat Cleared', 'Conversation history has been reset.');
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] space-y-4">
      {/* Mandatory Medical AI Policy Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-2xl p-4 flex items-start gap-3 shrink-0 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-amber-950">Hospital Clinical Advisory & AI Policy: </span>
          MediLocker AI is an information-organizing tool for hospital staff and does not provide medical diagnosis
          or treatment advice. The AI must NOT diagnose diseases, prescribe medicines, or make treatment decisions.
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col flex-1 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">MediLocker AI Assistant</h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    geminiConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {geminiConfigured ? 'Gemini 3.8 Flash' : 'Database Search Fallback'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time natural language query against live patient records & emergency cases
              </p>
            </div>
          </div>

          <button
            id="clear-chat-btn"
            onClick={handleClearChat}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
            title="Reset Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-sky-600 text-white'
                      : 'bg-gradient-to-tr from-teal-600 to-sky-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs relative group ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line break-words space-y-2">{msg.text}</div>

                  {/* Timestamp & Copy */}
                  <div
                    className={`flex items-center gap-2 mt-2 pt-1 border-t text-[10px] ${
                      isUser ? 'border-sky-500/60 text-sky-200 justify-end' : 'border-slate-200/60 text-slate-400 justify-between'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 text-slate-500"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 flex items-center gap-2 text-xs text-slate-500 shadow-xs">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                <span>Gemini is reading hospital records and organizing data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Quick queries:
          </span>
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              id={`assistant-quick-prompt-${idx}`}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-xs font-medium px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 whitespace-nowrap transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
        >
          <input
            id="ai-assistant-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything about patients, physical remarks, emergency cases..."
            disabled={isSending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          />
          <button
            id="ai-assistant-send-btn"
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-sm shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
