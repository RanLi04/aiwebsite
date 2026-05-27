import React, { useState, useEffect, useRef } from "react";
import { Message, Theme, PageMode, Session } from "./types";
import { Menu, Lock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "./utils";
import { Sidebar } from "./components/Sidebar";
import { ModelDropdown } from "./components/ModelDropdown";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";

const fenghechatModels = [
  { id: "fenghechat-unlimited", name: "思忆千环 无限制", color: "bg-red-500", desc: "移除安全护栏，支持自由角色扮演与创作", shadow:"shadow-[0_0_8px_rgba(239,68,68,0.8)]", supportsThinking: true },
  { id: "fenghechat-pro", name: "思忆千环 Pro", color: "bg-purple-400", desc: "深度推理与复杂逻辑分析", shadow:"shadow-[0_0_8px_rgba(192,132,252,0.8)]", supportsThinking: true },
  { id: "fenghechat-flash", name: "思忆千环 Flash", color: "bg-blue-400", desc: "极速响应，适合日常使用", shadow:"shadow-[0_0_8px_rgba(96,165,250,0.8)]", supportsThinking: false },
  { id: "fenghechat-mini", name: "思忆千环 Mini", color: "bg-emerald-400", desc: "轻量级、高能效的小模型", shadow:"shadow-[0_0_8px_rgba(52,211,153,0.8)]", supportsThinking: false },
];

const flagshipModels = [
  { id: "deepseek-reasoner", name: "旗舰 DeepSeek Reasoner", color: "bg-indigo-500", desc: "卓越的复杂逻辑推理与演绎分析", shadow:"shadow-[0_0_8px_rgba(99,102,241,0.8)]", supportsThinking: true },
  { id: "deepseek-chat", name: "旗舰 DeepSeek Chat", color: "bg-sky-500", desc: "通用的旗舰级对话引擎", shadow:"shadow-[0_0_8px_rgba(14,165,233,0.8)]", supportsThinking: false },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [pageMode, setPageMode] = useState<PageMode>("fenghechat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Model mapping
  const models = pageMode === "fenghechat" ? fenghechatModels : flagshipModels;
  const [selectedModelId, setSelectedModelId] = useState(models[0].id);
  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  useEffect(() => {
    setSelectedModelId(pageMode === "fenghechat" ? fenghechatModels[0].id : flagshipModels[0].id);
  }, [pageMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  const [clientId] = useState(() => {
    let id = localStorage.getItem("siyi_client_id");
    if (!id) {
       id = crypto.randomUUID();
       localStorage.setItem("siyi_client_id", id);
    }
    return id;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions", {
         headers: { "x-client-id": clientId }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch(e) {
        showToast("获取历史会话失败", "error");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-save session
  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) return;
    
    let sid = currentSessionId;
    if (messages.length > 0 && !sid) {
      sid = crypto.randomUUID();
      setCurrentSessionId(sid);
    }
    
    if (sid && !isStreaming) {
      const firstMessage = messages[0]?.text || "新会话";
      const title = firstMessage.length > 40 ? firstMessage.substring(0, 40) + "..." : firstMessage;
      
      const sessionData = {
        id: sid,
        title,
        updatedAt: Date.now(),
        messages
      };
      
      let timer = setTimeout(() => {
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-client-id": clientId },
          body: JSON.stringify(sessionData)
        }).then(() => fetchSessions()).catch(() => showToast("自动保存会话失败", "error"));
      }, 500); // debounce save
      return () => clearTimeout(timer);
    }
  }, [messages, currentSessionId, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages.length, messages[messages.length - 1]?.text, isStreaming]);

  const [toasts, setToasts] = useState<{id:string, msg:string, type:'info'|'success'|'error'}[]>([]);
  const showToast = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsStreaming(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: input.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
    }
    setIsStreaming(true);

    const modelMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: modelMessageId, role: "model", text: "" }]);

    const fetchChat = async () => {
       try {
          abortControllerRef.current = new AbortController();
          const res = await fetch("/api/chat", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             signal: abortControllerRef.current.signal,
             body: JSON.stringify({ 
                modelId: selectedModelId,
                messages: currentMessages,
                isWebSearchMode: isWebSearchMode
             })
          });
          
          if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || "Network error");
          }
          
          if (!res.body) throw new Error("No body");
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";
          let buffer = "";
          let lastUpdateTime = Date.now();
          
          while (true) {
             const { done, value } = await reader.read();
             if (done) break;
             buffer += decoder.decode(value, { stream: true });
             const lines = buffer.split('\n');
             buffer = lines.pop() || "";
             
             let textUpdated = false;
             for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                   const dataStr = trimmed.slice(6);
                   if (dataStr === '[DONE]') continue;
                   try {
                      const parsed = JSON.parse(dataStr);
                      if (parsed.text !== undefined && parsed.text !== null) {
                         fullText += parsed.text;
                         textUpdated = true;
                      }
                   } catch(e) {}
                }
             }

             if (textUpdated) {
                 const now = Date.now();
                 // Throttle state updates to at most ~24fps to prevent React render blocking, 
                 // which noticeably slows down the stream and lags the browser.
                 if (now - lastUpdateTime > 40) {
                     setMessages(prev => prev.map(msg => 
                        msg.id === modelMessageId ? { ...msg, text: fullText } : msg
                     ));
                     lastUpdateTime = now;
                 }
             }
          }

          // Ensure final text is set when done
          setMessages(prev => prev.map(msg => 
             msg.id === modelMessageId ? { ...msg, text: fullText } : msg
          ));
       } catch (error: any) {
          if (error.name === 'AbortError') {
             console.log("Chat aborted");
             return;
          }
          console.error("fetchChat error:", error);
          showToast(`无法连接本地引擎: ${error.message}`, 'error');
          setMessages(prev => prev.map(msg => 
             msg.id === modelMessageId ? { ...msg, text: "请求失败，请检查后端服务是否正常运行。" } : msg
          ));
       } finally {
          setIsStreaming(false);
          abortControllerRef.current = null;
       }
    };
    
    fetchChat();
  };

  const currentBgClass = pageMode === "fenghechat" 
    ? (theme === "light" ? "rgb-flow-light" : "rgb-flow-dark")
    : (theme === "light" ? "flagship-flow-light" : "flagship-flow-dark");

  const startNewChat = () => {
     handleStop();
     setCurrentSessionId("");
     setMessages([]);
     showToast('已开启新对话', 'success');
     if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleCopy = (text: string) => {
    let cleanText = text;
    while(true) {
        const start = cleanText.indexOf("<think>");
        const end = cleanText.indexOf("</think>", start);
        if (start !== -1 && end !== -1) {
            cleanText = cleanText.substring(0, start) + cleanText.substring(end + 8);
        } else if (start !== -1) {
            cleanText = cleanText.substring(0, start);
        } else {
            break;
        }
    }
    navigator.clipboard.writeText(cleanText.trim() || text);
    showToast('内容已复制到剪贴板', 'success');
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     try {
        const res = await fetch(`/api/sessions/${id}`, {
           method: "DELETE",
           headers: { "x-client-id": clientId }
        });
        if (res.ok) {
           if (currentSessionId === id) {
              setCurrentSessionId("");
              setMessages([]);
           }
           fetchSessions();
           showToast("对话已删除", "success");
        }
     } catch (err) {
        showToast("删除失败", "error");
     }
  };

  return (
    <div className={cn("flex h-screen w-full overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors duration-500", currentBgClass)}>
      
      {/* Toast Container */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none items-center">
         {toasts.map(toast => (
            <div key={toast.id} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel shadow-xl pointer-events-auto", 
               toast.type === 'success' ? "border-emerald-500/30" : toast.type === 'error' ? "border-red-500/30" : "border-black/10 dark:border-white/10")}>
               {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
               {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
               {toast.type === 'info' && <Info className="h-4 w-4 text-indigo-500" />}
               <span className="text-[13px] font-medium whitespace-nowrap">{toast.msg}</span>
            </div>
         ))}
      </div>

      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        pageMode={pageMode}
        setPageMode={setPageMode}
        theme={theme}
        setTheme={setTheme}
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        setMessages={setMessages}
        deleteSession={deleteSession}
        startNewChat={startNewChat}
        showToast={showToast}
        setSelectedModelId={setSelectedModelId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 w-full min-w-0">
        
         {/* Header */}
         <header className="h-14 md:h-16 glass-panel flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 w-full !border-x-0 !border-t-0 !rounded-none">
            <div className="flex items-center gap-2 md:gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 opacity-70 hover:opacity-100 transition-colors active:scale-95">
                  <Menu className="h-5 w-5 md:h-6 md:w-6" />
               </button>
            </div>

            <ModelDropdown 
              models={models}
              selectedModel={selectedModel}
              setSelectedModelId={setSelectedModelId}
              isModelDropdownOpen={isModelDropdownOpen}
              setIsModelDropdownOpen={setIsModelDropdownOpen}
              showToast={showToast}
            />

            <div className="hidden md:flex items-center gap-4">
               <div onClick={() => showToast('连接完全加密，未发生数据泄漏', 'success')} className="text-xs opacity-60 flex items-center gap-1.5 hover:text-emerald-500 transition-colors px-2 py-1 cursor-pointer active:scale-95 hidden lg:flex">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>安全连接</span>
               </div>
            </div>
         </header>

         <MessageList
           messages={messages}
           isStreaming={isStreaming}
           pageMode={pageMode}
           supportsThinking={selectedModel?.supportsThinking ?? true}
           onCopy={handleCopy}
           onFeedback={() => showToast('已记录您的赞同反馈', 'success')}
           onSuggestionClick={(text) => { setInput(text); }}
           messagesEndRef={messagesEndRef}
         />

         <ChatInput
           input={input}
           setInput={setInput}
           isStreaming={isStreaming}
           onSend={handleSend}
           onStop={handleStop}
           isWebSearchMode={isWebSearchMode}
           setIsWebSearchMode={setIsWebSearchMode}
           selectedModelName={selectedModel?.name || "思忆千环"}
           textareaRef={textareaRef}
           showToast={showToast}
         />
      </div>
    </div>
  );
}
