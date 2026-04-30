"use client"

import * as React from "react"
import { Clock } from "lucide-react"
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
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative flex-1">
        <Select value={hours} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="h-12 rounded-xl border-border-subtle bg-white shadow-sm font-bold text-lg pl-11 hover:bg-surface-warm/20 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {HOURS.map((h) => (
              <SelectItem key={h} value={h} className="font-bold text-base">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none opacity-40" />
      </div>
      <span className="text-lg font-bold text-text-muted/30 select-none pb-0.5">:</span>
      <div className="flex-1">
        <Select value={minutes} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="h-12 rounded-xl border-border-subtle bg-white shadow-sm font-bold text-lg hover:bg-surface-warm/20 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="font-bold text-base">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
