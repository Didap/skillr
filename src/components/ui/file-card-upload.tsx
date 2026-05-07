"use client";

import { useState } from "react";
import { Loader2, X, Upload, CheckCircle2 } from "lucide-react";
import { uploadFileAction } from "@/app/actions/upload-file";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileCardUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  description: string;
  accept?: string;
  className?: string;
}

export function FileCardUpload({ value, onChange, label, description, accept = ".pdf,image/*", className }: FileCardUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadFileAction(formData);
      if (result.success && result.url) {
        onChange(result.url);
        toast.success("File caricato con successo!");
      } else {
        toast.error(result.error || "Errore durante l'upload");
      }
    } catch (err) {
      console.error(err);
      toast.error("Errore di connessione");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="font-bold text-slate-700 ml-1">{label}</Label>
      <div 
        className={cn(
          "relative group rounded-3xl border-2 border-dashed transition-all p-6",
          value ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-white"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
            value ? "bg-emerald-500 text-white" : "bg-white text-slate-300 shadow-sm"
          )}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : value ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {value ? "Documento caricato" : description}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {value ? "Clicca per sostituire" : "PDF o Immagine. Max 5MB"}
            </p>
          </div>

          {value && !isUploading && (
            <button 
              onClick={removeFile}
              className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors rounded-xl"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <input 
          type="file" 
          accept={accept} 
          onChange={handleUpload}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
