"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl"
  /** Optional message to display below the spinner */
  message?: string
  /** Whether to show in full page mode (centered with min-height) */
  fullPage?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
}

export function LoadingSpinner({
  size = "lg",
  message,
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      </div>
      {message && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>{message}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center rounded-2xl border border-border/70 bg-card/50">
        {content}
      </div>
    )
  }

  return content
}

/** Skeleton loader for cards */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-2xl border border-border/70 bg-card/75 p-6", className)}>
      <div className="space-y-3">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  )
}

/** Skeleton loader for tables */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
        {/* Header */}
        <div className="bg-muted/50 p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-muted" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 border-t border-border/60 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 flex-1 rounded bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Grid of card skeletons */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
