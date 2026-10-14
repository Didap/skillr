"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';
import { duration, ease, spring } from '@/lib/motion';

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperModalProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Full-screen cropper on phones (the photo gets the whole screen, controls sit in thumb
 * reach), a centred dialog from md up. Portalled to <body> so it always covers the tab bar.
 */
export default function ImageCropperModal({ image, onCropComplete, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)));
  };

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleComplete = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  // Escape closes; the page behind must not scroll while cropping
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
      exit={{ opacity: 0, transition: { duration: duration.feedback } }}
      className="fixed inset-0 z-100 flex items-stretch md:items-center justify-center md:p-4 bg-viola-950 md:bg-viola-950/80 md:backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-title"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: spring.sheet }}
        exit={{ y: 24, opacity: 0, transition: { duration: duration.feedback, ease: ease.in } }}
        className="w-full md:max-w-2xl flex flex-col bg-viola-950 md:bg-white md:rounded-[2.5rem] overflow-hidden md:shadow-2xl h-dvh md:h-auto md:max-h-[90vh]"
      >
        <div className="pt-safe md:pt-0 shrink-0">
          <div className="h-14 md:h-auto px-2 md:p-6 md:border-b border-viola-100 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={onCancel}
              aria-label="Chiudi"
              className="pressable md:order-last rounded-full w-11 h-11 md:w-10 md:h-10 p-0 text-white md:text-viola-900 hover:bg-white/10 md:hover:bg-viola-100"
            >
              <X size={22} />
            </Button>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h3 id="cropper-title" className="text-xl font-display font-bold text-white md:text-viola-950">Ritaglia Foto</h3>
              <p className="hidden md:block text-xs text-viola-500 font-medium">Trascina per posizionare, usa lo zoom per regolare</p>
            </div>
            {/* Keeps the title centred on phones opposite the close button */}
            <span aria-hidden="true" className="w-11 shrink-0 md:hidden" />
          </div>
        </div>

        <div className="relative flex-1 min-h-0 md:flex-none md:h-[400px] bg-viola-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape="rect"
            showGrid={false}
          />
        </div>

        <div className="shrink-0 px-4 pt-4 md:p-8 space-y-4 md:space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 bg-viola-950 md:bg-white">
          <p className="md:hidden text-center text-sm text-viola-400 font-medium">Trascina per posizionare, pizzica o usa lo zoom</p>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => onZoomChange(zoom - 0.25)}
              aria-label="Riduci zoom"
              className="pressable w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-viola-300 md:text-viola-500 hover:bg-white/10 md:hover:bg-viola-100 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-1 min-w-0 h-11 accent-rosso-500 md:accent-rosso-600 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onZoomChange(zoom + 0.25)}
              aria-label="Aumenta zoom"
              className="pressable w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-viola-300 md:text-viola-500 hover:bg-white/10 md:hover:bg-viola-100 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="pressable flex-1 rounded-2xl h-12 font-bold bg-transparent md:bg-white text-white md:text-viola-900 border-white/20 md:border-viola-200 hover:bg-white/10 md:hover:bg-viola-50 transition-colors"
            >
              Annulla
            </Button>
            <Button
              onClick={handleComplete}
              className="pressable flex-1 rounded-2xl h-12 font-bold bg-white md:bg-viola-950 text-viola-950 md:text-white hover:bg-rosso-50 md:hover:bg-rosso-600 gap-2 transition-colors"
            >
              <Check size={18} /> Conferma
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
