"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, suggestions = [], placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return [];
    // Filter duplicates from suggestions and also filter out already selected values
    const uniqueSuggestions = Array.from(new Set(suggestions));
    return uniqueSuggestions
      .filter(s => 
        s.toLowerCase().includes(inputValue.toLowerCase()) && 
        !value.includes(s)
      )
      .slice(0, 5);
  }, [inputValue, suggestions, value]);

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || inputValue).trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue("");
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(",")) {
      const tag = val.slice(0, -1).trim();
      addTag(tag);
    } else {
      setInputValue(val);
      setIsOpen(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[0]);
      } else {
        addTag();
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative space-y-3", className)} ref={containerRef}>
      <div className="flex flex-wrap gap-2 min-h-[48px] p-2 rounded-xl bg-white border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all shadow-sm">
        {value.map((tag) => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="rounded-lg bg-slate-50 border-slate-100 text-slate-700 pr-1 py-1 pl-2.5 flex items-center gap-1.5 shadow-xs"
          >
            <span className="text-[11px] font-bold">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="w-4 h-4 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[140px] px-2 py-1 placeholder:text-slate-300 font-medium"
        />
      </div>

      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-2">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  {suggestion}
                  <Check size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">
        Premi Invio o scegli un suggerimento
      </p>
    </div>
  );
}
