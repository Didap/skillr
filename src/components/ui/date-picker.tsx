"use client"

import * as React from "react"
import { format } from "date-fns"
import { it } from "react-day-picker/locale"
import { CalendarIcon } from "lucide-react"

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
  placeholder = "Seleziona una data",
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
              "w-full justify-start text-left font-semibold h-12 rounded-xl border-border-subtle bg-white shadow-sm hover:bg-surface-warm/20 transition-all px-4",
              !value && "text-text-muted",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-3 size-4 text-primary" />
        {value ? (
          <span className="text-text-primary font-semibold">
            {format(value, "dd/MM/yyyy", { locale: it as any })}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="top">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          locale={it as any}
          disabled={disablePast ? { before: new Date() } : undefined}
          className="rounded-2xl"
        />
      </PopoverContent>
    </Popover>
  )
}
