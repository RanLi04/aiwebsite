import React, { useState, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "../utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ThinkingBlock = React.memo(function MessageContent({ text, isStreaming, isLast, supportsThinking, isWebSearch }: { text: string, isStreaming: boolean, isLast: boolean, supportsThinking: boolean, isWebSearch?: boolean }) {
  const thinkStart = text.indexOf("<think>");
  const thinkEnd = text.indexOf("</think>", thinkStart);
  
  const thinkComplete = thinkEnd !== -1;
  const isThinking = isStreaming && isLast && thinkStart !== -1 && !thinkComplete;
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (isThinking || (isStreaming && !text && isWebSearch)) {
      setIsExpanded(true);
    } else if (thinkComplete && isLast && isStreaming) {
      setIsExpanded(false);
    }
  }, [isThinking, thinkComplete, isLast, isStreaming, isWebSearch, text]);

  let thinkText = "";
  let mainText = text;
  
  if (thinkStart !== -1) {
    if (thinkComplete) {
      thinkText = text.substring(thinkStart + 7, thinkEnd).trim();
      mainText = (text.substring(0, thinkStart) + text.substring(thinkEnd + 8)).trim();
    } else {
      thinkText = text.substring(thinkStart + 7).trim();
      mainText = text.substring(0, thinkStart).trim();
    }
  }

  // Determine if we should show the thinking block. 
  // If it's streaming and we haven't received anything yet, we can pretend it's thinking to give the user peace of mind, IF the model supports thinking natively.
  const showThinkingBlock = thinkStart !== -1 || (isStreaming && !text && (supportsThinking || isWebSearch));
  const isCurrentlyThinking = isThinking || (isStreaming && !text && (supportsThinking || isWebSearch));

  let statusText = "已完成思考";
  if (isCurrentlyThinking) {
      if (thinkStart !== -1) statusText = "深度思考中...";
      else if (isWebSearch && !text) statusText = "联网检索中...";
      else statusText = "引擎启动与网络调度中...";
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {showThinkingBlock && (
        <div className="rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden mt-1 mb-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <Sparkles className={cn("h-3.5 w-3.5", isCurrentlyThinking ? "animate-pulse text-indigo-500" : "")} />
              <span>{statusText}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
          </button>
          
          {isExpanded && (
            <div className="px-4 py-3 text-[13px] opacity-70 border-t border-black/10 dark:border-white/10 font-mono whitespace-pre-wrap leading-relaxed">
              {thinkText || (isStreaming && thinkStart === -1 ? (isWebSearch ? "正在执行搜索并提取相关内容，请稍候..." : "正在等待模型节点返回数据，这可能需要几秒钟时间...") : "")}
              {isCurrentlyThinking && <span className="inline-block w-2 h-3 bg-current ml-1 animate-pulse align-middle"></span>}
            </div>
          )}
        </div>
      )}
      
      {mainText && (
        <div className="markdown-body prose prose-zinc dark:prose-invert max-w-none prose-p:my-1 prose-p:text-zinc-900 dark:prose-p:text-zinc-100 prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-pre:bg-black/5 dark:prose-pre:bg-white/10 prose-pre:backdrop-blur-md prose-pre:border-black/5 dark:prose-pre:border-white/5 prose-pre:border">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {mainText}
           </ReactMarkdown>
        </div>
      )}
      {isStreaming && isLast && !isThinking && mainText && (
        <span className="inline-block w-2 h-4 bg-current opacity-50 -ml-1 animate-pulse align-middle mt-2"></span>
      )}
    </div>
  );
});
