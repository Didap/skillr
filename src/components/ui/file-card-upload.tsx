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
      <Label className="text-label text-viola ml-1">{label}</Label>
      <div 
        className={cn(
          "relative group rounded-card border-2 border-dashed transition-colors p-6 has-focus-visible:border-ring",
          value ? "border-solid border-viola/15 bg-white" : "border-viola-200 bg-crema hover:border-viola-400"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            value ? "bg-rosa text-viola" : "bg-white text-viola-400"
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
            <h4 className="text-sm font-semibold text-viola truncate">
              {value ? "Documento caricato" : description}
            </h4>
            <p className="text-label text-viola-400 mt-1">
              {value ? "Clicca per sostituire" : "PDF o Immagine. Max 5MB"}
            </p>
          </div>

          {value && !isUploading && (
            <button 
              type="button"
              onClick={removeFile}
              aria-label="Rimuovi documento"
              // Above the invisible file input, otherwise tapping it opens the file picker
              className="pressable relative z-10 w-11 h-11 flex items-center justify-center hover:bg-crema text-viola-400 hover:text-viola transition-colors rounded-full"
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
