"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { uploadImageAction } from "@/app/actions/upload";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
        toast.error(result.error || "Errore durante l'upload");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Errore di connessione";
      toast.error(message);
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
      <Label className="text-label text-viola ml-1">{label}</Label>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className={cn(
            "w-24 h-24 rounded-card border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
            value ? "border-solid border-transparent" : "border-viola-200 bg-crema hover:border-viola-400 has-focus-visible:border-ring"
          )}>
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-viola-400 animate-spin" />
            ) : value ? (
              <Image src={value} alt="Upload" fill className="object-cover" unoptimized />
            ) : (
              <Camera className="w-8 h-8 text-viola-400 group-hover:text-viola transition-colors" strokeWidth={1.75} />
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
              type="button"
              onClick={removePhoto}
              aria-label="Rimuovi foto"
              className="absolute z-10 -top-2 -right-2 w-6 h-6 bg-viola text-white rounded-full ring-2 ring-white flex items-center justify-center hover:bg-viola-700 transition-colors before:absolute before:-inset-2.5 before:content-['']"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-viola-500 leading-tight">
            {value ? "Ottima scelta! Puoi cambiarla quando vuoi." : "Una buona foto aumenta le probabilità di match del 30%."}
          </p>
          {!value && (
             <p className="text-label text-viola-400 mt-1">
               JPG, PNG o WEBP. Max 5MB.
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
