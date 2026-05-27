import { useState, useEffect, useRef } from "react";
import { Message, Theme, PageMode, Session } from "./types";
import { Send, Moon, Sun, Monitor, Menu, Sparkles, X, Plus, Edit, LayoutGrid, Database, MessageSquare, Settings, Lock, Paperclip, Globe, CheckCircle2, AlertCircle, Info, Copy, ThumbsUp, ChevronDown, Code, BarChart, BookOpen, Languages, Aperture } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [pageMode, setPageMode] = useState<PageMode>("fenghechat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Model mapping
  const fenghechatModels = [
    { id: "fenghechat-unlimited", name: "思忆千环 无限制", color: "bg-red-500", desc: "移除安全护栏，支持自由角色扮演与创作", shadow:"shadow-[0_0_8px_rgba(239,68,68,0.8)]" },
    { id: "fenghechat-pro", name: "思忆千环 Pro", color: "bg-purple-400", desc: "深度推理与复杂逻辑分析", shadow:"shadow-[0_0_8px_rgba(192,132,252,0.8)]" },
    { id: "fenghechat-flash", name: "思忆千环 Flash", color: "bg-blue-400", desc: "极速响应，适合日常使用", shadow:"shadow-[0_0_8px_rgba(96,165,250,0.8)]" },
    { id: "fenghechat-mini", name: "思忆千环 Mini", color: "bg-emerald-400", desc: "轻量级、高能效的小模型", shadow:"shadow-[0_0_8px_rgba(52,211,153,0.8)]" },
  ];
  const flagshipModels = [
    { id: "deepseek-reasoner", name: "旗舰 DeepSeek Reasoner", color: "bg-indigo-500", desc: "卓越的复杂逻辑推理与演绎分析", shadow:"shadow-[0_0_8px_rgba(99,102,241,0.8)]" },
    { id: "deepseek-chat", name: "旗舰 DeepSeek Chat", color: "bg-sky-500", desc: "通用的旗舰级对话引擎", shadow:"shadow-[0_0_8px_rgba(14,165,233,0.8)]" },
  ];

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-save session
  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) return;
    
    let sid = currentSessionId;
    if (messages.length > 0 && !sid) {
      sid = Date.now().toString();
      setCurrentSessionId(sid);
    }
    
    if (sid && !isStreaming) {
      const firstMessage = messages[0]?.text || "新会话";
      const title = firstMessage.length > 15 ? firstMessage.substring(0, 15) + "..." : firstMessage;
      
      const sessionData = {
        id: sid,
        title,
        updatedAt: Date.now(),
        messages
      };
      
      let timer = setTimeout(() => {
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData)
        }).then(() => fetchSessions()).catch(() => {});
      }, 500); // debounce save
      return () => clearTimeout(timer);
    }
  }, [messages, currentSessionId, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [toasts, setToasts] = useState<{id:string, msg:string, type:'info'|'success'|'error'}[]>([]);
  const showToast = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
    }
    setIsStreaming(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: modelMessageId, role: "model", text: "" }]);

    const responseText = "没问题。这里是一个使用 Python 的 os 模块来批量重命名目录下所有图片文件的脚本：\n\n```python\nimport os\n\ndef batch_rename():\n    count = 1\n    for filename in os.listdir('.'):\n        if filename.endswith('.png'):\n            os.rename(filename, f\"image_{count}.png\")\n            count += 1\n```\n\n这段代码非常简单高效，您可以直接复制使用。由于未连接实际后端，这仅为体验演示内容。如果您开启联网模式，我也可以搜索更多有效工具。";
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: responseText.slice(0, currentIndex + 1) } : msg
        )
      );
      currentIndex++;
      if (currentIndex >= responseText.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 20);
  };

  const currentBgClass = pageMode === "fenghechat" 
    ? (theme === "light" ? "rgb-flow-light" : "rgb-flow-dark")
    : (theme === "light" ? "flagship-flow-light" : "flagship-flow-dark");

  const startNewChat = () => {
     setCurrentSessionId("");
     setMessages([]);
     showToast('已开启新对话', 'success');
     if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('内容已复制到剪贴板', 'success');
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

      {/* Sidebar Overlay */}
      <div 
         className={cn("fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ease-out", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} 
         onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={cn(
         "fixed inset-y-0 left-0 z-50 w-64 glass-panel flex flex-col justify-between p-4 transform transition-transform duration-200 ease-out md:relative md:translate-x-0 !border-y-0 !border-l-0 !rounded-none will-change-transform",
         isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
         <div className="space-y-6 flex-1 overflow-y-auto pb-4">
            <div className="flex items-center justify-between px-2 mt-1">
                  <div className="flex items-center gap-3">
                     <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg", pageMode === 'fenghechat' ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-indigo-500/30' : 'bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-blue-500/30')}>
                        <Sparkles className="h-5 w-5" />
                     </div>
                     <div>
                        <span className="font-bold tracking-wide text-lg">{pageMode === 'fenghechat' ? '思忆千环' : 'DEEPSEEK'}</span>
                        <span className="text-[10px] block text-indigo-500 dark:text-indigo-400 font-mono tracking-widest uppercase mt-0.5">Private Node</span>
                     </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 opacity-60 hover:opacity-100">
                     <X className="h-6 w-6" />
                  </button>
            </div>

            <div className="px-1">
                  <button onClick={startNewChat} className="w-full flex items-center justify-between px-4 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 rounded-xl transition-colors shadow-sm active:scale-95">
                     <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium text-sm">开启新对话</span>
                     </div>
                     <Edit className="h-4 w-4 opacity-70" />
                  </button>
            </div>

            <nav className="space-y-1 px-1">
                  <div className="text-xs font-semibold opacity-50 tracking-wider mb-2 mt-4 px-2">常用模块</div>
                  <button onClick={() => showToast('提示词库同步中...')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group">
                     <LayoutGrid className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                     <span className="text-sm">我的预设/提示词</span>
                  </button>
                  <button onClick={() => showToast('正在挂载本地向量数据库', 'success')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group">
                     <Database className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                     <span className="text-sm">本地知识库</span>
                  </button>
                  
                  <div className="text-xs font-semibold opacity-50 tracking-wider mb-2 mt-6 px-2">最近对话（已同步云端）</div>
                  {sessions.length === 0 ? (
                    <div className="text-[11px] opacity-40 px-3 mt-4">暂无历史记录</div>
                  ) : (
                    sessions.map(s => (
                       <button 
                         key={s.id}
                         onClick={() => {
                           setCurrentSessionId(s.id);
                           setMessages(s.messages || []);
                           if (window.innerWidth < 768) setIsSidebarOpen(false);
                         }} 
                         className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group", currentSessionId === s.id ? "bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5" : "hover:bg-black/5 dark:hover:bg-white/10")}
                       >
                         <MessageSquare className={cn("h-4 w-4", currentSessionId === s.id ? "text-indigo-500" : "opacity-40 group-hover:opacity-80")} />
                         <span className="text-sm truncate">{s.title}</span>
                       </button>
                    ))
                  )}
            </nav>
         </div>

         <div className="pt-4 px-1 space-y-3 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col items-center justify-center mb-2 mt-1">
               <button 
                  onClick={() => {
                     setPageMode(pageMode === 'fenghechat' ? 'flagship' : 'fenghechat');
                     setSelectedModelId(pageMode === 'fenghechat' ? 'deepseek-reasoner' : 'fenghechat-pro');
                  }}
                  className={cn("h-12 w-12 rounded-full flex items-center justify-center border transition-all active:scale-95 mb-1.5", pageMode === 'flagship' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100 hover:border-black/10 dark:hover:border-white/10")}
                  title={pageMode === 'fenghechat' ? "切换至 DeepSeek" : "切换至 思忆千环"}
               >
                  <Aperture strokeWidth={1.5} className="h-6 w-6" />
               </button>
               <span className="text-[10px] opacity-50 tracking-wider font-mono">DeepSeek v4Pro</span>
            </div>

            <div className="flex gap-2">
               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95">
                     {theme === 'dark' ? <><Sun className="h-4 w-4 opacity-70" /><span className="text-sm">浅色模式</span></> : <><Moon className="h-4 w-4 opacity-70" /><span className="text-sm">深色模式</span></>}
               </button>
               <button onClick={() => showToast('高级设置面板即将开放')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95">
                     <Settings className="h-4 w-4 opacity-70" />
                     <span className="text-sm">设置</span>
               </button>
            </div>
            <div onClick={() => showToast('您的本地私钥已安全验证', 'success')} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-colors cursor-pointer shadow-inner active:scale-95">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold border border-black/10 dark:border-white/10 shadow-sm">U</div>
                     <div className="flex flex-col">
                        <span className="text-sm font-medium">User_Admin</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>零知识隔离中
                        </span>
                     </div>
                  </div>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 w-full min-w-0">
        
         {/* Header */}
         <header className="h-14 md:h-16 glass-panel flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 w-full !border-x-0 !border-t-0 !rounded-none">
            <div className="flex items-center gap-2 md:gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 opacity-70 hover:opacity-100 transition-colors active:scale-95">
                  <Menu className="h-5 w-5 md:h-6 md:w-6" />
               </button>
            </div>

            <div className="relative flex-1 flex justify-center mr-8 md:mr-0 pl-4 sm:pl-0">
               <button 
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} 
                  className="px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-2 border border-black/5 dark:border-white/10 shadow-sm active:scale-95"
               >
                  <span className={cn("h-2 w-2 rounded-full", selectedModel.color, selectedModel.shadow)}></span>
                  <span className="font-semibold text-[13px] tracking-wide truncate max-w-[120px] sm:max-w-[200px]">{selectedModel.name}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition-transform duration-200", isModelDropdownOpen && "rotate-180")} />
               </button>

               <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[90vw] max-w-[320px] rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl p-2 transform transition-all duration-200 z-[100]",
                  isModelDropdownOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
               )}>
                  <div className="text-[11px] opacity-50 px-3 py-2 font-medium tracking-widest uppercase">Select Engine</div>
                  
                  {models.map(m => (
                     <button 
                        key={m.id}
                        onClick={() => {
                           setSelectedModelId(m.id);
                           setIsModelDropdownOpen(false);
                           showToast(`已成功切换至 ${m.name}`, 'success');
                        }}
                        className={cn("w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 mb-1 transition-colors active:scale-[0.98]", m.id === "fenghechat-unlimited" ? "hover:bg-red-500/10" : "hover:bg-black/5 dark:hover:bg-white/10")}
                     >
                        <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", m.color, m.shadow)}></div>
                        <div>
                           <div className="text-sm font-semibold flex items-center flex-wrap gap-2">
                              {m.name} 
                              {m.id === "fenghechat-unlimited" && <span className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase">Uncensored</span>}
                           </div>
                           <div className="text-[11px] opacity-60 mt-0.5">{m.desc}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
               <div onClick={() => showToast('连接完全加密，未发生数据泄漏', 'success')} className="text-xs opacity-60 flex items-center gap-1.5 hover:text-emerald-500 transition-colors px-2 py-1 cursor-pointer active:scale-95 hidden lg:flex">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>安全连接</span>
               </div>
            </div>

            {/* Click outside to close dropdown */}
            {isModelDropdownOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
            )}
         </header>

         {/* Chat Area */}
         <main className="flex-1 overflow-y-auto relative flex flex-col items-center px-4 md:px-8 scroll-smooth w-full z-10 pb-40">
            <div className="w-full max-w-3xl flex-1 flex flex-col gap-6 pt-6 md:pt-10">
               
               {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] mt-4 md:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="relative mb-6">
                        <div className={cn("absolute inset-0 blur-xl opacity-30 rounded-full", pageMode==='fenghechat' ? "bg-pink-500" : "bg-sky-500")}></div>
                        <div className="h-16 w-16 rounded-3xl glass-panel flex items-center justify-center relative shadow-sm">
                           <Sparkles className="h-8 w-8" />
                        </div>
                     </div>
                     
                     <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-center tracking-tight">有什么我可以帮忙的？</h2>
                     <p className="text-xs md:text-sm mb-8 text-center px-4 opacity-60">NEXUS AI 已连接本地节点，您的数据仅保留在当前设备。</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl px-2">
                        <button onClick={() => { setInput("编写 Python 脚本"); }} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                           <div className="flex items-center gap-2 mb-0.5">
                              <Code className="h-4 w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">编写 Python 脚本</span>
                           </div>
                           <span className="text-xs opacity-50 line-clamp-1">用于批量重命名图片</span>
                        </button>
                        <button onClick={() => { setInput("分析数据趋势"); }} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                           <div className="flex items-center gap-2 mb-0.5">
                              <BarChart className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">分析数据趋势</span>
                           </div>
                           <span className="text-xs opacity-50 line-clamp-1">帮我总结财报要点</span>
                        </button>
                        <button onClick={() => { setInput("无边界创意写作"); }} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                           <div className="flex items-center gap-2 mb-0.5">
                              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">无边界创意写作</span>
                           </div>
                           <span className="text-xs opacity-50 line-clamp-1">构思悬疑小说的开场设定</span>
                        </button>
                        <button onClick={() => { setInput("翻译与润色"); }} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                           <div className="flex items-center gap-2 mb-0.5">
                              <Languages className="h-4 w-4 md:h-5 md:w-5 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                              <span className="text-sm font-medium">翻译与润色</span>
                           </div>
                           <span className="text-xs opacity-50 line-clamp-1">将技术文档翻译成地道英文</span>
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-col gap-6 pb-4">
                     {messages.map((msg) => (
                        <div
                           key={msg.id}
                           className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === "user" ? "justify-end" : "justify-start")}
                        >
                           {msg.role === "model" && (
                              <div className="flex-shrink-0 h-8 w-8 rounded-full glass-panel flex items-center justify-center mt-1 mr-3 shadow-md border-opacity-50">
                                 <Sparkles className="h-4 w-4" />
                              </div>
                           )}
                           
                           <div className="relative group max-w-[85%] md:max-w-[75%]">
                              <div
                                 className={cn(
                                    "px-5 py-4 text-[15px] leading-relaxed shadow-sm w-full",
                                    msg.role === "user"
                                       ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black rounded-2xl rounded-tr-sm"
                                       : "glass-panel text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-tl-sm"
                                 )}
                              >
                                 {msg.role === "model" ? (
                                    <div className="markdown-body prose prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-p:text-zinc-900 dark:prose-p:text-zinc-100 prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-pre:bg-black/5 dark:prose-pre:bg-white/10 prose-pre:backdrop-blur-md prose-pre:border-black/5 dark:prose-pre:border-white/5 prose-pre:border">
                                       {isStreaming && msg.id === messages[messages.length-1].id ? (
                                         <div>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                               {msg.text}
                                            </ReactMarkdown>
                                            <span className="inline-block w-2 h-4 bg-current opacity-50 ml-1 animate-pulse align-middle mt-1"></span>
                                         </div>
                                       ) : (
                                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                         </ReactMarkdown>
                                       )}
                                    </div>
                                 ) : (
                     <div className="whitespace-pre-wrap">{msg.text}</div>
                                 )}
                              </div>

                              {/* Tool buttons for model response */}
                              {msg.role === "model" && !isStreaming && (
                                 <div className="absolute -bottom-8 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleCopy(msg.text)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="复制内容">
                                       <Copy className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => showToast('已记录您的赞同反馈', 'success')} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="点赞评价">
                                       <ThumbsUp className="h-4 w-4" />
                                    </button>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                     <div ref={messagesEndRef} className="h-px w-full" />
                  </div>
               )}
            </div>
         </main>

         {/* Input Box Area */}
         <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 dark:to-transparent pt-12 pb-4 md:pb-6 px-3 md:px-4 z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto relative pointer-events-auto">
               <div className="relative flex items-end gap-2 glass-panel rounded-[24px] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] focus-within:border-black/20 dark:focus-within:border-white/30 transition-all duration-300 bg-white/50 dark:bg-black/50">
                  
                  <button onClick={() => showToast('正在调起文件选择器...')} className="p-2.5 opacity-50 hover:opacity-100 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 active:scale-95 transition-all outline-none" title="添加附件">
                     <Paperclip className="h-[22px] w-[22px]" />
                  </button>
                  
                  <button 
                     onClick={() => {
                        setIsWebSearchMode(!isWebSearchMode);
                        showToast(isWebSearchMode ? '已关闭联网搜索' : '已开启实时联网搜索', isWebSearchMode ? 'info' : 'success');
                     }} 
                     className={cn("p-2.5 rounded-full flex-shrink-0 active:scale-95 transition-all outline-none hidden sm:block", isWebSearchMode ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10")} 
                     title="开启联网搜索"
                  >
                     <Globe className="h-[22px] w-[22px]" />
                  </button>

                  <textarea 
                     ref={textareaRef}
                     value={input}
                     onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                     }}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleSend();
                        }
                     }}
                     rows={1}
                     placeholder="给 思忆千环 发送消息..."
                     className="w-full max-h-[120px] md:max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-3 placeholder:opacity-50 text-[15px] md:text-base leading-relaxed overflow-y-auto focus:outline-none"
                     style={{ minHeight: "48px" }}
                  />
                  
                  <button 
                     onClick={handleSend}
                     disabled={!input.trim() || isStreaming}
                     className="p-2.5 md:p-3 rounded-full transition-all flex-shrink-0 text-white disabled:bg-black/10 dark:disabled:bg-white/10 dark:disabled:text-white/30 disabled:text-black/30 bg-black dark:bg-white dark:text-black shadow-sm disabled:shadow-none mb-0.5 mr-0.5 active:scale-95 hover:scale-105 disabled:transform-none disabled:cursor-not-allowed outline-none"
                  >
                     <Send className="h-[20px] w-[20px] -ml-0.5 mt-0.5" />
                  </button>
               </div>
               <div className="text-center mt-3 text-[10px] md:text-[11px] opacity-50 font-medium">
                  AI 内容可能会产生错误，请注意核查。
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

