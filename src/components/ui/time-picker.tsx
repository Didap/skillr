"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  className?: string
  disabled?: boolean
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 8).toString().padStart(2, "0")) // 08-19
const MINUTES = ["00", "15", "30", "45"]

export function TimePicker({
  value = "09:00",
  onChange,
  className,
  disabled = false,
}: TimePickerProps) {
  const [hours, minutes] = value.split(":")

  const handleHourChange = (h: string | null) => {
    if (h) onChange?.(`${h}:${minutes}`)
  }

  const handleMinuteChange = (m: string | null) => {
    if (m) onChange?.(`${hours}:${m}`)
  }

  return (
    <div className={cn(
      "flex items-center h-14 rounded-2xl bg-slate-50 border-2 border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all px-4 gap-0 shadow-sm",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      <div className="flex-1">
        <Select value={hours} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="border-none bg-transparent shadow-none font-bold text-2xl h-full px-0 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top" className="rounded-2xl border-slate-100 shadow-premium">
            {HOURS.map((h) => (
              <SelectItem key={h} value={h} className="font-bold text-lg rounded-xl focus:bg-emerald-50 focus:text-emerald-600">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <span className="text-2xl font-display font-black text-slate-300 pb-1">:</span>
      
      <div className="flex-1 pl-4">
        <Select value={minutes} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="border-none bg-transparent shadow-none font-bold text-2xl h-full px-0 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top" className="rounded-2xl border-slate-100 shadow-premium">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="font-bold text-lg rounded-xl focus:bg-emerald-50 focus:text-emerald-600">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
