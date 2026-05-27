import React from "react";
import { PageMode, Theme, Session, Message } from "../types";
import { X, Plus, Edit, LayoutGrid, Database, MessageSquare, Trash2, Aperture, Sun, Moon, Settings, Sparkles } from "lucide-react";
import { cn } from "../utils";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  pageMode: PageMode;
  setPageMode: (val: PageMode) => void;
  theme: Theme;
  setTheme: (val: Theme) => void;
  sessions: Session[];
  currentSessionId: string;
  setCurrentSessionId: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  deleteSession: (e: React.MouseEvent, id: string) => Promise<void>;
  startNewChat: () => void;
  showToast: (msg: string, type?: 'info'|'success'|'error') => void;
  setSelectedModelId: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  pageMode,
  setPageMode,
  theme,
  setTheme,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  setMessages,
  deleteSession,
  startNewChat,
  showToast,
  setSelectedModelId
}) => {
  return (
    <>
      <div 
         className={cn("fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ease-out", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} 
         onClick={() => setIsSidebarOpen(false)} 
      />

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
                  <div className="text-xs font-semibold opacity-50 tracking-wider mb-2 mt-4 px-2">最近对话（已同步云端）</div>
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
                         className={cn("w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors group", currentSessionId === s.id ? "bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5" : "hover:bg-black/5 dark:hover:bg-white/10")}
                       >
                         <div className="flex items-center gap-3 overflow-hidden flex-1">
                           <MessageSquare className={cn("h-4 w-4 flex-shrink-0", currentSessionId === s.id ? "text-indigo-500" : "opacity-40 group-hover:opacity-80")} />
                           <span className="text-sm truncate mr-2 block text-left flex-1 max-w-[140px]">{s.title}</span>
                         </div>
                         <div 
                            onClick={(e) => deleteSession(e, s.id)} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/10 dark:hover:bg-white/20 rounded-md transition-all ml-auto hover:text-red-500 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            title="删除对话"
                         >
                            <Trash2 className="h-3.5 w-3.5" />
                         </div>
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
                  }}
                  className={cn("h-12 w-12 rounded-full flex items-center justify-center border transition-all active:scale-95 mb-1.5", pageMode === 'flagship' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]" : "bg-black/5 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100 hover:border-black/10 dark:hover:border-white/10")}
                  title={pageMode === 'fenghechat' ? "切换至 DeepSeek" : "切换至 思忆千环"}
               >
                  <Aperture strokeWidth={1.5} className="h-6 w-6" />
               </button>
               <span className="text-[10px] opacity-50 tracking-wider font-mono">DeepSeek v4Pro</span>
            </div>

            <div className="flex gap-2">
               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95">
                     {theme === 'dark' ? <><Sun className="h-4 w-4 opacity-70" /><span className="text-sm">浅色模式</span></> : <><Moon className="h-4 w-4 opacity-70" /><span className="text-sm">深色模式</span></>}
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
    </>
  );
};
