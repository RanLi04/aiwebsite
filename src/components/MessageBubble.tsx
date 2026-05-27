import React from "react";
import { Message } from "../types";
import { Copy, ThumbsUp, Sparkles } from "lucide-react";
import { cn } from "../utils";
import { ThinkingBlock } from "./ThinkingBlock";

interface MessageBubbleProps {
  msg: Message;
  isStreaming: boolean;
  isLast: boolean;
  supportsThinking: boolean;
  onCopy: (text: string) => void;
  onFeedback: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isStreaming, isLast, supportsThinking, onCopy, onFeedback }) => {
  return (
    <div className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === "user" ? "justify-end" : "justify-start")}>
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
            <ThinkingBlock text={msg.text} isStreaming={isStreaming} isLast={isLast} supportsThinking={supportsThinking} />
          ) : (
            <div className="whitespace-pre-wrap">{msg.text}</div>
          )}
        </div>

        {/* Tool buttons for model response */}
        {msg.role === "model" && !isStreaming && (
          <div className="absolute -bottom-8 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button onClick={() => onCopy(msg.text)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="复制内容">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={onFeedback} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="点赞评价">
              <ThumbsUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
