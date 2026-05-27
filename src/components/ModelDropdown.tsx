import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils";

interface ModelInfo {
  id: string;
  name: string;
  color: string;
  desc: string;
  shadow: string;
}

interface ModelDropdownProps {
  models: ModelInfo[];
  selectedModel: ModelInfo;
  setSelectedModelId: (id: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (val: boolean) => void;
  showToast: (msg: string, type?: 'info'|'success'|'error') => void;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  models,
  selectedModel,
  setSelectedModelId,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  showToast
}) => {
  return (
    <>
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
      
      {/* Click outside to close dropdown */}
      {isModelDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
      )}
    </>
  );
};
