"use client"

import * as React from "react"
import { format, startOfDay } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Only allow dates from today onward */
  disablePast?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "gg/mm/aaaa",
  className,
  disabled = false,
  disablePast = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-bold h-14 rounded-2xl border-2 border-transparent bg-slate-50 shadow-sm hover:bg-white hover:border-emerald-500 transition-all px-6",
              !value && "text-slate-400",
              value && "text-slate-950",
              className
            )}
          >
            <span className="text-xl">
              {value ? format(value, "dd/MM/yyyy", { locale: it }) : placeholder}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0 border-slate-100 shadow-premium rounded-3xl overflow-hidden" align="start" side="top" sideOffset={8}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          locale={it}
          disabled={disablePast ? { before: startOfDay(new Date()) } : undefined}
          className="p-4"
        />
      </PopoverContent>
    </Popover>
  )
}
