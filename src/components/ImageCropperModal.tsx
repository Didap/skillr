"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperModalProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ image, onCropComplete, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleComplete = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold italic">Ritaglia Foto</h3>
            <p className="text-xs text-slate-400 font-medium">Trascina per posizionare, usa lo zoom per regolare</p>
          </div>
          <Button variant="ghost" onClick={onCancel} className="rounded-full w-10 h-10 p-0">
            <X size={20} />
          </Button>
        </div>

        <div className="relative flex-1 min-h-[400px] bg-slate-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape="rect"
            showGrid={false}
          />
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-1 accent-emerald-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 rounded-2xl h-12 font-bold border-slate-200 hover:bg-slate-50 transition-all"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleComplete} 
              className="flex-1 rounded-2xl h-12 font-bold bg-slate-950 hover:bg-emerald-600 text-white gap-2 transition-all"
            >
              <Check size={18} /> Conferma
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
