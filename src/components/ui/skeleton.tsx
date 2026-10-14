import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse motion-reduce:animate-none rounded-md bg-viola-100 dark:bg-viola-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
