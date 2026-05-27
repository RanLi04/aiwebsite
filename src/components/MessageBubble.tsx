import React, { useState } from "react";
import { Message } from "../types";
import { Copy, ThumbsUp, Sparkles, RefreshCcw, Edit2, Check, X } from "lucide-react";
import { cn } from "../utils";
import { ThinkingBlock } from "./ThinkingBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MessageBubbleProps {
  msg: Message;
  isStreaming: boolean;
  isLast: boolean;
  supportsThinking: boolean;
  onCopy: (text: string) => void;
  onFeedback: () => void;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isStreaming, isLast, supportsThinking, onCopy, onFeedback, onRegenerate, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
       onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 group/msg", msg.role === "user" ? "justify-end" : "justify-start")}>
      {msg.role === "model" && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full glass-panel flex items-center justify-center mt-1 mr-3 shadow-md border-opacity-50">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      
      <div className="relative group max-w-[85%] md:max-w-[75%]">
        <div
          className={cn(
            "px-4 py-3 md:px-5 md:py-4 text-[15px] leading-relaxed shadow-sm w-full",
            msg.role === "user"
              ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black rounded-2xl rounded-tr-sm"
              : "glass-panel text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-tl-sm"
          )}
        >
          {msg.role === "model" ? (
            <ThinkingBlock text={msg.text} isStreaming={isStreaming} isLast={isLast} supportsThinking={supportsThinking} isWebSearch={msg.isWebSearch} />
          ) : (
            isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <textarea 
                   value={editText} 
                   onChange={e => setEditText(e.target.value)}
                   className="w-full bg-black/10 dark:bg-white/10 text-current border-none rounded-lg p-2 focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 resize-none outline-none leading-relaxed"
                   rows={Math.min(10, editText.split('\n').length || 1)}
                   autoFocus
                />
                <div className="flex justify-end gap-2">
                   <button onClick={() => setIsEditing(false)} className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/20"><X className="h-4 w-4" /></button>
                   <button onClick={handleSaveEdit} className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/20"><Check className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{msg.text}</div>
            )
          )}
        </div>

        {/* Tool buttons for model response */}
        {msg.role === "model" && !isStreaming && (
          <div className="absolute -bottom-8 left-2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10">
            <button onClick={() => onCopy(msg.text)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="复制内容">
              <Copy className="h-4 w-4" />
            </button>
            {onRegenerate && isLast && (
              <button onClick={onRegenerate} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="重新生成">
                <RefreshCcw className="h-4 w-4" />
              </button>
            )}
            <button onClick={onFeedback} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="好评">
              <ThumbsUp className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tool buttons for user message */}
        {msg.role === "user" && !isStreaming && onEdit && !isEditing && (
          <div className="absolute -bottom-8 right-2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10">
            <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95" title="编辑消息">
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
