import React from "react";
import { Message, PageMode } from "../types";
import { Sparkles, Code, BarChart, BookOpen, Languages } from "lucide-react";
import { cn } from "../utils";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  pageMode: PageMode;
  supportsThinking: boolean;
  onCopy: (text: string) => void;
  onFeedback: () => void;
  onRegenerate: () => void;
  onEdit: (id: string, text: string) => void;
  onSuggestionClick: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  pageMode,
  supportsThinking,
  onCopy,
  onFeedback,
  onRegenerate,
  onEdit,
  onSuggestionClick,
  messagesEndRef
}) => {
  return (
    <main className="flex-1 overflow-y-auto relative flex flex-col items-center px-4 md:px-8 scroll-smooth w-full z-10 pb-40">
      <div className="w-full max-w-3xl flex-1 flex flex-col gap-6 pt-6 md:pt-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] mt-4 md:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-6">
              <div className={cn("absolute inset-0 blur-xl opacity-30 rounded-full", pageMode === 'fenghechat' ? "bg-pink-500" : "bg-sky-500")}></div>
              <div className="h-16 w-16 rounded-3xl glass-panel flex items-center justify-center relative shadow-sm">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-center tracking-tight">有什么我可以帮忙的？</h2>
            <p className="text-xs md:text-sm mb-8 text-center px-4 opacity-60">NEXUS AI 已连接本地节点，您的数据仅保留在当前设备。</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl px-2">
              <button onClick={() => onSuggestionClick("编写 Python 脚本")} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                <div className="flex items-center gap-2 mb-0.5">
                  <Code className="h-4 w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">编写 Python 脚本</span>
                </div>
                <span className="text-xs opacity-50 line-clamp-1">用于批量重命名图片</span>
              </button>
              <button onClick={() => onSuggestionClick("分析数据趋势")} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                <div className="flex items-center gap-2 mb-0.5">
                  <BarChart className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">分析数据趋势</span>
                </div>
                <span className="text-xs opacity-50 line-clamp-1">帮我总结财报要点</span>
              </button>
              <button onClick={() => onSuggestionClick("无边界创意写作")} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">无边界创意写作</span>
                </div>
                <span className="text-xs opacity-50 line-clamp-1">构思悬疑小说的开场设定</span>
              </button>
              <button onClick={() => onSuggestionClick("翻译与润色")} className="p-4 rounded-2xl glass-panel text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all flex flex-col gap-2 group active:scale-95">
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
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isStreaming={isStreaming}
                isLast={idx === messages.length - 1}
                supportsThinking={supportsThinking}
                onCopy={onCopy}
                onFeedback={onFeedback}
                onRegenerate={onRegenerate}
                onEdit={(newText) => onEdit(msg.id, newText)}
              />
            ))}
            <div ref={messagesEndRef} className="h-px w-full" />
          </div>
        )}
      </div>
    </main>
  );
};
