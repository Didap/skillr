"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-viola-950 group-[.toaster]:border-viola-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-viola-950 dark:group-[.toaster]:text-viola-50 dark:group-[.toaster]:border-viola-800",
          description: "group-[.toast]:text-viola-500 dark:group-[.toast]:text-viola-400",
          actionButton:
            "group-[.toast]:bg-viola-900 group-[.toast]:text-viola-50 dark:group-[.toast]:bg-viola-50 dark:group-[.toast]:text-viola-900",
          cancelButton:
            "group-[.toast]:bg-viola-100 group-[.toast]:text-viola-500 dark:group-[.toast]:bg-viola-800 dark:group-[.toast]:text-viola-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
