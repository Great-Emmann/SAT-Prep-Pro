import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Globe,
  Brain,
  Zap,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronDown,
  BookOpen,
  Calculator,
  Compass
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  sources?: { title: string; url: string }[];
}

const ROLES = [
  {
    id: "general",
    name: "General SAT Tutor",
    icon: Sparkles,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    instruction:
      "You are a master SAT tutor. Provide clear, encouraging, and highly structured guidance across Math, Reading, and Writing sections."
  },
  {
    id: "math",
    name: "SAT Math Specialist",
    icon: Calculator,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    instruction:
      "You are an expert SAT Math Specialist. Focus on step-by-step mathematical reasoning, Desmos graphing calculator tricks, Heart of Algebra, and problem solving."
  },
  {
    id: "rw",
    name: "Reading & Writing Coach",
    icon: BookOpen,
    color: "text-sky-600 bg-sky-50 border-sky-200",
    instruction:
      "You are a Digital SAT Reading & Writing Coach. Focus on grammar rules, vocabulary in context, transitions, punctuation, and passage evidence extraction."
  },
  {
    id: "strategy",
    name: "Strategy & Test Prep Coach",
    icon: Compass,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    instruction:
      "You are an SAT Exam Strategy Coach. Provide test-taking strategies, time management advice, college score targets, and exam day mental preparation."
  }
];

const MODELS = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    tag: "General & Search",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-300",
    desc: "Default balanced model with built-in Google Search grounding for live SAT data.",
    icon: Globe
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    tag: "Complex Reasoning",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-300",
    desc: "Advanced reasoning model for complex math proofs, multi-step word problems, and deep analysis.",
    icon: Brain
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    tag: "Fast & Quick Hints",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-300",
    desc: "Lightweight model optimized for rapid answers, quick definitions, and instant feedback.",
    icon: Zap
  }
];

const SUGGESTED_PROMPTS = [
  "What are the upcoming Digital SAT test dates & registration deadlines?",
  "Explain standard deviation & box plots for Digital SAT Math.",
  "Give me a 3-step strategy for handling main idea Reading passages.",
  "What math formulas are provided on the SAT reference sheet?"
];

export function GeminiChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_welcome",
      role: "assistant",
      content:
        "Hello! I am your AI SAT Study Companion powered by Google Gemini. Ask me any SAT practice question, concept explanation, or test strategy. I can also search live web data for test dates, college score requirements, and College Board updates!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "gemini-3.5-flash"
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [enableSearch, setEnableSearch] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);

    try {
      const historyForApi = messages
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          model: selectedModel,
          systemInstruction: selectedRole.instruction,
          enableSearch: enableSearch
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `The AI tutor returned HTTP ${res.status}. Please try again.`);
      }
      if (!data.text || typeof data.text !== "string") {
        throw new Error("The AI tutor did not return a response.");
      }

      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "assistant",
        content: data.text || "I processed your request. Let me know if you need more details!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel,
        sources: data.sources || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat request failed:", err);
      const errorMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "assistant",
        content: err instanceof Error ? err.message : "Sorry, I couldn't reach the AI tutor. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "m_welcome",
        role: "assistant",
        content:
          "Conversation history cleared! How can I assist with your SAT prep today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel
      }
    ]);
  };

  const activeModelObj = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex flex-col h-[680px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight text-white">
                SAT AI Tutor & Assistant
              </h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${activeModelObj.badgeColor}`}>
                {activeModelObj.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Role: <span className="text-indigo-300 font-bold">{selectedRole.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showSettings
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="Configure Chatbot Persona & Model Tier"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
            title="Clear Chat Thread"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Expandable Settings Bar */}
      {showSettings && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 border-b border-slate-800 animate-fade-in space-y-4 z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Persona/Role Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Tutor Role & Persona
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-white font-bold"
                          : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-indigo-400" : "text-slate-400"} />
                      <span className="truncate text-[11px]">{role.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Tier Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Gemini Model Tier
              </label>
              <div className="space-y-1.5">
                {MODELS.map((model) => {
                  const Icon = model.icon;
                  const isSelected = selectedModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-purple-600/30 border-purple-500 text-white font-bold"
                          : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isSelected ? "text-purple-400" : "text-slate-400"} />
                        <div>
                          <p className="text-[11px] font-bold">{model.name}</p>
                          <p className="text-[9px] text-slate-400 font-normal">{model.desc}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {model.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search Grounding Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-emerald-400" />
              <div>
                <p className="font-bold text-slate-200">Google Search Grounding</p>
                <p className="text-[10px] text-slate-400">
                  Allow Gemini to fetch live Google search data for up-to-date SAT info & web citations.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs"
                }`}
              >
                {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-4 shadow-2xs space-y-2 ${
                  isUser
                    ? "bg-slate-900 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 border-b border-slate-100 pb-1 mb-1">
                  <span className="font-bold">{isUser ? "You" : "SAT AI Tutor"}</span>
                  <div className="flex items-center gap-2">
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-mono">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.content}
                </div>

                {/* Grounding Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                      <Globe size={11} className="text-emerald-500" />
                      Grounded Web Citations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium px-2 py-1 rounded-md border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-1 max-w-[240px] truncate"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot size={16} className="animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>Gemini is generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Quick Bar */}
      {messages.length < 4 && (
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex gap-2 overflow-x-auto scrollbar-none">
          {SUGGESTED_PROMPTS.map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(promptText)}
              className="px-2.5 py-1 text-[10px] font-semibold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-2xs"
            >
              💡 {promptText}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask ${selectedRole.name} using ${activeModelObj.name}...`}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
