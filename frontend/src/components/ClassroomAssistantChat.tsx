import React, { useEffect, useRef, useState } from 'react';
import {
  askClassroomAssistant,
  deleteConversation,
  getConversationDetail,
  getSubjectConversations,
} from '../services/ai';
import { ChatMessage, ChatSourceItem, Conversation } from '../types/ai';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Trash2,
  Plus,
  Clock,
  BookOpen,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ClassroomAssistantChatProps {
  token: string;
  subjectId: number;
  subjectName: string;
}

export const ClassroomAssistantChat: React.FC<ClassroomAssistantChatProps> = ({
  token,
  subjectId,
  subjectName,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load subject conversations
  const loadConversations = async () => {
    try {
      const list = await getSubjectConversations(token, subjectId);
      setConversations(list);
      if (list.length > 0 && !currentConversationId) {
        // Load latest conversation
        loadConversation(list[0].id);
      }
    } catch {
      // Ignored gracefully on initial load
    }
  };

  const loadConversation = async (convId: number) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const detail = await getConversationDetail(token, convId);
      setCurrentConversationId(detail.id);
      setMessages(detail.messages || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token, subjectId]);

  const handleStartNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (convId: number) => {
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await deleteConversation(token, convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || inputQuestion).trim();
    if (!question || sending) return;

    setInputQuestion('');
    setError(null);

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      sender: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await askClassroomAssistant(token, subjectId, question, {
        conversationId: currentConversationId || undefined,
      });

      if (!currentConversationId && res.conversation_id) {
        setCurrentConversationId(res.conversation_id);
      }

      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        content: res.answer,
        sources: res.sources,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh conversations list in background
      loadConversations();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to get answer from AI Assistant.');
      }
    } finally {
      setSending(false);
    }
  };

  const toggleSourceExpand = (msgIndex: number) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgIndex]: !prev[msgIndex],
    }));
  };

  const suggestions = [
    'What are the core concepts covered in class?',
    'Summarize the key points from our latest lecture recordings',
    'What definitions or formulas were highlighted in class?',
    'Give me 3 practice questions based on our lectures',
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[750px] animate-fade-in">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800">ClassMate AI Assistant</h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                <ShieldCheck className="w-3 h-3 text-violet-600" />
                <span>Lecture Grounded</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Grounded strictly in approved lecture transcripts for <span className="font-semibold text-slate-700">{subjectName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {conversations.length > 0 && (
            <select
              value={currentConversationId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) loadConversation(Number(val));
                else handleStartNewChat();
              }}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 max-w-[160px] truncate"
            >
              <option value="">+ New Conversation</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleStartNewChat}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-100/70 hover:bg-violet-200/80 rounded-xl transition cursor-pointer"
            title="Start fresh conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {currentConversationId && (
            <button
              onClick={() => handleDeleteConversation(currentConversationId)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
        {loadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
            <p className="text-xs">Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                Ask anything about your class recordings
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                I can explain concepts, search lecture transcripts with exact timestamps, summarize class discussions, and draft revision notes.
              </p>
            </div>

            <div className="w-full pt-3 space-y-2 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                Try asking
              </p>
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="w-full text-left p-2.5 bg-white border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/50 rounded-2xl text-xs text-slate-700 transition flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <span className="truncate">{sug}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-600 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const hasSources = !!msg.sources && msg.sources.length > 0;
            const isSourcesExpanded = !!expandedSources[index];

            return (
              <div
                key={index}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-xs ${
                    isUser
                      ? 'bg-slate-800'
                      : 'bg-gradient-to-tr from-violet-600 to-indigo-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                      isUser
                        ? 'bg-violet-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Grounded Citation Sources */}
                  {!isUser && hasSources && (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 space-y-2">
                      <button
                        onClick={() => toggleSourceExpand(index)}
                        className="w-full flex items-center justify-between text-[11px] font-semibold text-indigo-900 cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {msg.sources!.length} Grounded Citation
                            {msg.sources!.length > 1 ? 's' : ''} from Class Recordings
                          </span>
                        </span>
                        {isSourcesExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </button>

                      {isSourcesExpanded && (
                        <div className="pt-2 border-t border-indigo-100 space-y-2">
                          {msg.sources!.map((src: ChatSourceItem, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="bg-white/90 p-2.5 rounded-lg border border-indigo-100/80 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-indigo-950">
                                <span className="truncate max-w-[200px]">{src.lecture_title}</span>
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono">
                                  <Clock className="w-3 h-3" />
                                  <span>{src.timestamp}</span>
                                </span>
                              </div>
                              <p className="text-slate-600 italic border-l-2 border-indigo-400 pl-2">
                                &ldquo;{src.snippet}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Assistant Response State */}
        {sending && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center space-x-2 shadow-xs">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce"></div>
              </div>
              <span>Searching class transcripts and synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a question about the lectures or concepts in this subject..."
              disabled={sending}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition disabled:opacity-60"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-300">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || sending}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-violet-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
