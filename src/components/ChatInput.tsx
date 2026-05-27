import React from "react";
import { Paperclip, Globe, Square, Send } from "lucide-react";
import { cn } from "../utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  onSend: () => void;
  onStop: () => void;
  isWebSearchMode: boolean;
  setIsWebSearchMode: (value: boolean) => void;
  selectedModelName: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  showToast: (msg: string, type?: 'info'|'success'|'error') => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  isStreaming,
  onSend,
  onStop,
  isWebSearchMode,
  setIsWebSearchMode,
  selectedModelName,
  textareaRef,
  showToast
}) => {
  return (
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
                onSend();
              }
            }}
            rows={1}
            placeholder={`给 ${selectedModelName} 发送消息...`}
            className="w-full max-h-[120px] md:max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-3 placeholder:opacity-50 text-[15px] md:text-base leading-relaxed overflow-y-auto focus:outline-none"
            style={{ minHeight: "48px" }}
          />
          
          {isStreaming ? (
            <button 
              onClick={onStop}
              className="p-2.5 md:p-3 rounded-full transition-all flex-shrink-0 text-white bg-black dark:bg-white dark:text-black shadow-sm mb-0.5 mr-0.5 active:scale-95 hover:scale-105 outline-none flex items-center justify-center animate-pulse"
              title="停止生成"
            >
              <Square className="h-[20px] w-[20px] fill-current" />
            </button>
          ) : (
            <button 
              onClick={onSend}
              disabled={!input.trim()}
              className="p-2.5 md:p-3 rounded-full transition-all flex-shrink-0 text-white disabled:bg-black/10 dark:disabled:bg-white/10 dark:disabled:text-white/30 disabled:text-black/30 bg-black dark:bg-white dark:text-black shadow-sm disabled:shadow-none mb-0.5 mr-0.5 active:scale-95 hover:scale-105 disabled:transform-none disabled:cursor-not-allowed outline-none flex items-center justify-center"
            >
              <Send className="h-[20px] w-[20px] -ml-0.5 mt-0.5" />
            </button>
          )}
        </div>
        <div className="text-center mt-3 text-[10px] md:text-[11px] opacity-50 font-medium">
          AI 内容可能会产生错误，请注意核查。
        </div>
      </div>
    </div>
  );
};
