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
              "w-full justify-start text-left font-medium h-14 rounded-full border-transparent bg-crema hover:bg-crema hover:border-viola-200 aria-expanded:bg-crema aria-expanded:border-ring px-6",
              !value && "text-viola-400",
              value && "text-viola",
              className
            )}
          >
            <span className="text-lg">
              {value ? format(value, "dd/MM/yyyy", { locale: it }) : placeholder}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0 rounded-card overflow-hidden" align="start" side="top" sideOffset={8}>
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
