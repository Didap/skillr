"use client";

import { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { uploadImageAction } from "@/app/actions/upload";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  className?: string;
}

export function PhotoUpload({ value, onChange, label, className }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadImageAction(formData);
      if (result.success && result.url) {
        onChange(result.url);
      } else {
        alert(result.error || "Errore durante l'upload");
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="font-bold text-slate-700 ml-1">{label}</label>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className={cn(
            "w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all",
            value ? "border-solid border-emerald-500" : "hover:border-emerald-400 bg-slate-50/50"
          )}>
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            ) : value ? (
              <img src={value} alt="Upload" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
          
          {value && !isUploading && (
            <button 
              onClick={removePhoto}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 leading-tight">
            {value ? "Ottima scelta! Puoi cambiarla quando vuoi." : "Una buona foto aumenta le probabilità di match del 30%."}
          </p>
          {!value && (
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
               JPG, PNG o WEBP. Max 5MB.
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
